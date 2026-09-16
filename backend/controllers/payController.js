const crypto = require("crypto");
const { pool } = require("../config/db");

function gen() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "";
  for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)];
  return `SW-${r}-ZA`;
}

function payfastBaseUrl() {
  return process.env.PAYFAST_SANDBOX === "true"
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

function payfastSignature(data, passphrase) {
  const pairs = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`);
  let query = pairs.join("&");
  if (passphrase) query += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;
  return crypto.createHash("md5").update(query).digest("hex");
}

async function resolveOrder(conn, body) {
  const { order_id, email = "guest@stockwell.global", user_id, total, items } = body;
  let resolvedOrderId = order_id ? Number(order_id) : null;
  let orderItems = [];
  let orderTotal = 0;
  let stokvelId = null;
  let uid = user_id || null;

  if (resolvedOrderId) {
    const [orderRows] = await conn.query(
      "SELECT * FROM order_details WHERE order_id=? FOR UPDATE",
      [resolvedOrderId],
    );
    if (!orderRows.length) throw new Error("Order not found");
    const existing = orderRows[0];
    if (existing.order_status === "Completed") throw new Error("Order already paid");
    stokvelId = existing.stokvel_id;
    uid = uid || existing.user_id;
    const [rows] = await conn.query(
      `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.subtotal, p.product_name
       FROM order_items oi JOIN products p ON p.product_id=oi.product_id
       WHERE oi.order_id=?`,
      [resolvedOrderId],
    );
    if (!rows.length) throw new Error("Order has no items");
    orderItems = rows.map((r) => ({ product_id: r.product_id, name: r.product_name, price: Number(r.unit_price), qty: r.quantity }));
    orderTotal = rows.reduce((s, r) => s + Number(r.subtotal), 0);
  } else {
    if (!items || !items.length) throw new Error("Cart empty");
    orderItems = items;
    orderTotal = Number(total);
    if (!Number.isFinite(orderTotal) || orderTotal <= 0) throw new Error("Invalid order total");
    if (!uid && email) {
      const [u] = await conn.query("SELECT user_id FROM users WHERE email=?", [email]);
      uid = u[0]?.user_id || null;
    }
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
      if (!supplierPriceId) throw new Error("No supplier price for product " + it.product_id);
      const unitPrice = Number(it.price);
      const subtotal = unitPrice * Number(it.qty || 1);
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, supplier_price_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?,?)",
        [resolvedOrderId, it.product_id, supplierPriceId, it.qty || 1, unitPrice, subtotal],
      );
    }
  }

  return { resolvedOrderId, orderItems, orderTotal, uid };
}

async function createPayfastCheckout(req, res) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { email = "guest@stockwell.global", member_name = "StockWell Member", address = "12 Loop St", voucher_code } = req.body;
    const { resolvedOrderId, orderItems, orderTotal, uid } = await resolveOrder(conn, req.body);
    let finalAmount = orderTotal;
    let voucherId = null;
    let discount = 0;

    if (voucher_code) {
      const [vRows] = await conn.query(
        "SELECT * FROM vouchers WHERE code=? AND active=1 FOR UPDATE",
        [voucher_code.trim().toUpperCase()],
      );
      if (!vRows.length) throw new Error("Invalid voucher");
      const v = vRows[0];
      if (v.used_count >= v.max_uses) throw new Error("Voucher expired");
      discount = v.discount_type === "percent" ? (finalAmount * Number(v.discount_value)) / 100 : Number(v.discount_value);
      discount = Math.min(discount, finalAmount);
      finalAmount -= discount;
      voucherId = v.id;
    }

    const mPaymentId = `SW-${resolvedOrderId}-${Date.now()}`;
    await conn.query(
      "INSERT INTO payfast_transactions (order_id,m_payment_id,amount,email,member_name,address,voucher_id,status) VALUES (?,?,?,?,?,?,?,?)",
      [resolvedOrderId, mPaymentId, finalAmount, email, member_name, address, voucherId, "PENDING"],
    );
    await conn.commit();

    const base = process.env.PAYFAST_RETURN_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const data = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${base}/pay?payfast=success&order_id=${resolvedOrderId}`,
      cancel_url: `${base}/pay?payfast=cancelled&order_id=${resolvedOrderId}`,
      notify_url: `${process.env.PAYFAST_NOTIFY_URL || "http://localhost:4040/api/pay/payfast/notify"}`,
      name_first: (member_name || "StockWell Member").split(" ")[0],
      name_last: (member_name || "StockWell Member").split(" ").slice(1).join(" "),
      email_address: email,
      m_payment_id: mPaymentId,
      amount: finalAmount.toFixed(2),
      item_name: `StockWell Order #${resolvedOrderId}`,
      item_description: `${orderItems.length} item(s)${discount ? ` • Voucher discount R${discount.toFixed(2)}` : ""}`,
    };
    if (!data.merchant_id || !data.merchant_key) throw new Error("Payfast merchant credentials are not configured on the backend");
    data.signature = payfastSignature(data, process.env.PAYFAST_PASSPHRASE);
    const query = new URLSearchParams(data).toString();
    res.json({
      checkout_url: `${payfastBaseUrl()}?${query}`,
      order_id: resolvedOrderId,
      m_payment_id: mPaymentId,
      amount: finalAmount,
    });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
}

