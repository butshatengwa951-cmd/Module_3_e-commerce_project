import pool from "../config/db.js";

export const createStokvelMembership = async (
    stokvelId,
    userId,
    db = pool
) => {
    const [result] = await db.query(
        `
        INSERT INTO stokvel_members
            (stokvel_id, user_id)
        VALUES
            (?, ?)
        `,
        [stokvelId, userId]
    );

    return {
        stokvelMemberId: result.insertId,
        stokvelId,
        userId
    };
};

export const findMembershipByUserId = async (userId) => {
    const [rows] = await pool.query(
        `
        SELECT
            sm.stokvel_member_id,
            sm.stokvel_id,
            sm.user_id,
            sm.joined_at,
            s.stokvel_name,
            s.description
        FROM stokvel_members sm
        INNER JOIN stokvels s
            ON sm.stokvel_id = s.stokvel_id
        WHERE sm.user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows[0] || null;
};

export const findMembership = async (stokvelId, userId) => {
    const [rows] = await pool.query(
        `
        SELECT
            stokvel_member_id,
            stokvel_id,
            user_id,
            joined_at
        FROM stokvel_members
        WHERE stokvel_id = ?
          AND user_id = ?
        LIMIT 1
        `,
        [stokvelId, userId]
    );

    return rows[0] || null;
};

export const getMembersByStokvelId = async (stokvelId) => {
    const [rows] = await pool.query(
        `
        SELECT
            sm.stokvel_member_id,
            sm.joined_at,
            u.user_id,
            u.full_name,
            u.email,
            u.phone_number,
            u.role
        FROM stokvel_members sm
        INNER JOIN users u
            ON sm.user_id = u.user_id
        WHERE sm.stokvel_id = ?
        ORDER BY sm.joined_at
        `,
        [stokvelId]
    );

    return rows;
};