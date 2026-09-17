import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import stokvelRoutes from "./routes/stokvelRoutes.js";
import stokvelFeaturesRoutes from "./routes/stokvelFeaturesRoutes.js";
import stokvelProposalRoutes from "./routes/stokvelProposalRoutes.js";
import stokvelMemberAddressRoutes from "./routes/stokvelMemberAddressRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reorderRoutes from "./routes/reorderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import { payfastNotify } from "./controllers/payfastController.js";

dotenv.config();

const app = express();

const allowedOrigins = String(process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => res.json({ success: true, message: "StockWell API is running." }));
app.get("/health", (req, res) => res.json({ success: true, status: "healthy" }));

// PayFast ITN must remain publicly reachable and must not require JWT authentication.
app.post("/api/payment/payfast/notify", payfastNotify);

app.use("/api/auth", authRoutes);
app.use("/api/stokvels", stokvelRoutes);
app.use("/api/stokvel-features", stokvelFeaturesRoutes);
app.use("/api/stokvel-proposals", stokvelProposalRoutes);
app.use("/api/stokvel-addresses", stokvelMemberAddressRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reorder", reorderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/suggestions", suggestionRoutes);

const PORT = Number(process.env.PORT) || 4040;
app.listen(PORT, "0.0.0.0", () => console.log(`StockWell API running on port ${PORT}`));
