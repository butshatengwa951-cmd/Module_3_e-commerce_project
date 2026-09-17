USE StockWell;

-- Run this migration once against the existing StockWell database.
ALTER TABLE money_contributions
  ADD COLUMN stokvel_id INT NULL AFTER card_id,
  ADD INDEX idx_money_contributions_stokvel (stokvel_id),
  ADD CONSTRAINT fk_money_contributions_stokvel
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing seed/legacy contribution rows did not carry a Stokvel ID.
-- Recover that relationship from the member name before the wallet is seeded.
UPDATE money_contributions mc
INNER JOIN stokvel_members sm ON sm.user_id=(SELECT u.user_id FROM users u WHERE u.full_name=mc.member_name LIMIT 1)
SET mc.stokvel_id=sm.stokvel_id
WHERE mc.stokvel_id IS NULL;

CREATE TABLE IF NOT EXISTS stokvel_goals (
  goal_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  deadline DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_stokvel_goal (stokvel_id),
  FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_product_votes (
  vote_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member_product_vote (stokvel_id,user_id,product_id),
  FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
);
