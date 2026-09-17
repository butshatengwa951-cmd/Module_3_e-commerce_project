// TEMPORARY DEVELOPMENT/TEST TOOL ONLY.
// This creates the company-level test admin without adding it to a Stokvel.
// Run from backend after setting TEST_ADMIN_PASSWORD and database environment variables.
// Remove this file before production deployment.

import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const email = "admin@test.stockwell.local";
const password = process.env.TEST_ADMIN_PASSWORD;

if (!password || password.length < 8) {
  console.error("Set TEST_ADMIN_PASSWORD to a temporary password of at least 8 characters.");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);
  const [existing] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);

  if (existing.length) {
    await pool.query(
      "UPDATE users SET full_name = ?, password = ?, phone_number = ?, role = 'admin' WHERE email = ?",
      ["StockWell Test Admin", passwordHash, "0000000000", email]
    );
    console.log(`Temporary admin updated: ${email}`);
  } else {
    await pool.query(
      "INSERT INTO users (full_name, email, password, phone_number, role) VALUES (?, ?, ?, ?, 'admin')",
      ["StockWell Test Admin", email, passwordHash, "0000000000"]
    );
    console.log(`Temporary admin created: ${email}`);
  }

  console.log("This account is company-level and is intentionally not added to stokvel_members.");
} catch (error) {
  console.error("Unable to create test admin:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
