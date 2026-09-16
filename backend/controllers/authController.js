const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function signToken(u) {
  return jwt.sign(
    { user_id: u.user_id, email: u.email, full_name: u.full_name, role: u.role },
    process.env.JWT_SECRET || "stockwell_2026",
    { expiresIn: "7d" },
  );
}

function getUserId(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "stockwell_2026");
  return decoded.user_id;
}

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
  if (!rows.length) return res.status(401).json({ error: "User not found" });
  const user = rows[0];
  const ok = user.password.startsWith("$2a$") || user.password.startsWith("$2b$")
    ? await bcrypt.compare(password, user.password)
    : password === user.password;
  if (!ok) return res.status(401).json({ error: "Invalid password" });
  res.json({
    token: signToken(user),
    user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role },
  });
};

exports.register = async (req, res) => {
  const { full_name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    "INSERT INTO users (full_name,email,password,role) VALUES (?,?,?,?)",
    [full_name, email, hashed, "member"],
  );
  const [u] = await pool.query(
    "SELECT user_id,full_name,email,role FROM users WHERE user_id=?",
    [r.insertId],
  );
  res.json({ token: signToken(u[0]), user: u[0] });
};

exports.me = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Invalid token" });
    const [rows] = await pool.query(
      "SELECT user_id,full_name,email,phone_number,role,created_at FROM users WHERE user_id=?",
      [userId],
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.profile = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Invalid token" });

    const [[user]] = await pool.query(
      "SELECT user_id,full_name,email,phone_number,role,created_at FROM users WHERE user_id=?",
      [userId],
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const [[stats]] = await pool.query(
      `SELECT
        COALESCE((SELECT SUM(amount) FROM money_contributions WHERE member_name=?),0) AS contribution_total,
        COALESCE((SELECT COUNT(*) FROM money_contributions WHERE member_name=?),0) AS contribution_count,
        COALESCE((SELECT SUM(amount) FROM money_contributions WHERE member_name=? AND payment_status='Paid'),0) AS paid_total,
        COALESCE((SELECT COUNT(*) FROM order_details WHERE user_id=?),0) AS order_count,
        COALESCE((SELECT SUM(total_amount) FROM order_details WHERE user_id=?),0) AS order_total`,
      [user.full_name, user.full_name, user.full_name, userId, userId],
    );

    const [stokvels] = await pool.query(
      `SELECT s.stokvel_id, s.stokvel_name, s.description, sm.joined_at,
        CASE WHEN s.chairperson_id=? THEN 'Chairperson' ELSE 'Member' END AS membership_role
       FROM stokvel_members sm
       JOIN stokvels s ON s.stokvel_id=sm.stokvel_id
       WHERE sm.user_id=?
       ORDER BY sm.joined_at DESC`,
      [userId, userId],
    );

    const [recentOrders] = await pool.query(
      `SELECT order_id, order_date, total_amount, order_status
       FROM order_details WHERE user_id=? ORDER BY order_date DESC LIMIT 10`,
      [userId],
    );

    res.json({ user, stats, stokvels, recentOrders });
  } catch (error) {
    console.error("Profile load failed:", error);
    res.status(500).json({ error: "Could not load profile" });
  }
};
