import pool from "../config/db.js";

export const getAllStokvels = async () => {
    const [rows] = await pool.query(
        `
        SELECT
            stokvel_id,
            stokvel_name,
            description,
            created_at
        FROM stokvels
        ORDER BY stokvel_id
        `
    );

    return rows;
};

export const findStokvelById = async (stokvelId) => {
    const [rows] = await pool.query(
        `
        SELECT
            stokvel_id,
            stokvel_name,
            description,
            created_at
        FROM stokvels
        WHERE stokvel_id = ?
        LIMIT 1
        `,
        [stokvelId]
    );

    return rows[0] || null;
};

export const findStokvelByName = async (stokvelName) => {
    const [rows] = await pool.query(
        `
        SELECT
            stokvel_id,
            stokvel_name,
            description,
            created_at
        FROM stokvels
        WHERE LOWER(stokvel_name) = LOWER(?)
        LIMIT 1
        `,
        [stokvelName]
    );

    return rows[0] || null;
};