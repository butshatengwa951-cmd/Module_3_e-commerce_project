// @ts-nocheck

import pool from "../config/db.js";

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
};

const createUser = async (fullName, email, password, phoneNumber) => {
  const [result] = await pool.execute(
    `INSERT INTO users (full_name, email, password, phone_number)
     VALUES (?, ?, ?, ?)`,
    [fullName, email, password, phoneNumber || null]
  );

  return result.insertId;
};

const findUserById = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT user_id, full_name, email, phone_number, role, created_at
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

export { findUserByEmail, createUser, findUserById };

