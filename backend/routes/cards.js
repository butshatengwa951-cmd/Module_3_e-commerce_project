import express from "express";
const r = express.Router();
import {pool} from "../config/db.js";
r.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT card_id, card_type, last_four_digits, voucher_number, expiry_date, available_amount FROM card_details ORDER BY card_id ASC",
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
export default r;
