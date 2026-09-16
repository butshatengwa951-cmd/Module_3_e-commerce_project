import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

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
  } catch (err) {
    console.log("❌ DB CONNECTION FAILED");
    console.error(err.message);
    console.error(err);
  }
}
export default { pool, testConnection };
