import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import pool from "../config/db.js";
import { createUser, findUserByEmail } from "../models/User.js";
import { findStokvelByName } from "../models/Stokvel.js";
import { createStokvelMembership, findMembershipByUserId } from "../models/StokvelMem.js";
import { createPasswordReset, findValidPasswordResetByTokenHash, markPasswordResetUsed, deletePasswordReset } from "../models/PasswordReset.js";
import { createSession, findActiveSession, revokeSession, rotateSession } from "../models/AuthSession.js";
import sendPasswordResetEmail from "../utils/mailer.js";

const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);

const createAccessToken = (user) => jwt.sign(
  { user_id: user.user_id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: ACCESS_TOKEN_TTL }
);

const createRefreshToken = () => crypto.randomBytes(48).toString("base64url");
const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const refreshExpiresAt = () => new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
const newSessionId = () => crypto.randomUUID();

const buildAuthResponse = ({ user, membership, accessToken, refreshToken, sessionId }) => ({
  success: true,
  token: accessToken,
  access_token: accessToken,
  refresh_token: refreshToken,
  session_id: sessionId,
  user: {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    role: user.role,
  },
  stokvel: membership ? {
    stokvel_id: membership.stokvel_id,
    stokvel_name: membership.stokvel_name,
    stokvel_role: String(membership.stokvel_role || "MEMBER").toUpperCase(),
  } : null,
});

export const signup = async (req, res) => {
  let connection;
  try {
    const { full_name, email, password, phone_number, stokvel_name } = req.body;
    if (!full_name || !email || !password || !stokvel_name) return res.status(400).json({ success: false, message: "Full name, email, password and stokvel are required." });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    const cleanFullName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStokvelName = stokvel_name.trim();
    const cleanPhoneNumber = phone_number ? phone_number.trim() : null;
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) return res.status(409).json({ success: false, message: "An account with this email already exists." });
    const stokvel = await findStokvelByName(cleanStokvelName);
    if (!stokvel) return res.status(400).json({ success: false, message: "Invalid stokvel selected." });
    const hashedPassword = await bcrypt.hash(password, 10);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const user = await createUser(cleanFullName, cleanEmail, hashedPassword, cleanPhoneNumber, "member", connection);
    const membership = await createStokvelMembership(stokvel.stokvel_id, user.userId, connection);
    await connection.commit();
    return res.status(201).json({ success: true, message: "Account created successfully.", user: { user_id: user.userId, full_name: user.fullName, email: user.email, phone_number: user.phoneNumber, role: user.role }, stokvel: { stokvel_id: stokvel.stokvel_id, stokvel_name: stokvel.stokvel_name }, membership: { stokvel_member_id: membership.stokvelMemberId } });
  } catch (error) {
    if (connection) { try { await connection.rollback(); } catch (rollbackError) { console.error("Rollback failed:", rollbackError.message); } }
    console.error("Signup failed!", error);
    return res.status(500).json({ success: false, message: "Signup failed." });
  } finally { if (connection) connection.release(); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });
    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password." });
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return res.status(401).json({ success: false, message: "Invalid email or password." });

    // Admins are platform users and do not need Stokvel membership. Members do.
    let membership = null;
    if (user.role !== "admin") {
      membership = await findMembershipByUserId(user.user_id);
      if (!membership) return res.status(403).json({ success: false, message: "You must be a member of a Stokvel to log in." });
    }

    // Access tokens are short-lived. The opaque refresh token is stored only as a hash in MySQL.
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken();
    const sessionId = newSessionId();
    await createSession({ sessionId, userId: user.user_id, refreshTokenHash: hashRefreshToken(refreshToken), expiresAt: refreshExpiresAt() });

    return res.status(200).json({
      ...buildAuthResponse({ user, membership, accessToken, refreshToken, sessionId }),
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login failed!", error);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.body?.refresh_token;
    const sessionId = req.body?.session_id;
    if (!refreshToken || !sessionId) return res.status(400).json({ success: false, message: "Refresh token and session ID are required." });

    const session = await findActiveSession(sessionId, hashRefreshToken(refreshToken));
    if (!session) return res.status(401).json({ success: false, message: "Refresh session is invalid, expired, or revoked. Please log in again." });

    const user = {
      user_id: session.user_id,
      full_name: session.full_name,
      email: session.email,
      phone_number: session.phone_number,
      role: session.role,
    };
    let membership = null;
    if (user.role !== "admin") {
      membership = await findMembershipByUserId(user.user_id);
      if (!membership) return res.status(403).json({ success: false, message: "Your Stokvel membership is no longer active." });
    }

    const nextRefreshToken = createRefreshToken();
    const accessToken = createAccessToken(user);
    await rotateSession({ sessionId, refreshTokenHash: hashRefreshToken(nextRefreshToken), expiresAt: refreshExpiresAt() });

    return res.status(200).json({
      ...buildAuthResponse({ user, membership, accessToken, refreshToken: nextRefreshToken, sessionId }),
      message: "Session refreshed successfully.",
    });
  } catch (error) {
    console.error("Refresh failed!", error);
    return res.status(500).json({ success: false, message: "Unable to refresh session." });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.body?.session_id;
    if (sessionId) await revokeSession(sessionId);
    return res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout failed!", error);
    return res.status(500).json({ success: false, message: "Unable to log out." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });
    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);
    if (!user) return res.status(200).json({ success: true, message: "If an account exists for this email, a password reset link has been sent." });
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const resetRecord = await createPasswordReset(user.user_id, tokenHash, expiresAt);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    try { await sendPasswordResetEmail(user.email, user.full_name, resetUrl); } catch (emailError) { await deletePasswordReset(resetRecord.passwordResetId); throw emailError; }
    return res.status(200).json({ success: true, message: "If an account exists for this email, a password reset link has been sent." });
  } catch (error) { console.error("Forgot password failed!", error); return res.status(500).json({ success: false, message: "Unable to process password reset request." }); }
};

export const resetPassword = async (req, res) => {
  let connection;
  try {
    const { token, password, confirm_password } = req.body;
    if (!token || !password || !confirm_password) return res.status(400).json({ success: false, message: "Reset token, password and password confirmation are required." });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    if (password !== confirm_password) return res.status(400).json({ success: false, message: "Passwords do not match." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const resetRecord = await findValidPasswordResetByTokenHash(tokenHash, connection);
    if (!resetRecord) { await connection.rollback(); return res.status(400).json({ success: false, message: "This password reset link is invalid or has expired." }); }
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query(`UPDATE users SET password = ? WHERE user_id = ?`, [hashedPassword, resetRecord.user_id]);
    await markPasswordResetUsed(resetRecord.password_reset_id, connection);
    await connection.commit();
    return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    if (connection) { try { await connection.rollback(); } catch (rollbackError) { console.error("Rollback failed:", rollbackError.message); } }
    console.error("Reset password failed!", error);
    return res.status(500).json({ success: false, message: "Unable to reset password." });
  } finally { if (connection) connection.release(); }
};

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: "Password reset token is required." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetRecord = await findValidPasswordResetByTokenHash(tokenHash);
    if (!resetRecord) return res.status(400).json({ success: false, message: "This password reset link is invalid or has expired." });
    return res.status(200).json({ success: true, message: "Password reset link is valid." });
  } catch (error) { console.error("Verify reset token failed!", error); return res.status(500).json({ success: false, message: "Unable to verify password reset link." }); }
};