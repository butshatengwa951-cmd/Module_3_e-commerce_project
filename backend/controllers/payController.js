const { pool } = require("../config/db");
function gen() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "";
  for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)];
  return `SW-${r}-ZA`;
}

exports.pay = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {
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
    if (!items || !items.length) throw new Error("Cart empty");

    let finalAmount = Number(total);
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
        "UPDATE card_details SET available_amount = available_amount -? WHERE card_id=?",
        [finalAmount, card_id],
      );
    }

    const tracking = gen();
    const ref = `PAY-${Date.now()}`;
    let uid = user_id || null;
    if (!uid) {
      const [u] = await conn.query("SELECT user_id FROM users WHERE email=?", [
        email,
      ]);
      uid = u[0]?.user_id || null;
    }

    const [orderRes] = await conn.query(
      "INSERT INTO orders (user_id,tracking_number,total_amount,final_amount,email,member_name,delivery_address,status) VALUES (?,?,?,?,?,?,?,?)",
      [uid, tracking, total, finalAmount, email, member_name, address, "paid"],
    );
    const orderId = orderRes.insertId;

    for (const it of items) {
      await conn.query(
        "INSERT INTO order_items_ecom (order_id,product_id,qty,price) VALUES (?,?,?,?)",
        [orderId, it.product_id || 1, it.qty || 1, it.price || 0],
      );
    }

    await conn.query(
      "INSERT INTO payments (order_id,reference,amount,method,status,card_last4) VALUES (?,?,?,?,?,?)",
      [
        orderId,
        ref,
        finalAmount,
        method,
        "success",
        method === "card" ? "4242" : null,
      ],
    );

    const [delRes] = await conn.query(
      "INSERT INTO deliveries (order_id,tracking_number,courier,status,progress,estimated_text,delivery_address) VALUES (?,?,?,?,?,?,?)",
      [
        orderId,
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

    const [carts] = await conn.query(
      "SELECT id FROM carts WHERE session_id=? OR user_id=? ORDER BY updated_at DESC LIMIT 1",
      [email, uid],
    );
    if (carts[0])
      await conn.query("DELETE FROM cart_items WHERE cart_id=?", [carts[0].id]);

    await conn.commit();
    res.json({
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
