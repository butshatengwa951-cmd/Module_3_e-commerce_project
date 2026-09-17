import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { reorder } from "../controllers/reorderController.js";

const router = express.Router();
router.use(authMiddleware);
router.post("/:orderId", reorder);
export default router;
