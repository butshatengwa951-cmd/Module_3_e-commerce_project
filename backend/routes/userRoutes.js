import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMemberDashboard, getProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.get("/member-dashboard", authMiddleware, getMemberDashboard);

export default router;
