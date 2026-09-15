const { pool } = require("../config/db");

async function getOrCreateGuestCart(email, user_id) {
  let [e] = await pool.query("SELECT * FROM carts WHERE session_id=?", [
    email || "guest@stockwell.global",
  ]);
  if (e.length) return e[0];
  if (user_id) {
    [e] = await pool.query(
      "SELECT * FROM carts WHERE user_id=? ORDER BY updated_at DESC LIMIT 1",
      [user_id],
    );
    if (e.length) return e[0];
  }
  const [res] = await pool.query(
    "INSERT INTO carts (session_id,user_id) VALUES (?,?)",
    [email || "guest@stockwell.global", user_id || null],
  );
  const [nc] = await pool.query("SELECT * FROM carts WHERE id=?", [
    res.insertId,
  ]);
  return nc[0];
}

// Signed-in members share the SAME "cart" the catalogue (Kanya-dev) and
// group cart (Cial-dev) use: a Pending row in order_details plus its
// order_items. That's what makes anything a member adds here visible/usable
// on those branches too, and vice versa.
async function getOrCreateSharedOrder(user_id, stokvel_id) {
  const params = [user_id];
  let query = "SELECT * FROM order_details WHERE order_status='Pending' AND user_id=?";
  if (stokvel_id) {
    query += " AND stokvel_id=?";
    params.push(stokvel_id);
  }
  query += " ORDER BY order_id DESC LIMIT 1";
  const [rows] = await pool.query(query, params);
  if (rows.length) return rows[0];

  const [res] = await pool.query(
    "INSERT INTO order_details (user_id, stokvel_id, total_amount, order_status) VALUES (?,?,0,'Pending')",
    [user_id, stokvel_id || null],
  );
  const [nc] = await pool.query("SELECT * FROM order_details WHERE order_id=?", [
    res.insertId,
  ]);
  return nc[0];
}

async function sharedOrderItems(order_id) {
  const [rows] = await pool.query(
    `SELECT oi.order_item_id as id, oi.product_id, oi.quantity as qty, oi.unit_price as price,
            p.product_name, oi.order_id
     FROM order_items oi
     JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = ?`,
    [order_id],
  );
  return rows;
}

exports.getCart = async (req, res) => {
  const { user_id, order_id, stokvel_id } = req.query;

  // Previewing a specific shared order (e.g. arriving here via
  // /pay?order_id=... from another branch's confirmed cart).
  if (order_id) {
    return res.json(await sharedOrderItems(order_id));
  }

  if (user_id) {
    const order = await getOrCreateSharedOrder(Number(user_id), stokvel_id ? Number(stokvel_id) : null);
    return res.json(await sharedOrderItems(order.order_id));
  }

  const cart = await getOrCreateGuestCart(req.query.email, null);
  const [items] = await pool.query(
    "SELECT ci.*,p.product_name FROM cart_items ci LEFT JOIN products p ON p.product_id=ci.product_id WHERE cart_id=?",
    [cart.id],
  );
  res.json(items);
};

exports.addToCart = async (req, res) => {
  const { user_id, stokvel_id, product_id, qty } = req.body;
  let price = req.body.price;

  if (user_id) {
    const order = await getOrCreateSharedOrder(Number(user_id), stokvel_id ? Number(stokvel_id) : null);
    const [sp] = await pool.query(
      "SELECT supplier_price_id, price FROM supplier_prices WHERE product_id=? ORDER BY price ASC LIMIT 1",
      [product_id],
    );
    if (!sp.length) return res.status(400).json({ error: "No supplier price for product" });
    const supplier_price_id = sp[0].supplier_price_id;
    const unit_price = price || sp[0].price;

    const [ex] = await pool.query(
      "SELECT * FROM order_items WHERE order_id=? AND product_id=?",
      [order.order_id, product_id],
    );
    if (ex.length) {
      const newQty = ex[0].quantity + (qty || 1);
      await pool.query(
        "UPDATE order_items SET quantity=?, subtotal=? WHERE order_item_id=?",
        [newQty, newQty * unit_price, ex[0].order_item_id],
      );
    } else {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, supplier_price_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?,?)",
        [order.order_id, product_id, supplier_price_id, qty || 1, unit_price, (qty || 1) * unit_price],
      );
    }
    const [[{ sum }]] = await pool.query(
      "SELECT COALESCE(SUM(subtotal),0) as sum FROM order_items WHERE order_id=?",
      [order.order_id],
    );
    await pool.query("UPDATE order_details SET total_amount=? WHERE order_id=?", [
      sum,
      order.order_id,
    ]);
    return res.json(await sharedOrderItems(order.order_id));
  }

  const cart = await getOrCreateGuestCart(req.body.email, null);
  if (!price) {
    const [sp] = await pool.query(
      "SELECT price FROM supplier_prices WHERE product_id=? LIMIT 1",
      [product_id],
    );
    price = sp[0]?.price || 100;
  }
  const [ex] = await pool.query(
    "SELECT * FROM cart_items WHERE cart_id=? AND product_id=?",
    [cart.id, product_id],
  );
  if (ex.length)
    await pool.query("UPDATE cart_items SET qty=qty+? WHERE id=?", [
      qty || 1,
      ex[0].id,
    ]);
  else
    await pool.query(
      "INSERT INTO cart_items (cart_id,product_id,qty,price) VALUES (?,?,?,?)",
      [cart.id, product_id, qty || 1, price],
    );
  const [items] = await pool.query(
    "SELECT ci.*,p.product_name FROM cart_items ci LEFT JOIN products p ON p.product_id=ci.product_id WHERE cart_id=?",
    [cart.id],
  );
  res.json(items);
};

exports.clearCart = async (req, res) => {
  const user_id = req.query.user_id || req.body.user_id;
  if (user_id) {
    const order = await getOrCreateSharedOrder(Number(user_id), null);
    await pool.query("DELETE FROM order_items WHERE order_id=?", [order.order_id]);
    await pool.query("UPDATE order_details SET total_amount=0 WHERE order_id=?", [
      order.order_id,
    ]);
    return res.json({ ok: true });
  }
  const cart = await getOrCreateGuestCart(
    req.query.email || req.body.email,
    null,
  );
  await pool.query("DELETE FROM cart_items WHERE cart_id=?", [cart.id]);
  res.json({ ok: true });
};
