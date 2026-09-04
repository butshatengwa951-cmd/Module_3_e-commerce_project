import pool from "./config/db.js";
import {
    getAllStokvels,
    findStokvelById
} from "./models/Stokvel.js";

try {
    const stokvels = await getAllStokvels();

    console.log("All stokvels:");
    console.log(stokvels);

    const stokvel = await findStokvelById(1);

    console.log("\nStokvel with ID 1:");
    console.log(stokvel);
} catch (error) {
    console.error("Stokvel query failed!");
    console.error(error.message);
} finally {
    await pool.end();
}