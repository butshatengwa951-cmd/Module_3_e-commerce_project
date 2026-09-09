require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const { testConnection } = require("./config/db");
const initDB = require("./models/init");
const app = express();
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.get("/", (req, res) =>
  res.json({
    ok: true,
    message: "StockWell API - real schema",
    backend: 4040,
    frontend: 5173,
    db: process.env.DB_NAME,
  }),
);
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    backend: 4040,
    db: process.env.DB_NAME,
    time: new Date(),
  }),
);
app.use("/api/cart", require("./routes/cart"));
app.use("/api/pay", require("./routes/pay"));
app.use("/api/delivery", require("./routes/delivery"));
app.use("/api/products", require("./routes/products"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cards", require("./routes/cards"));
app.use("/api/vouchers", require("./routes/vouchers"));
const PORT = process.env.PORT || 4040;
(async () => {
  await testConnection();
  await initDB();
  app.listen(PORT, () =>
    console.log(`Backend on http://localhost:${PORT} - using REAL schema.sql`),
  );
})();
