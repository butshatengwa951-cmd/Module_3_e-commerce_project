import express from "express";

import {
    signup,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetToken
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-reset-token", verifyResetToken);

export default router;