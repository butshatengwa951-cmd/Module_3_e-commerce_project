import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCurrentOrder, getOrderDetails, getOrderHistory } from "../controllers/orderController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/current", getCurrentOrder);
router.get("/history", getOrderHistory);
router.get("/history/:orderId", getOrderDetails);
export default router;