async function completePaidOrder(conn, tx, pfPaymentId) {
  const [orders] = await conn.query("SELECT * FROM order_details WHERE order_id=? FOR UPDATE", [tx.order_id]);
  if (!orders.length) throw new Error("Order not found");
  if (orders[0].order_status === "Completed") return;

  const [items] = await conn.query(
    `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.subtotal, p.product_name
     FROM order_items oi JOIN products p ON p.product_id=oi.product_id WHERE oi.order_id=?`,
    [tx.order_id],
  );
  if (!items.length) throw new Error("Order has no items");

  let contributionCardId = null;
  const [rail] = await conn.query("SELECT card_id FROM card_details WHERE card_type='Visa' LIMIT 1");
  contributionCardId = rail[0]?.card_id || null;
  if (contributionCardId) {
    await conn.query(
      "INSERT INTO money_contributions (card_id,member_name,amount,payment_status) VALUES (?,?,?,?)",
      [contributionCardId, tx.member_name || "StockWell Member", tx.amount, "Paid"],
    );
  }

  const [detRes] = await conn.query(
    "INSERT INTO delivery_details (delivery_address,transport_type,delivery_date,delivery_status) VALUES (?,?,DATE_ADD(CURDATE(), INTERVAL 1 DAY),?)",
    [tx.address || "12 Loop St", "Van", "Pending"],
  );
  const deliveryDetailsId = detRes.insertId;
  await conn.query(
    "UPDATE order_details SET order_status='Completed', delivery_id=?, card_id=?, total_amount=? WHERE order_id=?",
    [deliveryDetailsId, contributionCardId, tx.amount, tx.order_id],
  );

  const tracking = gen();
  const [delRes] = await conn.query(
    "INSERT INTO deliveries (order_id,tracking_number,courier,status,progress,estimated_text,delivery_address) VALUES (?,?,?,?,?,?,?)",
    [tx.order_id, tracking, "StockWell Express ZA", "shipped", 42, "Tomorrow by 18:00", tx.address || "12 Loop St"],
  );
  await conn.query(
    "INSERT INTO delivery_logs (delivery_id,title,description,status_key,tag) VALUES (?,?,?,?,?),(?,?,?,?,?),(?,?,?,?,?)",
    [
      delRes.insertId, "In Transit - Truck left Cape Town DC", "Truck on road", "in_transit", "LIVE GPS",
      delRes.insertId, "Shipped", "Package picked up", "shipped", `AWB #${tracking.slice(3,9)}`,
      delRes.insertId, "Payment Confirmed", `PayFast payment ${pfPaymentId || tx.m_payment_id}`, "paid", null,
    ],
  );

  if (tx.voucher_id) {
    await conn.query("UPDATE vouchers SET used_count=used_count+1 WHERE id=?", [tx.voucher_id]);
  }
  const [carts] = await conn.query("SELECT id FROM carts WHERE session_id=? OR user_id=? ORDER BY updated_at DESC LIMIT 1", [tx.email, orders[0].user_id]);
  if (carts[0]) await conn.query("DELETE FROM cart_items WHERE cart_id=?", [carts[0].id]);
  await conn.query("UPDATE payfast_transactions SET status='COMPLETE', pf_payment_id=? WHERE id=?", [pfPaymentId || null, tx.id]);
  return tracking;
}

