import pool from "../config/db.js";

export const createPasswordReset = async (
    userId,
    tokenHash,
    expiresAt,
    db = pool
) => {
    // Remove previous unused reset tokens for this user.
    await db.query(
        `
        DELETE FROM password_resets
        WHERE user_id = ?
          AND used_at IS NULL
        `,
        [userId]
    );

    const [result] = await db.query(
        `
        INSERT INTO password_resets
            (user_id, token_hash, expires_at)
        VALUES
            (?, ?, ?)
        `,
        [userId, tokenHash, expiresAt]
    );

    return {
        passwordResetId: result.insertId,
        userId,
        tokenHash,
        expiresAt
    };
};

export const findValidPasswordResetByTokenHash = async (
    tokenHash,
    db = pool
) => {
    const [rows] = await db.query(
        `
        SELECT
            password_reset_id,
            user_id,
            token_hash,
            expires_at,
            used_at
        FROM password_resets
        WHERE token_hash = ?
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
        FOR UPDATE
        `,
        [tokenHash]
    );

    return rows[0] || null;
};

export const markPasswordResetUsed = async (
    passwordResetId,
    db = pool
) => {
    await db.query(
        `
        UPDATE password_resets
        SET used_at = NOW()
        WHERE password_reset_id = ?
          AND used_at IS NULL
        `,
        [passwordResetId]
    );
};

export const deletePasswordReset = async (
    passwordResetId,
    db = pool
) => {
    await db.query(
        `
        DELETE FROM password_resets
        WHERE password_reset_id = ?
        `,
        [passwordResetId]
    );
};