const r = require("express").Router();
const { pool } = require("../config/db");

r.get("/", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, code, discount_type, discount_value, max_uses, used_count, active FROM vouchers WHERE active=1",
  );
  res.json(rows);
});

r.post("/verify", async (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) return res.status(400).json({ error: "code required" });
    const [rows] = await pool.query(
      "SELECT * FROM vouchers WHERE code=? AND active=1",
      [code.trim().toUpperCase()],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Voucher not found" });
    const v = rows[0];
    if (v.used_count >= v.max_uses)
      return res.status(400).json({ error: "Voucher max uses reached" });
    let discount =
      v.discount_type === "percent"
        ? (Number(total) * Number(v.discount_value)) / 100
        : Number(v.discount_value);
    discount = Math.min(discount, Number(total));
    res.json({
      valid: true,
      voucher: v,
      discount: Number(discount.toFixed(2)),
      newTotal: Number((total - discount).toFixed(2)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = r;
