import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../config/db.js";

import {
    createUser,
    findUserByEmail
} from "../models/User.js";

import {
    findStokvelByName
} from "../models/Stokvel.js";

import {
    createStokvelMembership,
    findMembershipByUserId
} from "../models/StokvelMem.js";

export const signup = async (req, res) => {
    let connection;

    try {
        const {
            full_name,
            email,
            password,
            phone_number,
            stokvel_name
        } = req.body;

        // ----------------------------------------
        // 1. Validate required fields
        // ----------------------------------------

        if (
            !full_name ||
            !email ||
            !password ||
            !stokvel_name
        ) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, password and stokvel are required."
            });
        }

        // ----------------------------------------
        // 2. Basic password validation
        // ----------------------------------------

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long."
            });
        }

        // ----------------------------------------
        // 3. Clean input
        // ----------------------------------------

        const cleanFullName = full_name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanStokvelName = stokvel_name.trim();
        const cleanPhoneNumber = phone_number
            ? phone_number.trim()
            : null;

        // ----------------------------------------
        // 4. Check whether email already exists
        // ----------------------------------------

        const existingUser = await findUserByEmail(cleanEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        // ----------------------------------------
        // 5. Find selected stokvel
        // ----------------------------------------

        const stokvel = await findStokvelByName(
            cleanStokvelName
        );

        if (!stokvel) {
            return res.status(400).json({
                success: false,
                message: "Invalid stokvel selected."
            });
        }

        // ----------------------------------------
        // 6. Hash password
        // ----------------------------------------

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // ----------------------------------------
        // 7. Start transaction
        // ----------------------------------------

        connection = await pool.getConnection();

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
            connection
        );

        // ----------------------------------------
        // 9. Create stokvel membership
        // ----------------------------------------

        const membership = await createStokvelMembership(
            stokvel.stokvel_id,
            user.userId,
            connection
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
                role: user.role
            },
            stokvel: {
                stokvel_id: stokvel.stokvel_id,
                stokvel_name: stokvel.stokvel_name
            },
            membership: {
                stokvel_member_id: membership.stokvelMemberId
            }
        });

    } catch (error) {

        // ----------------------------------------
        // 12. Rollback if something failed
        // ----------------------------------------

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback failed:",
                    rollbackError.message
                );
            }
        }

        console.error("Signup failed!");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Signup failed."
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
                message: "Email and password are required."
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
                message: "Invalid email or password."
            });
        }

        // ----------------------------------------
        // 4. Check password
        // ----------------------------------------

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // ----------------------------------------
        // 5. Check Stokvel membership
        // ----------------------------------------

        const membership = await findMembershipByUserId(
            user.user_id
        );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You must be a member of a Stokvel to log in."
            });
        }

        // ----------------------------------------
        // 6. Create JWT
        // ----------------------------------------

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
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
                role: user.role
            },
            stokvel: {
                stokvel_id: membership.stokvel_id,
                stokvel_name: membership.stokvel_name
            }
        });

    } catch (error) {
        console.error("Login failed!");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};