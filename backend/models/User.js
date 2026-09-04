import pool from "../config/db.js";

export const findUserByEmail = async (email) => {
    const [rows] = await pool.query(
        `
        SELECT
            user_id,
            full_name,
            email,
            password,
            phone_number,
            role,
            created_at
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email]
    );

    return rows[0] || null;
};

export const findUserById = async (userId) => {
    const [rows] = await pool.query(
        `
        SELECT
            user_id,
            full_name,
            email,
            phone_number,
            role,
            created_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows[0] || null;
};

export const createUser = async (
    fullName,
    email,
    password,
    phoneNumber,
    role = "member",
    db = pool
) => {
    const [result] = await db.query(
        `
        INSERT INTO users
            (full_name, email, password, phone_number, role)
        VALUES
            (?, ?, ?, ?, ?)
        `,
        [fullName, email, password, phoneNumber, role]
    );

    return {
        userId: result.insertId,
        fullName,
        email,
        phoneNumber,
        role
    };
};