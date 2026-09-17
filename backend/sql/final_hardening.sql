USE StockWell;

-- StockWell final live-database hardening.
-- SAFE FOR THE EXISTING AIVEN DATABASE.
-- This migration is additive/normalising only. It does not drop tables or reset data.
-- Run this AFTER the existing integration_hardening.sql and stokvel_delivery_addresses.sql.

CREATE TABLE IF NOT EXISTS stokvel_member_roles (
  stokvel_member_id INT NOT NULL PRIMARY KEY,
  stokvel_role ENUM('MEMBER','CHAIRPERSON','TREASURER') NOT NULL DEFAULT 'MEMBER',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_final_role_member FOREIGN KEY (stokvel_member_id)
    REFERENCES stokvel_members(stokvel_member_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve any legacy chairperson assignments before removing chairperson
-- from the company-level users.role field.
INSERT INTO stokvel_member_roles (stokvel_member_id, stokvel_role)
SELECT sm.stokvel_member_id, 'CHAIRPERSON'
FROM stokvel_members sm
INNER JOIN users u ON u.user_id = sm.user_id
LEFT JOIN stokvel_member_roles smr ON smr.stokvel_member_id = sm.stokvel_member_id
WHERE LOWER(COALESCE(u.role, 'member')) = 'chairperson'
  AND smr.stokvel_member_id IS NULL;

-- PayFast and the current dashboard should identify contributions by user_id,
-- not by full_name. Keep the column nullable so legacy rows can remain intact.
SET @add_user_id_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE money_contributions ADD COLUMN user_id INT NULL AFTER card_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'money_contributions'
    AND COLUMN_NAME = 'user_id'
);
SET @add_user_id_sql = COALESCE(@add_user_id_sql, 'SELECT 1');
PREPARE final_stmt FROM @add_user_id_sql;
EXECUTE final_stmt;
DEALLOCATE PREPARE final_stmt;

-- Backfill only names that resolve to exactly one user. Ambiguous legacy
-- names remain nullable instead of being assigned to the wrong account.
UPDATE money_contributions mc
INNER JOIN users u ON u.full_name = mc.member_name
INNER JOIN (
  SELECT full_name
  FROM users
  GROUP BY full_name
  HAVING COUNT(*) = 1
) unique_names ON unique_names.full_name = u.full_name
SET mc.user_id = u.user_id
WHERE mc.user_id IS NULL;

SET @add_user_index_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE money_contributions ADD INDEX idx_money_contributions_user (user_id)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'money_contributions'
    AND INDEX_NAME = 'idx_money_contributions_user'
);
SET @add_user_index_sql = COALESCE(@add_user_index_sql, 'SELECT 1');
PREPARE final_stmt FROM @add_user_index_sql;
EXECUTE final_stmt;
DEALLOCATE PREPARE final_stmt;

SET @add_user_fk_sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE money_contributions ADD CONSTRAINT fk_money_contributions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'money_contributions'
    AND CONSTRAINT_NAME = 'fk_money_contributions_user'
);
SET @add_user_fk_sql = COALESCE(@add_user_fk_sql, 'SELECT 1');
PREPARE final_stmt FROM @add_user_fk_sql;
EXECUTE final_stmt;
DEALLOCATE PREPARE final_stmt;

-- The current application deliberately models one active Stokvel per member.
-- Refuse to install the DB constraint if conflicting memberships already exist.
DROP PROCEDURE IF EXISTS sp_stockwell_final_hardening;
DELIMITER $$
CREATE PROCEDURE sp_stockwell_final_hardening()
BEGIN
  DECLARE duplicate_members INT DEFAULT 0;
  SELECT COUNT(*) INTO duplicate_members
  FROM (
    SELECT user_id
    FROM stokvel_members
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_members > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot enforce one-Stokvel-per-member: duplicate Stokvel memberships exist. Review stokvel_members first.';
  END IF;

  SET @member_unique_sql = (
    SELECT IF(
      COUNT(*) = 0,
      'ALTER TABLE stokvel_members ADD UNIQUE KEY uq_stokvel_member_user (user_id)',
      'SELECT 1'
    )
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stokvel_members'
      AND INDEX_NAME = 'uq_stokvel_member_user'
  );
  SET @member_unique_sql = COALESCE(@member_unique_sql, 'SELECT 1');
  PREPARE member_stmt FROM @member_unique_sql;
  EXECUTE member_stmt;
  DEALLOCATE PREPARE member_stmt;

  -- Chairperson/treasurer are Stokvel-level roles. Company users are either
  -- members or platform administrators.
  UPDATE users
  SET role = 'member'
  WHERE LOWER(role) = 'chairperson';

  ALTER TABLE users
    MODIFY COLUMN role ENUM('member','admin') NOT NULL DEFAULT 'member';
END$$
DELIMITER ;

CALL sp_stockwell_final_hardening();
DROP PROCEDURE IF EXISTS sp_stockwell_final_hardening;
