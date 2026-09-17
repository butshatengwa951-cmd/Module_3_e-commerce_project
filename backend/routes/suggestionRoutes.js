import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  createSuggestion,
  getMySuggestions,
  getAllSuggestions,
  updateSuggestion,
} from "../controllers/suggestionController.js";

const router = express.Router();

// Logged-in members can submit suggestions and view their own submissions.
router.post("/", authMiddleware, createSuggestion);
router.get("/mine", authMiddleware, getMySuggestions);

// Company admins can read and respond to all suggestions.
router.get("/admin", authMiddleware, adminMiddleware, getAllSuggestions);
router.patch("/admin/:id", authMiddleware, adminMiddleware, updateSuggestion);

export default router;
