// WORKING server.js for StockWell Backend - replace your server.js with this
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./config/db.js";
import paymentRoutes from "./routes/paymentRoutes.js"; // <-- use paymentRoutes.fixed.js renamed to paymentRoutes.js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. CORS - allow frontend
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

// 2. Paystack webhook needs RAW body - MUST come before json parser
app.use(
  "/api/payments/webhook/paystack",
  express.raw({ type: "application/json" }),
);

// 3. Normal parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Test DB connection
app.get("/", (req, res) => {
  res.json({
    message: "StockWell Backend Running",
    mode: process.env.PAYMENT_MODE || "simulated",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as ok");
    const [cards] = await pool.query(
      "SELECT card_id, voucher_number, available_amount FROM card_details LIMIT 3",
    );
    res.json({ db: "connected", test: rows, sample_pots: cards });
  } catch (err) {
    res.status(500).json({ db: "failed", error: err.message });
  }
});

// 5. Payment routes
app.use("/api/payments", paymentRoutes);

// 6. 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// 7. Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: err.message });
});

// 8. START SERVER - This is what you are missing!
app.listen(PORT, () => {
  console.log(`✅ StockWell Backend running on http://localhost:${PORT}`);
  console.log(`✅ Payment Mode: ${process.env.PAYMENT_MODE || "simulated"}`);
  console.log(
    `✅ Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );
  console.log(`✅ Test DB: http://localhost:${PORT}/api/test-db`);
});
