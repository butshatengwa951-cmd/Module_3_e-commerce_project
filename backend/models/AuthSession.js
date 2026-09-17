import pool from "../config/db.js";

export const createSession = async ({ sessionId, userId, refreshTokenHash, expiresAt }, db = pool) => {
  await db.query(
    `
      INSERT INTO auth_sessions
        (session_id, user_id, refresh_token_hash, expires_at)
      VALUES
        (?, ?, ?, ?)
    `,
    [sessionId, userId, refreshTokenHash, expiresAt]
  );
};

export const findActiveSession = async (sessionId, refreshTokenHash, db = pool) => {
  const [rows] = await db.query(
    `
      SELECT
        s.session_id,
        s.user_id,
        s.expires_at,
        s.revoked_at,
        u.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        u.role
      FROM auth_sessions s
      INNER JOIN users u ON u.user_id = s.user_id
      WHERE s.session_id = ?
        AND s.refresh_token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [sessionId, refreshTokenHash]
  );

  return rows[0] || null;
};

export const findActiveSessionById = async (sessionId, db = pool) => {
  const [rows] = await db.query(
    `
      SELECT session_id, user_id, expires_at, revoked_at
      FROM auth_sessions
      WHERE session_id = ?
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [sessionId]
  );

  return rows[0] || null;
};

export const rotateSession = async ({ sessionId, refreshTokenHash, expiresAt }, db = pool) => {
  await db.query(
    `
      UPDATE auth_sessions
      SET refresh_token_hash = ?,
          expires_at = ?,
          last_used_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
        AND revoked_at IS NULL
    `,
    [refreshTokenHash, expiresAt, sessionId]
  );
};

export const revokeSession = async (sessionId, db = pool) => {
  await db.query(
    `
      UPDATE auth_sessions
      SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
      WHERE session_id = ?
    `,
    [sessionId]
  );
};
