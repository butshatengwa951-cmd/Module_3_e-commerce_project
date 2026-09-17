import pool from "../config/db.js";

let auditReady = false;

async function ensureAuditTable() {
  if (auditReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      audit_id INT AUTO_INCREMENT PRIMARY KEY,
      admin_user_id INT NOT NULL,
      action VARCHAR(120) NOT NULL,
      entity_type VARCHAR(60) NOT NULL,
      entity_id INT NULL,
      details TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_admin_audit_created (created_at),
      INDEX idx_admin_audit_admin (admin_user_id),
      CONSTRAINT fk_admin_audit_user FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  auditReady = true;
}

async function audit(req, action, entityType, entityId, details = "") {
  try {
    await ensureAuditTable();
    await pool.query(
      `INSERT INTO admin_audit_log (admin_user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, action, entityType, entityId || null, details]
    );
  } catch (error) {
    console.error("Admin audit logging failed:", error);
  }
}

const sendError = (res, error, message) => {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
};

export async function getManagedUsers(req, res) {
  try {
    const [users] = await pool.query(`
      SELECT
        u.user_id, u.full_name, u.email, u.phone_number, u.role, u.created_at,
        GROUP_CONCAT(DISTINCT s.stokvel_name ORDER BY s.stokvel_name SEPARATOR ', ') AS stokvels
      FROM users u
      LEFT JOIN stokvel_members sm ON sm.user_id = u.user_id
      LEFT JOIN stokvels s ON s.stokvel_id = sm.stokvel_id
      GROUP BY u.user_id
      ORDER BY u.user_id DESC
    `);
    res.json({ success: true, users });
  } catch (error) {
    sendError(res, error, "Unable to load managed users.");
  }
}

export async function updateUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;
    const allowed = ["member", "chairperson", "admin"];
    if (!allowed.includes(role)) return res.status(400).json({ success: false, message: "Invalid role." });
    if (userId === Number(req.user.user_id) && role !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own administrator access." });
    }

    if (role !== "admin") {
      const [[adminCount]] = await pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'admin'`);
      const [[target]] = await pool.query(`SELECT role FROM users WHERE user_id = ?`, [userId]);
      if (target?.role === "admin" && Number(adminCount.count) <= 1) {
        return res.status(400).json({ success: false, message: "The company must retain at least one administrator." });
      }
    }

    const [result] = await pool.query(`UPDATE users SET role = ? WHERE user_id = ?`, [role, userId]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "User not found." });
    await audit(req, "Changed user role", "user", userId, `New role: ${role}`);
    const [[user]] = await pool.query(`SELECT user_id, full_name, email, phone_number, role, created_at FROM users WHERE user_id = ?`, [userId]);
    res.json({ success: true, user });
  } catch (error) {
    sendError(res, error, "Unable to update user role.");
  }
}

export async function getStokvelMembers(req, res) {
  try {
    const stokvelId = Number(req.params.id);
    const [members] = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, u.phone_number, u.role, sm.joined_at
      FROM stokvel_members sm
      JOIN users u ON u.user_id = sm.user_id
      WHERE sm.stokvel_id = ?
      ORDER BY sm.joined_at, u.full_name
    `, [stokvelId]);
    res.json({ success: true, members });
  } catch (error) {
    sendError(res, error, "Unable to load Stokvel members.");
  }
}

export async function addStokvelMember(req, res) {
  try {
    const stokvelId = Number(req.params.id);
    const userId = Number(req.body.user_id);
    if (!userId) return res.status(400).json({ success: false, message: "A user is required." });
    const [result] = await pool.query(`INSERT INTO stokvel_members (stokvel_id, user_id) VALUES (?, ?)`, [stokvelId, userId]);
    await audit(req, "Added Stokvel member", "stokvel", stokvelId, `User ${userId} added.`);
    res.status(201).json({ success: true, member_id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ success: false, message: "That user is already a member of this Stokvel." });
    sendError(res, error, "Unable to add Stokvel member.");
  }
}

export async function removeStokvelMember(req, res) {
  try {
    const stokvelId = Number(req.params.id);
    const userId = Number(req.params.userId);
    const [result] = await pool.query(`DELETE FROM stokvel_members WHERE stokvel_id = ? AND user_id = ?`, [stokvelId, userId]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Stokvel membership not found." });
    await audit(req, "Removed Stokvel member", "stokvel", stokvelId, `User ${userId} removed.`);
    res.json({ success: true, message: "Member removed." });
  } catch (error) {
    sendError(res, error, "Unable to remove Stokvel member.");
  }
}

export async function getAdminAnalytics(req, res) {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN order_status <> 'Cancelled' THEN total_amount ELSE 0 END),0) AS revenue,
        COALESCE(AVG(CASE WHEN order_status <> 'Cancelled' THEN total_amount END),0) AS average_order_value,
        SUM(order_status = 'Completed') AS completed_orders,
        SUM(order_status = 'Cancelled') AS cancelled_orders
      FROM order_details
    `);

    const [monthlyRevenue] = await pool.query(`
      SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, ROUND(SUM(total_amount),2) AS revenue, COUNT(*) AS orders
      FROM order_details
      WHERE order_status <> 'Cancelled'
      GROUP BY DATE_FORMAT(order_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    const [topProducts] = await pool.query(`
      SELECT p.product_id, p.product_name, SUM(oi.quantity) AS units_sold, ROUND(SUM(oi.subtotal),2) AS sales
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      JOIN order_details o ON o.order_id = oi.order_id
      WHERE o.order_status <> 'Cancelled'
      GROUP BY p.product_id, p.product_name
      ORDER BY units_sold DESC
      LIMIT 10
    `);

    const [stokvelActivity] = await pool.query(`
      SELECT s.stokvel_id, s.stokvel_name, COUNT(DISTINCT sm.user_id) AS members,
             COUNT(DISTINCT o.order_id) AS orders,
             COALESCE(SUM(CASE WHEN o.order_status <> 'Cancelled' THEN o.total_amount ELSE 0 END),0) AS spend
      FROM stokvels s
      LEFT JOIN stokvel_members sm ON sm.stokvel_id = s.stokvel_id
      LEFT JOIN order_details o ON o.stokvel_id = s.stokvel_id
      GROUP BY s.stokvel_id, s.stokvel_name
      ORDER BY spend DESC
    `);

    res.json({ success: true, summary, monthlyRevenue, topProducts, stokvelActivity });
  } catch (error) {
    sendError(res, error, "Unable to load admin analytics.");
  }
}

export async function getAuditLog(req, res) {
  try {
    await ensureAuditTable();
    const [entries] = await pool.query(`
      SELECT a.audit_id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
             u.full_name AS admin_name, u.email AS admin_email
      FROM admin_audit_log a
      JOIN users u ON u.user_id = a.admin_user_id
      ORDER BY a.audit_id DESC
      LIMIT 200
    `);
    res.json({ success: true, entries });
  } catch (error) {
    sendError(res, error, "Unable to load audit history.");
  }
}
