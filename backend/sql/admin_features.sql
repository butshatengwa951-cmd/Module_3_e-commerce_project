USE StockWell;
CREATE TABLE IF NOT EXISTS admin_audit_log (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT NOT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id INT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_audit_created (created_at),
  INDEX idx_admin_audit_admin (admin_user_id),
  FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
