import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { contribute, getFeatures, saveGoal, vote } from "../controllers/stokvelFeaturesController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getFeatures);
router.post("/contributions", contribute);
router.put("/goal", saveGoal);
router.post("/votes", vote);
export default router;
