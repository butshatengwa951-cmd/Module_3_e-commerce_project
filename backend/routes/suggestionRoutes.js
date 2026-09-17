import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {createSuggestion,getMySuggestions,getAllSuggestions,updateSuggestion} from "../controllers/suggestionController.js";
const router=express.Router();
router.post('/',authMiddleware,createSuggestion); router.get('/mine',authMiddleware,getMySuggestions); router.get('/admin',authMiddleware,adminMiddleware,getAllSuggestions); router.patch('/admin/:id',authMiddleware,adminMiddleware,updateSuggestion);
export default router;
