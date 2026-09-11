import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
|--------------------------------------------------------------------------
| Load backend/.env explicitly
|--------------------------------------------------------------------------
*/

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});

/*
|--------------------------------------------------------------------------
| Database configuration
|--------------------------------------------------------------------------
|
| Local development:
|   DB_SSL=false
|
| Aiven cloud:
|   DB_SSL=true
|   DB_SSL_CA_PATH=./config/ca.pem
|
*/

const sslEnabled =
  String(process.env.DB_SSL || "false").toLowerCase() === "true";

let ssl = undefined;

if (sslEnabled) {
  const caPath = process.env.DB_SSL_CA_PATH
    ? path.resolve(
        __dirname,
        "..",
        process.env.DB_SSL_CA_PATH.replace("./", ""),
      )
    : path.join(__dirname, "ca.pem");

  if (fs.existsSync(caPath)) {
    ssl = {
      ca: fs.readFileSync(caPath, "utf8"),
      rejectUnauthorized: true,
    };
  } else {
    ssl = {
      rejectUnauthorized: true,
    };
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,

  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,

  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,

  ...(sslEnabled ? { ssl } : {}),
});

export default pool;
