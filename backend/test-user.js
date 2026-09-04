import pool from "./config/db.js";
import {
    findUserByEmail,
    findUserById
} from "./models/User.js";

try {
    const userByEmail = await findUserByEmail("nosipho@gmail.com");

    console.log("User found by email:");
    console.log(userByEmail);

    const userById = await findUserById(1);

    console.log("User found by ID:");
    console.log(userById);
} catch (error) {
    console.error("User query failed!");
    console.error(error.message);
} finally {
    await pool.end();
}