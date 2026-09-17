import pool from "../config/db.js";

const sendError = (res, error, message) => {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
};

export const createSuggestion = async (req, res) => {
  try {
    const { subject, category = "General", message } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and suggestion are required.",
      });
    }

    const allowedCategories = ["General", "Products", "Orders", "Delivery", "Stokvel", "Website"];
    const cleanCategory = allowedCategories.includes(category) ? category : "General";

    const [result] = await pool.query(
      `INSERT INTO suggestions (user_id, subject, category, message) VALUES (?, ?, ?, ?)`,
      [req.user.user_id, subject.trim(), cleanCategory, message.trim()]
    );

    const [rows] = await pool.query(
      `SELECT s.*, u.full_name AS user_name, u.email AS user_email
       FROM suggestions s JOIN users u ON u.user_id = s.user_id
       WHERE s.suggestion_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, suggestion: rows[0] });
  } catch (error) {
    return sendError(res, error, "Unable to submit suggestion.");
  }
};

export const getMySuggestions = async (req, res) => {
  try {
    const [suggestions] = await pool.query(
      `SELECT suggestion_id, subject, category, message, status, admin_response, created_at, updated_at
       FROM suggestions WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.user_id]
    );
    return res.json({ success: true, suggestions });
  } catch (error) {
    return sendError(res, error, "Unable to load your suggestions.");
  }
};

export const getAllSuggestions = async (req, res) => {
  try {
    const [suggestions] = await pool.query(
      `SELECT s.*, u.full_name AS user_name, u.email AS user_email
       FROM suggestions s JOIN users u ON u.user_id = s.user_id
       ORDER BY FIELD(s.status, 'Submitted', 'Under Review', 'Planned', 'Implemented', 'Declined'), s.created_at DESC`
    );
    return res.json({ success: true, suggestions });
  } catch (error) {
    return sendError(res, error, "Unable to load suggestions.");
  }
};

export const updateSuggestion = async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    const allowedStatuses = ["Submitted", "Under Review", "Planned", "Implemented", "Declined"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid suggestion status." });
    }

    const [result] = await pool.query(
      `UPDATE suggestions
       SET status = ?, admin_response = ?, reviewed_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE suggestion_id = ?`,
      [status, admin_response?.trim() || null, req.user.user_id, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Suggestion not found." });
    }

    const [rows] = await pool.query(`SELECT s.*, u.full_name AS user_name, u.email AS user_email FROM suggestions s JOIN users u ON u.user_id = s.user_id WHERE s.suggestion_id = ?`, [req.params.id]);
    return res.json({ success: true, suggestion: rows[0] });
  } catch (error) {
    return sendError(res, error, "Unable to update suggestion.");
  }
};