USE StockWell;

-- Safe post-integration hardening for an existing StockWell database.
-- This does not drop or reset application data.

CREATE TABLE IF NOT EXISTS stokvel_goals (
  goal_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  deadline DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_stokvel_goal (stokvel_id),
  CONSTRAINT fk_hardening_goal_stokvel FOREIGN KEY (stokvel_id)
    REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_member_roles (
  stokvel_member_id INT NOT NULL PRIMARY KEY,
  stokvel_role ENUM('MEMBER','CHAIRPERSON','TREASURER') NOT NULL DEFAULT 'MEMBER',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hardening_role_member FOREIGN KEY (stokvel_member_id)
    REFERENCES stokvel_members(stokvel_member_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Older/live databases may not have stokvels.chairperson_id even though the
-- original reset schema did. The current users table already stores the
-- platform/member role, so use that to seed Stokvel-level roles instead.
INSERT INTO stokvel_member_roles (stokvel_member_id,stokvel_role)
SELECT sm.stokvel_member_id,
       CASE
         WHEN LOWER(COALESCE(u.role,'member'))='chairperson' THEN 'CHAIRPERSON'
         ELSE 'MEMBER'
       END
FROM stokvel_members sm
INNER JOIN users u ON u.user_id=sm.user_id
LEFT JOIN stokvel_member_roles smr ON smr.stokvel_member_id=sm.stokvel_member_id
WHERE smr.stokvel_member_id IS NULL;

CREATE TABLE IF NOT EXISTS payfast_payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stokvel_id INT NOT NULL,
  m_payment_id VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  status ENUM('CREATED','PENDING','COMPLETE','FAILED','CANCELLED') NOT NULL DEFAULT 'CREATED',
  pf_payment_id VARCHAR(100) NULL,
  raw_status VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  INDEX idx_hardening_payfast_user (user_id),
  INDEX idx_hardening_payfast_stokvel (stokvel_id),
  INDEX idx_hardening_payfast_status (status),
  CONSTRAINT fk_hardening_payfast_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hardening_payfast_stokvel FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- PayFast contributions do not store card details in StockWell, so card_id
-- must be nullable for a contribution created by the PayFast ITN callback.
SET @card_nullable_sql = (
  SELECT IF(
    IS_NULLABLE='NO',
    'ALTER TABLE money_contributions MODIFY COLUMN card_id INT NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE()
    AND TABLE_NAME='money_contributions'
    AND COLUMN_NAME='card_id'
  LIMIT 1
);
SET @card_nullable_sql = COALESCE(@card_nullable_sql,'SELECT 1');
PREPARE hardening_stmt FROM @card_nullable_sql;
EXECUTE hardening_stmt;
DEALLOCATE PREPARE hardening_stmt;

-- The Stokvel relationship is required by the current dashboard and PayFast
-- contribution flow. Add it only when an older database does not have it.
SET @stokvel_id_sql = (
  SELECT IF(
    COUNT(*)=0,
    'ALTER TABLE money_contributions ADD COLUMN stokvel_id INT NULL AFTER card_id',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE()
    AND TABLE_NAME='money_contributions'
    AND COLUMN_NAME='stokvel_id'
);
PREPARE hardening_stmt FROM @stokvel_id_sql;
EXECUTE hardening_stmt;
DEALLOCATE PREPARE hardening_stmt;

SET @stokvel_id_index_sql = (
  SELECT IF(
    COUNT(*)=0,
    'ALTER TABLE money_contributions ADD INDEX idx_hardening_money_contributions_stokvel (stokvel_id)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA=DATABASE()
    AND TABLE_NAME='money_contributions'
    AND INDEX_NAME='idx_hardening_money_contributions_stokvel'
);
PREPARE hardening_stmt FROM @stokvel_id_index_sql;
EXECUTE hardening_stmt;
DEALLOCATE PREPARE hardening_stmt;

-- Link legacy contribution rows to their Stokvel where a unique member name
-- can be resolved. Existing explicit Stokvel IDs are never overwritten.
UPDATE money_contributions mc
INNER JOIN users u ON u.full_name=mc.member_name
INNER JOIN stokvel_members sm ON sm.user_id=u.user_id
SET mc.stokvel_id=sm.stokvel_id
WHERE mc.stokvel_id IS NULL;
