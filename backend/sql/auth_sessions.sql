-- StockWell authentication session storage.
-- This migration is additive: it does not drop or recreate application tables.
-- Run against the existing database before enabling refresh/logout in production.

CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id CHAR(36) NOT NULL PRIMARY KEY,
    user_id INT NOT NULL,
    refresh_token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL DEFAULT NULL,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    UNIQUE KEY uq_auth_sessions_refresh_hash (refresh_token_hash),
    KEY idx_auth_sessions_user (user_id),
    KEY idx_auth_sessions_expiry (expires_at),
    KEY idx_auth_sessions_revoked (revoked_at)
);