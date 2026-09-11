import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import pool from "../config/db.js";

import { createUser, findUserByEmail } from "../models/User.js";

import { findStokvelByName } from "../models/Stokvel.js";

import {
  createStokvelMembership,
  findMembershipByUserId,
} from "../models/StokvelMem.js";

import {
  createPasswordReset,
  findValidPasswordResetByTokenHash,
  markPasswordResetUsed,
  deletePasswordReset,
} from "../models/PasswordReset.js";

import sendPasswordResetEmail from "../utils/mailer.js";

export const signup = async (req, res) => {
  let connection;

  try {
    const { full_name, email, password, phone_number, stokvel_name } = req.body;

    // ----------------------------------------
    // 1. Validate required fields
    // ----------------------------------------

    if (!full_name || !email || !password || !stokvel_name) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, password and stokvel are required.",
      });
    }

    // ----------------------------------------
    // 2. Basic password validation
    // ----------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // ----------------------------------------
    // 3. Clean input
    // ----------------------------------------

    const cleanFullName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStokvelName = stokvel_name.trim();
    const cleanPhoneNumber = phone_number ? phone_number.trim() : null;

    // ----------------------------------------
    // 4. Check whether email already exists
    // ----------------------------------------

    const existingUser = await findUserByEmail(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ----------------------------------------
    // 5. Find selected stokvel
    // ----------------------------------------

    const stokvel = await findStokvelByName(cleanStokvelName);

    if (!stokvel) {
      return res.status(400).json({
        success: false,
        message: "Invalid stokvel selected.",
      });
    }

    // ----------------------------------------
    // 6. Hash password
    // ----------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // ----------------------------------------
    // 7. Start transaction
    // ----------------------------------------

    connection = await pool.getConnection();

    const [dbCheck] = await connection.query(`
    SELECT
        DATABASE() AS database_name,
        @@hostname AS hostname,
        @@port AS port
`);

    console.log("=== SIGNUP DATABASE CONNECTION ===");
    console.log(dbCheck[0]);
    console.log("==================================");

    await connection.beginTransaction();

    // ----------------------------------------
    // 8. Create user
    // ----------------------------------------

    const user = await createUser(
      cleanFullName,
      cleanEmail,
      hashedPassword,
      cleanPhoneNumber,
      "member",
      connection,
    );

    // ----------------------------------------
    // 9. Create stokvel membership
    // ----------------------------------------

    const membership = await createStokvelMembership(
      stokvel.stokvel_id,
      user.userId,
      connection,
    );

    // ----------------------------------------
    // 10. Commit transaction
    // ----------------------------------------

    await connection.commit();

    // ----------------------------------------
    // 11. Successful response
    // ----------------------------------------

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        user_id: user.userId,
        full_name: user.fullName,
        email: user.email,
        phone_number: user.phoneNumber,
        role: user.role,
      },
      stokvel: {
        stokvel_id: stokvel.stokvel_id,
        stokvel_name: stokvel.stokvel_name,
      },
      membership: {
        stokvel_member_id: membership.stokvelMemberId,
      },
    });
  } catch (error) {
    // ----------------------------------------
    // 12. Rollback if something failed
    // ----------------------------------------

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);
      }
    }

    console.error("Signup failed!");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Signup failed.",
    });
  } finally {
    // ----------------------------------------
    // 13. Release connection
    // ----------------------------------------

    if (connection) {
      connection.release();
    }
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ----------------------------------------
    // 1. Validate required fields
    // ----------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // ----------------------------------------
    // 2. Clean email
    // ----------------------------------------

    const cleanEmail = email.trim().toLowerCase();

    // ----------------------------------------
    // 3. Find user
    // ----------------------------------------

    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ----------------------------------------
    // 4. Check password
    // ----------------------------------------

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ----------------------------------------
    // 5. Check Stokvel membership
    // ----------------------------------------

    const membership = await findMembershipByUserId(user.user_id);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of a Stokvel to log in.",
      });
    }

    // ----------------------------------------
    // 6. Create JWT
    // ----------------------------------------

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // ----------------------------------------
    // 7. Successful login response
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
      },
      stokvel: {
        stokvel_id: membership.stokvel_id,
        stokvel_name: membership.stokvel_name,
      },
    });
  } catch (error) {
    console.error("Login failed!");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await findUserByEmail(cleanEmail);

    // Do not reveal whether the account exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists for this email, a password reset link has been sent.",
      });
    }

    // Generate random one-time token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash of the token.
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires after 30 minutes.
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const resetRecord = await createPasswordReset(
      user.user_id,
      tokenHash,
      expiresAt,
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.full_name, resetUrl);
    } catch (emailError) {
      // Do not leave a usable reset token if email delivery failed.
      await deletePasswordReset(resetRecord.passwordResetId);

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password failed!");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
};

export const resetPassword = async (req, res) => {
  let connection;

  try {
    const { token, password, confirm_password } = req.body;

    if (!token || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token, password and password confirmation are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // Hash the token supplied in the reset link.
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    connection = await pool.getConnection();

    await connection.beginTransaction();

    const resetRecord = await findValidPasswordResetByTokenHash(
      tokenHash,
      connection,
    );

    if (!resetRecord) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      `
            UPDATE users
            SET password = ?
            WHERE user_id = ?
            `,
      [hashedPassword, resetRecord.user_id],
    );

    await markPasswordResetUsed(resetRecord.password_reset_id, connection);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);
      }
    }

    console.error("Reset password failed!");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await findValidPasswordResetByTokenHash(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset link is valid.",
    });
  } catch (error) {
    console.error("Verify reset token failed!");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify password reset link.",
    });
  }
};
