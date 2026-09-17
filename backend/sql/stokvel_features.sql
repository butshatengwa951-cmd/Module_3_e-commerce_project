USE StockWell;

ALTER TABLE money_contributions
  ADD COLUMN stokvel_id INT NULL AFTER card_id,
  ADD INDEX idx_money_contributions_stokvel (stokvel_id),
  ADD CONSTRAINT fk_money_contributions_stokvel
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS stokvel_goals (
  goal_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  deadline DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_stokvel_goal (stokvel_id),
  FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_product_votes (
  vote_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member_product_vote (stokvel_id, user_id, product_id),
  FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
