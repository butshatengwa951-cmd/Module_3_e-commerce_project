import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getCurrentOrder,
  confirmCurrentOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/current", getCurrentOrder);
router.post("/current/confirm", confirmCurrentOrder);

export default router;
