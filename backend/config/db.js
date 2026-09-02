import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Aiven fix - self-signed cert
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "23586"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, // FIX for self-signed certificate in certificate chain
  },
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(
      "✅ Aiven MySQL Connected to",
      process.env.DB_NAME,
      "on",
      process.env.DB_HOST,
    );
    const [rows] = await conn.query(
      "SELECT card_id, voucher_number, available_amount FROM card_details LIMIT 2",
    );
    console.log("✅ card_details sample:", rows);
    conn.release();
  } catch (err) {
    console.error("❌ Aiven MySQL Connection Failed:", err.message);
    console.error("Full error:", err);
  }
})();

export default pool;
