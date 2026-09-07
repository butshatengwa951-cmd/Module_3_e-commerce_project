import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "23586"),
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Aiven Connected:", process.env.DB_NAME);
    const [c] = await conn.query(
      "SELECT card_id, voucher_number, available_amount FROM card_details LIMIT 1",
    );
    console.log("✅ pot sample:", c[0]);
    conn.release();
  } catch (e) {
    console.error("❌ DB fail:", e.message);
  }
})();

export default pool;
