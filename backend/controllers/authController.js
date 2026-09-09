const { pool } = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
function signToken(u) {
  return jwt.sign(
    {
      user_id: u.user_id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
    },
    process.env.JWT_SECRET || "stockwell_2026",
    { expiresIn: "7d" },
  );
}
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
  if (!rows.length)
    return res
      .status(401)
      .json({ error: "User not found - try nosipho@gmail.com / password123" });
  const user = rows[0];
  let ok = user.password.startsWith("$2a$")
    ? await bcrypt.compare(password, user.password)
    : password === user.password;
  if (!ok) return res.status(401).json({ error: "Invalid password" });
  const token = signToken(user);
  res.json({
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
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
    const token = req.headers.authorization?.split(" ")[1];
    const d = jwt.verify(token, process.env.JWT_SECRET || "stockwell_2026");
    const [rows] = await pool.query(
      "SELECT user_id,full_name,email,role FROM users WHERE user_id=?",
      [d.user_id],
    );
    res.json(rows[0]);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
