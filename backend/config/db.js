const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false },
  multipleStatements: true,
});

async function testConnection() {
  try {
    const c = await pool.getConnection();
    console.log(`✅ MySQL ${process.env.DB_NAME} connected`);
    c.release();
  } catch (e) {
    console.error("❌ DB", e.message);
  }
}
module.exports = { pool, testConnection };
