import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createContributionCheckout, getContributionPayment } from "../controllers/payfastController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/current", getContributionPayment);
router.post("/payfast/checkout", createContributionCheckout);
export default router;