async function payfastNotify(req, res) {
  const body = req.body || {};
  try {
    const signature = body.signature;
    const copy = { ...body };
    delete copy.signature;
    const expected = payfastSignature(copy, process.env.PAYFAST_PASSPHRASE);
    if (!signature || signature !== expected) return res.status(400).send("Invalid signature");
    if (process.env.PAYFAST_MERCHANT_ID && String(body.merchant_id) !== String(process.env.PAYFAST_MERCHANT_ID)) return res.status(400).send("Invalid merchant");
    if (body.payment_status !== "COMPLETE") return res.send("OK");

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query("SELECT * FROM payfast_transactions WHERE m_payment_id=? FOR UPDATE", [body.m_payment_id]);
      if (!rows.length) throw new Error("Transaction not found");
      const tx = rows[0];
      if (Number(body.amount_gross).toFixed(2) !== Number(tx.amount).toFixed(2)) throw new Error("Amount mismatch");
      const tracking = await completePaidOrder(conn, tx, body.pf_payment_id);
      await conn.commit();
      return res.json({ ok: true, tracking_number: tracking });
    } catch (e) {
      await conn.rollback();
      return res.status(400).json({ error: e.message });
    } finally {
      conn.release();
    }
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

// Existing internal/demo payment rail retained for bank/voucher flows.
exports.pay = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { order_id, email = "guest@stockwell.global", user_id, member_name = "N. Dlamini", total, items, address = "12 Loop St", method = "card", voucher_code, card_id } = req.body;
    const { resolvedOrderId, orderItems, orderTotal, uid } = await resolveOrder(conn, { order_id, email, user_id, total, items });
    let finalAmount = orderTotal;
    let discount = 0;
    let voucherId = null;
    if (method === "voucher" && voucher_code) {
      const [vRows] = await conn.query("SELECT * FROM vouchers WHERE code=? AND active=1 FOR UPDATE", [voucher_code.trim().toUpperCase()]);
      if (!vRows.length) throw new Error("Invalid voucher");
      const v = vRows[0];
      if (v.used_count >= v.max_uses) throw new Error("Voucher expired");
      discount = v.discount_type === "percent" ? (finalAmount * Number(v.discount_value)) / 100 : Number(v.discount_value);
      discount = Math.min(discount, finalAmount);
      finalAmount -= discount;
      voucherId = v.id;
      await conn.query("UPDATE vouchers SET used_count=used_count+1 WHERE id=?", [voucherId]);
    }
    if (method === "bank" && card_id) {
      const [cRows] = await conn.query("SELECT * FROM card_details WHERE card_id=? FOR UPDATE", [card_id]);
      if (!cRows.length) throw new Error("Bank card not found");
      if (Number(cRows[0].available_amount) < finalAmount) throw new Error("Insufficient funds: R" + cRows[0].available_amount);
      await conn.query("UPDATE card_details SET available_amount=available_amount-? WHERE card_id=?", [finalAmount, card_id]);
    }
    const [memberRows] = uid ? await conn.query("SELECT full_name FROM users WHERE user_id=?", [uid]) : [[]];
    const resolvedMemberName = memberRows[0]?.full_name || member_name;
    let contributionCardId = method === "bank" ? card_id : null;
    if (!contributionCardId) {
      const railType = method === "voucher" ? "Store Voucher" : "Visa";
      const [rail] = await conn.query("SELECT card_id FROM card_details WHERE card_type=? LIMIT 1", [railType]);
      contributionCardId = rail[0]?.card_id || null;
    }
    if (contributionCardId) await conn.query("INSERT INTO money_contributions (card_id,member_name,amount,payment_status) VALUES (?,?,?,?)", [contributionCardId, resolvedMemberName, finalAmount, "Paid"]);
    const [detRes] = await conn.query("INSERT INTO delivery_details (delivery_address,transport_type,delivery_date,delivery_status) VALUES (?,?,DATE_ADD(CURDATE(), INTERVAL 1 DAY),?)", [address, "Van", "Pending"]);
    const deliveryDetailsId = detRes.insertId;
    await conn.query("UPDATE order_details SET order_status='Completed',delivery_id=?,card_id=?,total_amount=? WHERE order_id=?", [deliveryDetailsId, contributionCardId, orderTotal, resolvedOrderId]);
    const tracking = gen();
    const ref = `PAY-${Date.now()}`;
    const [delRes] = await conn.query("INSERT INTO deliveries (order_id,tracking_number,courier,status,progress,estimated_text,delivery_address) VALUES (?,?,?,?,?,?,?)", [resolvedOrderId, tracking, "StockWell Express ZA", "shipped", 42, "Tomorrow by 18:00", address]);
    await conn.query("INSERT INTO delivery_logs (delivery_id,title,description,status_key,tag) VALUES (?,?,?,?,?),(?,?,?,?,?),(?,?,?,?,?)", [delRes.insertId,"In Transit - Truck left Cape Town DC","Truck on road","in_transit","LIVE GPS",delRes.insertId,"Shipped","Package picked up","shipped","AWB #"+tracking.slice(3,9),delRes.insertId,"Payment Confirmed","Ref "+ref+(discount?` - Discount R${discount.toFixed(2)}`:""),"paid",null]);
    const [carts] = await conn.query("SELECT id FROM carts WHERE session_id=? OR user_id=? ORDER BY updated_at DESC LIMIT 1", [email, uid]);
    if (carts[0]) await conn.query("DELETE FROM cart_items WHERE cart_id=?", [carts[0].id]);
    await conn.commit();
    res.json({ order_id: resolvedOrderId, tracking_number: tracking, tracking_id: tracking, reference: ref, finalAmount, discount });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally {
    conn.release();
  }
};
exports.createPayfastCheckout = createPayfastCheckout;
exports.payfastNotify = payfastNotify;
