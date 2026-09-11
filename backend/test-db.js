import pool from "./config/db.js";

try {
    const [result] = await pool.query(
        "SELECT 1 AS connected"
    );

    console.log("Database connection successful:", result);
} catch (error) {
    console.error(
        "Database connection failed:",
        error.message
    );
} finally {
    await pool.end();
}