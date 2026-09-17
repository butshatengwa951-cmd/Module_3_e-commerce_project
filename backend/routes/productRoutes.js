import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProducts, getGroupProducts, getProduct, addProduct, editProduct, removeProduct } from "../controllers/productController.js";
const router=express.Router();
router.get("/group",authMiddleware,getGroupProducts);
router.get("/",getProducts);
router.get("/:id",getProduct);
router.post("/",addProduct);router.put("/:id",editProduct);router.patch("/:id",editProduct);router.delete("/:id",removeProduct);
export default router;
