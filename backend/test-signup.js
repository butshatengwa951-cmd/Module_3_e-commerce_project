import pool from "./config/db.js";

import {
    signup
} from "./controllers/authController.js";


// Fake Express request
const req = {
    body: {
        full_name: "Test Signup User",
        email: "signup-test-2026@example.com",
        password: "Password123!",
        phone_number: "0712345678",
        stokvel_name: "Delft Stokvel"
    }
};


// Fake Express response
const res = {
    statusCode: null,

    status(code) {
        this.statusCode = code;
        return this;
    },

    json(data) {
        console.log("\nResponse status:");
        console.log(this.statusCode);

        console.log("\nResponse body:");
        console.log(data);

        return this;
    }
};


try {
    await signup(req, res);

} catch (error) {
    console.error("Signup test failed!");
    console.error(error.message);

} finally {
    await pool.end();
}