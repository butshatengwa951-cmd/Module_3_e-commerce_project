import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import stokvelRoutes from "./routes/stokvelRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StockWell API is running.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/stokvels", stokvelRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 4040;

app.listen(PORT, () => {
  console.log(`StockWell API running on port ${PORT}`);
});
