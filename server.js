import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import db from "./backend/config/db.js";

import productRoutes from "./backend/routes/productRoutes.js";
import supplierPriceRoutes from "./backend/routes/supplierPriceRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Home
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the StockWell API",
  });
});

// Test database
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");

    res.json({
      message: "Database connection successful",
      data: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// API ROUTES

app.use("/products", productRoutes);

app.use("/supplier-prices", supplierPriceRoutes);

// Dashboard data
app.get("/dashboard/admin", async (req, res) => {
  try {
    const [[productCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM products",
    );
    const [[supplierCount]] = await db.query(
      "SELECT COUNT(DISTINCT supplier_name) AS total FROM supplier_prices",
    );
    const [[groupCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM stokvels",
    );
    const [[orderCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM order_details",
    );

    res.json({
      products: productCount.total,
      suppliers: supplierCount.total,
      groups: groupCount.total,
      orders: orderCount.total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load admin dashboard" });
  }
});

app.get("/dashboard/orders", async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM order_details ORDER BY order_date DESC",
    );
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

app.get("/dashboard/member", async (req, res) => {
  try {
    const [[group]] = await db.query(
      "SELECT * FROM stokvels ORDER BY stokvel_id LIMIT 1",
    );
    const [members] = await db.query(
      `
      SELECT u.full_name, mc.amount, mc.payment_status
      FROM users u
      LEFT JOIN money_contributions mc ON mc.member_name = u.full_name
      INNER JOIN stokvel_members sm ON sm.user_id = u.user_id
      WHERE sm.stokvel_id = ?
      ORDER BY u.user_id
    `,
      [group?.stokvel_id || 1],
    );
    const [[contributions]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM money_contributions WHERE payment_status = 'Paid'",
    );

    res.json({ group, members, contributionTotal: contributions.total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load member dashboard" });
  }
});

app.post("/dashboard/contributions", async (req, res) => {
  try {
    const { card_id, member_name, amount } = req.body;

    if (!card_id || !member_name || !amount) {
      return res
        .status(400)
        .json({ message: "Card, member name and amount are required" });
    }

    const [result] = await db.query(
      `
      INSERT INTO money_contributions (card_id, member_name, amount, payment_status)
      VALUES (?, ?, ?, 'Paid')
    `,
      [card_id, member_name, amount],
    );

    res
      .status(201)
      .json({
        message: "Contribution added",
        contribution_id: result.insertId,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add contribution" });
  }
});

// Start server

const PORT = process.env.PORT || 4040;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
