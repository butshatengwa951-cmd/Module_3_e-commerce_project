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

function getTokenUser(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("Missing token");
  return jwt.verify(token, process.env.JWT_SECRET || "stockwell_2026");
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);

    if (!rows.length) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = rows[0];
    const ok = user.password.startsWith("$2a$")
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
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Full name, email and password are required" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      "INSERT INTO users (full_name,email,password,role) VALUES (?,?,?,?)",
      [full_name, email, hashed, "member"],
    );

    const [u] = await pool.query(
      "SELECT user_id,full_name,email,role FROM users WHERE user_id=?",
      [r.insertId],
    );

    res.status(201).json({ token: signToken(u[0]), user: u[0] });
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with that email already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.me = async (req, res) => {
  try {
    const d = getTokenUser(req);
    const [rows] = await pool.query(
      "SELECT user_id,full_name,email,phone_number,role,created_at FROM users WHERE user_id=?",
      [d.user_id],
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.profile = async (req, res) => {
  try {
    const d = getTokenUser(req);

    const [userRows] = await pool.query(
      "SELECT user_id,full_name,email,phone_number,role,created_at FROM users WHERE user_id=?",
      [d.user_id],
    );

    if (!userRows.length) return res.status(404).json({ error: "User not found" });

    const user = userRows[0];

    const [stokvels] = await pool.query(
      `SELECT s.stokvel_id, s.stokvel_name, s.description, sm.joined_at,
              CASE WHEN s.chairperson_id = ? THEN 'Chairperson' ELSE 'Member' END AS membership_role
       FROM stokvel_members sm
       INNER JOIN stokvels s ON s.stokvel_id = sm.stokvel_id
       WHERE sm.user_id = ?
       ORDER BY sm.joined_at ASC`,
      [d.user_id, d.user_id],
    );

    let contributionTotal = 0;
    let paidContributionTotal = 0;

    try {
      const [contributions] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total,
                COALESCE(SUM(CASE WHEN LOWER(payment_status) IN ('paid','complete','completed') THEN amount ELSE 0 END), 0) AS paid_total
         FROM money_contributions
         WHERE member_name = ?`,
        [user.full_name],
      );
      contributionTotal = Number(contributions[0]?.total || 0);
      paidContributionTotal = Number(contributions[0]?.paid_total || 0);
    } catch (err) {
      console.warn("Contribution stats unavailable:", err.message);
    }

    let orderCount = 0;
    let orderTotal = 0;
    let recentOrders = [];

    try {
      const [orderStats] = await pool.query(
        `SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS order_total
         FROM order_details WHERE user_id = ?`,
        [d.user_id],
      );
      orderCount = Number(orderStats[0]?.order_count || 0);
      orderTotal = Number(orderStats[0]?.order_total || 0);

      const [orders] = await pool.query(
        `SELECT order_id, order_date, total_amount, order_status
         FROM order_details WHERE user_id = ?
         ORDER BY order_date DESC LIMIT 5`,
        [d.user_id],
      );
      recentOrders = orders;
    } catch (err) {
      console.warn("Order stats unavailable:", err.message);
    }

    res.json({
      user,
      stokvels,
      stats: {
        contributionTotal,
        paidContributionTotal,
        orderCount,
        orderTotal,
      },
      recentOrders,
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
};
