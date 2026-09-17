USE StockWell;

CREATE TABLE IF NOT EXISTS stokvel_wallets (
  wallet_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_stokvel_wallet (stokvel_id),
  CONSTRAINT fk_stokvel_wallet_stokvel
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_wallet_transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  user_id INT NULL,
  transaction_type ENUM('CONTRIBUTION','PURCHASE') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reference_id INT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_transactions_stokvel (stokvel_id),
  INDEX idx_wallet_transactions_reference (reference_id),
  CONSTRAINT fk_wallet_transaction_stokvel
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_transaction_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- The Stokvel feature migration adds money_contributions.stokvel_id.
-- Run backend/sql/stokvel_features.sql before this migration.

INSERT INTO stokvel_wallets (stokvel_id, balance)
SELECT
  s.stokvel_id,
  GREATEST(
    0,
    COALESCE((SELECT SUM(mc.amount) FROM money_contributions mc WHERE mc.stokvel_id=s.stokvel_id AND mc.payment_status='Paid'),0)
    - COALESCE((SELECT SUM(od.total_amount) FROM order_details od WHERE od.stokvel_id=s.stokvel_id AND od.order_status IN ('Confirmed','Processing','Completed')),0)
  )
FROM stokvels s
ON DUPLICATE KEY UPDATE balance=balance;

INSERT INTO stokvel_wallet_transactions (stokvel_id,user_id,transaction_type,amount,reference_id,description,created_at)
SELECT mc.stokvel_id,u.user_id,'CONTRIBUTION',mc.amount,mc.contribution_id,CONCAT('Legacy member contribution #',mc.contribution_id),mc.contribution_date
FROM money_contributions mc
LEFT JOIN users u ON u.full_name=mc.member_name
WHERE mc.stokvel_id IS NOT NULL AND mc.payment_status='Paid'
  AND NOT EXISTS (SELECT 1 FROM stokvel_wallet_transactions t WHERE t.transaction_type='CONTRIBUTION' AND t.reference_id=mc.contribution_id);

INSERT INTO stokvel_wallet_transactions (stokvel_id,user_id,transaction_type,amount,reference_id,description,created_at)
SELECT od.stokvel_id,od.user_id,'PURCHASE',od.total_amount,od.order_id,CONCAT('Legacy group purchase #',od.order_id),od.order_date
FROM order_details od
WHERE od.stokvel_id IS NOT NULL AND od.order_status IN ('Confirmed','Processing','Completed')
  AND NOT EXISTS (SELECT 1 FROM stokvel_wallet_transactions t WHERE t.transaction_type='PURCHASE' AND t.reference_id=od.order_id);
