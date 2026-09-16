import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getPaymentOptions,
  payOrder,
} from "../controllers/paymentController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/current", getPaymentOptions);
router.post("/current/pay", payOrder);

export default router;
