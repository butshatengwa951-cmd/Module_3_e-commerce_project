import bcrypt from "bcryptjs";
import pool from "./config/db.js";

try {
    const [users] = await pool.query(
        `
        SELECT user_id, email, password
        FROM users
        `
    );

    for (const user of users) {
        // Skip passwords that have already been hashed.
        if (
            user.password.startsWith("$2a$") ||
            user.password.startsWith("$2b$") ||
            user.password.startsWith("$2y$")
        ) {
            console.log(`Skipping ${user.email} - already hashed.`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        await pool.query(
            `
            UPDATE users
            SET password = ?
            WHERE user_id = ?
            `,
            [hashedPassword, user.user_id]
        );

        console.log(`Password hashed for ${user.email}`);
    }

    console.log("\nPassword migration completed.");
} catch (error) {
    console.error("Password migration failed!");
    console.error(error.message);
} finally {
    await pool.end();
}