const { pool } = require("../config/db");
function gen() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "";
  for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)];
  return `SW-${r}-ZA`;
}

// StockWell is one shared MySQL schema across all three dev branches, so
// checkout is built on the SAME tables the catalogue (Kanya-dev) and group
// cart (Cial-dev) already read/write: order_details + order_items for the
// order itself, card_details/money_contributions for who paid what, and
// delivery_details for the shared delivery record. That's what lets an
// order built on another branch actually be paid for and tracked here.
exports.pay = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {
      order_id, // an existing order_details row (e.g. confirmed via another branch's cart)
      email = "guest@stockwell.global",
      user_id,
      member_name = "N. Dlamini",
      total,
      items,
      address = "12 Loop St, Cape Town",
      method = "card",
      voucher_code,
      card_id,
    } = req.body;

    let resolvedOrderId = order_id ? Number(order_id) : null;
    let orderItems = [];
    let orderTotal = 0;
    let stokvelId = null;
    let uid = user_id || null;

    if (resolvedOrderId) {
      // PATH A — pay for an order that already exists in order_details
      // (e.g. built on Kanya-dev's catalogue and confirmed via Cial-dev's
      // group cart). We just need the real items + total from the DB.
      const [orderRows] = await conn.query(
        "SELECT * FROM order_details WHERE order_id=? FOR UPDATE",
        [resolvedOrderId],
      );
      if (!orderRows.length) throw new Error("Order not found");
      const existing = orderRows[0];
      if (existing.order_status === "Completed")
        throw new Error("Order already paid");
      stokvelId = existing.stokvel_id;
      uid = uid || existing.user_id;

      const [rows] = await conn.query(
        `SELECT oi.order_item_id, oi.product_id, oi.supplier_price_id, oi.quantity,
                oi.unit_price, oi.subtotal, p.product_name
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
         WHERE oi.order_id = ?`,
        [resolvedOrderId],
      );
      if (!rows.length) throw new Error("Order has no items");
      orderItems = rows.map((r) => ({
        product_id: r.product_id,
        name: r.product_name,
        price: Number(r.unit_price),
        qty: r.quantity,
      }));
      orderTotal = rows.reduce((s, r) => s + Number(r.subtotal), 0);
    } else {
      // PATH B — quick/guest checkout (no pre-existing shared order yet).
      // Still lands on order_details/order_items so it's visible the same
      // way to the catalogue/cart branches, it just gets created here.
      if (!items || !items.length) throw new Error("Cart empty");
      orderItems = items;
      orderTotal = Number(total);
    }

    let finalAmount = orderTotal;
    let discount = 0;
    let voucherId = null;

    // VOUCHER - real DB check
    if (method === "voucher" && voucher_code) {
      const [vRows] = await conn.query(
        "SELECT * FROM vouchers WHERE code=? AND active=1 FOR UPDATE",
        [voucher_code.trim().toUpperCase()],
      );
      if (!vRows.length) throw new Error("Invalid voucher");
      const v = vRows[0];
      if (v.used_count >= v.max_uses) throw new Error("Voucher expired");
      discount =
        v.discount_type === "percent"
          ? (finalAmount * Number(v.discount_value)) / 100
          : Number(v.discount_value);
      discount = Math.min(discount, finalAmount);
      finalAmount = finalAmount - discount;
      voucherId = v.id;
      await conn.query(
        "UPDATE vouchers SET used_count = used_count + 1 WHERE id=?",
        [voucherId],
      );
    }

    // BANK - check card_details available_amount
    if (method === "bank" && card_id) {
      const [cRows] = await conn.query(
        "SELECT * FROM card_details WHERE card_id=? FOR UPDATE",
        [card_id],
      );
      if (!cRows.length) throw new Error("Bank card not found");
      if (Number(cRows[0].available_amount) < finalAmount)
        throw new Error("Insufficient funds: R" + cRows[0].available_amount);
      await conn.query(
        "UPDATE card_details SET available_amount = available_amount - ? WHERE card_id=?",
        [finalAmount, card_id],
      );
    }

    if (!uid && email) {
      const [u] = await conn.query("SELECT user_id FROM users WHERE email=?", [
        email,
      ]);
      uid = u[0]?.user_id || null;
    }

    if (!resolvedOrderId) {
      // Create the shared order now (guest/demo checkout path).
      const [orderRes] = await conn.query(
        "INSERT INTO order_details (user_id, stokvel_id, total_amount, order_status) VALUES (?,?,?,?)",
        [uid, stokvelId, orderTotal, "Pending"],
      );
      resolvedOrderId = orderRes.insertId;
      for (const it of orderItems) {
        let supplierPriceId = it.supplier_price_id;
        if (!supplierPriceId) {
          const [sp] = await conn.query(
            "SELECT supplier_price_id FROM supplier_prices WHERE product_id=? ORDER BY price ASC LIMIT 1",
            [it.product_id],
          );
          supplierPriceId = sp[0]?.supplier_price_id;
        }
        if (!supplierPriceId)
          throw new Error("No supplier price for product " + it.product_id);
        const unitPrice = Number(it.price);
        const subtotal = unitPrice * Number(it.qty || 1);
        await conn.query(
          "INSERT INTO order_items (order_id, product_id, supplier_price_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?,?)",
          [resolvedOrderId, it.product_id, supplierPriceId, it.qty || 1, unitPrice, subtotal],
        );
      }
    }

    // Record who paid what - shared money_contributions, same table the
    // group/contribution UI on Cial-dev is meant to read from.
    const [memberRows] = uid
      ? await conn.query("SELECT full_name FROM users WHERE user_id=?", [uid])
      : [[]];
    const resolvedMemberName = memberRows[0]?.full_name || member_name;

    let contributionCardId = method === "bank" ? card_id : null;
    if (!contributionCardId) {
      const railType = method === "voucher" ? "Store Voucher" : "Visa";
      const [rail] = await conn.query(
        "SELECT card_id FROM card_details WHERE card_type=? LIMIT 1",
        [railType],
      );
      contributionCardId = rail[0]?.card_id || null;
    }
    if (contributionCardId) {
      await conn.query(
        "INSERT INTO money_contributions (card_id, member_name, amount, payment_status) VALUES (?,?,?,?)",
        [contributionCardId, resolvedMemberName, finalAmount, "Paid"],
      );
    }

    // Shared delivery record - Kanya/Cial branches can read this straight
    // out of delivery_details via order_details.delivery_id.
    const [detRes] = await conn.query(
      "INSERT INTO delivery_details (delivery_address, transport_type, delivery_date, delivery_status) VALUES (?,?,DATE_ADD(CURDATE(), INTERVAL 1 DAY),?)",
      [address, "Van", "Pending"],
    );
    const deliveryDetailsId = detRes.insertId;

    await conn.query(
      "UPDATE order_details SET order_status='Completed', delivery_id=?, card_id=?, total_amount=? WHERE order_id=?",
      [deliveryDetailsId, contributionCardId, orderTotal, resolvedOrderId],
    );

    // Butsha-dev's own richer tracking layer (progress %, courier, live
    // timeline) sits on top of the shared delivery_details row - additive,
    // nothing else touches these tables so nothing else can break here.
    const tracking = gen();
    const ref = `PAY-${Date.now()}`;
    const [delRes] = await conn.query(
      "INSERT INTO deliveries (order_id,tracking_number,courier,status,progress,estimated_text,delivery_address) VALUES (?,?,?,?,?,?,?)",
      [
        resolvedOrderId,
        tracking,
        "StockWell Express ZA",
        "shipped",
        42,
        "Tomorrow by 18:00",
        address,
      ],
    );
    const did = delRes.insertId;
    await conn.query(
      "INSERT INTO delivery_logs (delivery_id,title,description,status_key,tag) VALUES (?,?,?,?,?),(?,?,?,?,?),(?,?,?,?,?)",
      [
        did,
        "In Transit - Truck left Cape Town DC",
        "Truck on road",
        "in_transit",
        "LIVE GPS",
        did,
        "Shipped",
        "Package picked up",
        "shipped",
        "AWB #" + tracking.slice(3, 9),
        did,
        "Payment Confirmed",
        "Ref " + ref + (discount ? ` - Discount R${discount.toFixed(2)}` : ""),
        "paid",
        null,
      ],
    );

    // If this was a guest checkout built from the local demo cart, clear it.
    const [carts] = await conn.query(
      "SELECT id FROM carts WHERE session_id=? OR user_id=? ORDER BY updated_at DESC LIMIT 1",
      [email, uid],
    );
    if (carts[0])
      await conn.query("DELETE FROM cart_items WHERE cart_id=?", [carts[0].id]);

    await conn.commit();
    res.json({
      order_id: resolvedOrderId,
      tracking_number: tracking,
      tracking_id: tracking,
      reference: ref,
      finalAmount,
      discount,
    });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
};
