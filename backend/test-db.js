import pool from "./config/db.js";

try {
    const [rows] = await pool.query("SELECT 1 AS result");

    console.log("Database connection successful!");
    console.log(rows);
} catch (error) {
    console.error("Database connection failed!");
    console.error(error.message);
} finally {
    await pool.end();
}