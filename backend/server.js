import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import stokvelRoutes from "./routes/stokvelRoutes.js";
import stokvelFeaturesRoutes from "./routes/stokvelFeaturesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reorderRoutes from "./routes/reorderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => res.json({ success: true, message: "StockWell API is running." }));
app.use("/api/auth", authRoutes);
app.use("/api/stokvels", stokvelRoutes);
app.use("/api/stokvel-features", stokvelFeaturesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reorder", reorderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/suggestions", suggestionRoutes);

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => console.log(`StockWell API running on port ${PORT}`));
