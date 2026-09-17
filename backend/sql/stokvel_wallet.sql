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

INSERT INTO stokvel_wallets (stokvel_id, balance)
SELECT
  s.stokvel_id,
  GREATEST(
    0,
    COALESCE((SELECT SUM(mc.amount)
              FROM money_contributions mc
              WHERE mc.stokvel_id = s.stokvel_id
                AND mc.payment_status = 'Paid'), 0)
    -
    COALESCE((SELECT SUM(od.total_amount)
              FROM order_details od
              WHERE od.stokvel_id = s.stokvel_id
                AND od.order_status IN ('Confirmed','Processing','Completed')), 0)
  )
FROM stokvels s
ON DUPLICATE KEY UPDATE balance = balance;
