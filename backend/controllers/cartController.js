const { pool } = require("../config/db");
async function getOrCreateCart(email, user_id) {
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
exports.getCart = async (req, res) => {
  const cart = await getOrCreateCart(req.query.email, req.query.user_id);
  const [items] = await pool.query(
    "SELECT ci.*,p.product_name FROM cart_items ci LEFT JOIN products p ON p.product_id=ci.product_id WHERE cart_id=?",
    [cart.id],
  );
  res.json(items);
};
exports.addToCart = async (req, res) => {
  const cart = await getOrCreateCart(req.body.email, req.body.user_id);
  let price = req.body.price;
  if (!price) {
    const [sp] = await pool.query(
      "SELECT price FROM supplier_prices WHERE product_id=? LIMIT 1",
      [req.body.product_id],
    );
    price = sp[0]?.price || 100;
  }
  const [ex] = await pool.query(
    "SELECT * FROM cart_items WHERE cart_id=? AND product_id=?",
    [cart.id, req.body.product_id],
  );
  if (ex.length)
    await pool.query("UPDATE cart_items SET qty=qty+? WHERE id=?", [
      req.body.qty || 1,
      ex[0].id,
    ]);
  else
    await pool.query(
      "INSERT INTO cart_items (cart_id,product_id,qty,price) VALUES (?,?,?,?)",
      [cart.id, req.body.product_id, req.body.qty || 1, price],
    );
  const [items] = await pool.query(
    "SELECT ci.*,p.product_name FROM cart_items ci LEFT JOIN products p ON p.product_id=ci.product_id WHERE cart_id=?",
    [cart.id],
  );
  res.json(items);
};
exports.clearCart = async (req, res) => {
  const cart = await getOrCreateCart(
    req.query.email || req.body.email,
    req.query.user_id || req.body.user_id,
  );
  await pool.query("DELETE FROM cart_items WHERE cart_id=?", [cart.id]);
  res.json({ ok: true });
};
