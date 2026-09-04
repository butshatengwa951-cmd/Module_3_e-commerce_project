import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import stokvelRoutes from "./routes/stokvelRoutes.js";

dotenv.config();

const app = express();


// ----------------------------------------
// Middleware
// ----------------------------------------

app.use(cors());

app.use(express.json());


// ----------------------------------------
// Basic test route
// ----------------------------------------

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "StockWell API is running."
    });
});


// ----------------------------------------
// API routes
// ----------------------------------------

app.use("/api/auth", authRoutes);

app.use("/api/stokvels", stokvelRoutes);


// ----------------------------------------
// Start server
// ----------------------------------------

const PORT = process.env.PORT || 4040;

app.listen(PORT, () => {
    console.log(`StockWell API running on port ${PORT}`);
});