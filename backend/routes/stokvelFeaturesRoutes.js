import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getFeatures, saveGoal, vote } from "../controllers/stokvelFeaturesController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getFeatures);
router.put("/goal", saveGoal);
router.post("/votes", vote);
export default router;
