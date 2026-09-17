USE StockWell;

-- Group purchase proposals: shopping requests are separate from authorised wallet spending.
CREATE TABLE IF NOT EXISTS stokvel_purchase_proposals (
  proposal_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_id INT NOT NULL,
  created_by INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  delivery_address VARCHAR(255) NULL,
  status ENUM('DRAFT','VOTING','APPROVED','REJECTED','AUTHORISED','ORDERED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  voting_deadline DATETIME NULL,
  approved_at DATETIME NULL,
  approved_by INT NULL,
  authorised_at DATETIME NULL,
  authorised_by INT NULL,
  order_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_proposals_stokvel_status (stokvel_id,status),
  CONSTRAINT fk_proposal_stokvel FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_approver FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_authoriser FOREIGN KEY (authorised_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_purchase_proposal_items (
  proposal_item_id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  product_id INT NOT NULL,
  supplier_price_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_proposal_product_supplier (proposal_id,product_id,supplier_price_id),
  CONSTRAINT fk_proposal_item_proposal FOREIGN KEY (proposal_id) REFERENCES stokvel_purchase_proposals(proposal_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_item_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_item_supplier FOREIGN KEY (supplier_price_id) REFERENCES supplier_prices(supplier_price_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_purchase_proposal_votes (
  proposal_vote_id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  user_id INT NOT NULL,
  vote ENUM('APPROVE','REJECT') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_proposal_member_vote (proposal_id,user_id),
  CONSTRAINT fk_proposal_vote_proposal FOREIGN KEY (proposal_id) REFERENCES stokvel_purchase_proposals(proposal_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_proposal_vote_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Stokvel-level roles are separate from platform users.role.
CREATE TABLE IF NOT EXISTS stokvel_member_roles (
  stokvel_member_id INT NOT NULL PRIMARY KEY,
  stokvel_role ENUM('MEMBER','CHAIRPERSON','TREASURER') NOT NULL DEFAULT 'MEMBER',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stokvel_member_role_membership FOREIGN KEY (stokvel_member_id) REFERENCES stokvel_members(stokvel_member_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed only missing role rows. This preserves a Treasurer/Chairperson assignment if the migration is rerun.
INSERT INTO stokvel_member_roles (stokvel_member_id,stokvel_role)
SELECT sm.stokvel_member_id,
       CASE WHEN sm.user_id=s.chairperson_id THEN 'CHAIRPERSON' ELSE 'MEMBER' END
FROM stokvel_members sm
INNER JOIN stokvels s ON s.stokvel_id=sm.stokvel_id
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
  INDEX idx_payfast_user (user_id),
  INDEX idx_payfast_stokvel (stokvel_id),
  INDEX idx_payfast_status (status),
  CONSTRAINT fk_payfast_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payfast_stokvel FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE
);
