import express from "express";

import {
    getAllStokvelsController,
    getStokvelByIdController
} from "../controllers/stokvelController.js";

const router = express.Router();

router.get("/", getAllStokvelsController);

router.get("/:id", getStokvelByIdController);

export default router;