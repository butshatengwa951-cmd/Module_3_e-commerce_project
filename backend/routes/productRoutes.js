import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { getProducts, getGroupProducts, getProduct, addProduct, editProduct, removeProduct } from "../controllers/productController.js";

const router = express.Router();

router.get("/group", authMiddleware, getGroupProducts);
router.get("/", getProducts);
router.get("/:id", getProduct);

// Product mutations are company-admin operations. The frontend's admin UI
// uses /api/admin/products, but these legacy product routes remain protected
// so they cannot be used to bypass administrator authorization.
router.post("/", authMiddleware, adminMiddleware, addProduct);
router.put("/:id", authMiddleware, adminMiddleware, editProduct);
router.patch("/:id", authMiddleware, adminMiddleware, editProduct);
router.delete("/:id", authMiddleware, adminMiddleware, removeProduct);

export default router;
