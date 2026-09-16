import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
} from "../controllers/cartController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", deleteCartItem);

export default router;
