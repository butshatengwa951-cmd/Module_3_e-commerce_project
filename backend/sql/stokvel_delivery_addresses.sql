USE StockWell;

-- This migration is safe to run against an existing StockWell database.
-- It creates the proposal tables first because older databases may not have
-- run stokvel_governance_payfast.sql yet, then adds member addresses and
-- multi-delivery support.

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
  CONSTRAINT fk_delivery_proposal_stokvel FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_proposal_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_proposal_approver FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_proposal_authoriser FOREIGN KEY (authorised_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
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
  CONSTRAINT fk_delivery_proposal_item_proposal FOREIGN KEY (proposal_id) REFERENCES stokvel_purchase_proposals(proposal_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_proposal_item_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_proposal_item_supplier FOREIGN KEY (supplier_price_id) REFERENCES supplier_prices(supplier_price_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_purchase_proposal_votes (
  proposal_vote_id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  user_id INT NOT NULL,
  vote ENUM('APPROVE','REJECT') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_proposal_member_vote (proposal_id,user_id),
  CONSTRAINT fk_delivery_proposal_vote_proposal FOREIGN KEY (proposal_id) REFERENCES stokvel_purchase_proposals(proposal_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_proposal_vote_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS stokvel_member_addresses (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
  stokvel_member_id INT NOT NULL,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255) NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_member_addresses_member (stokvel_member_id),
  INDEX idx_member_addresses_default (stokvel_member_id,is_default),
  CONSTRAINT fk_member_address_membership FOREIGN KEY (stokvel_member_id)
    REFERENCES stokvel_members(stokvel_member_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add delivery mode only when the column is missing.
DROP PROCEDURE IF EXISTS sp_stockwell_delivery_migration;
DELIMITER $$
CREATE PROCEDURE sp_stockwell_delivery_migration()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'stokvel_purchase_proposals'
      AND COLUMN_NAME = 'delivery_mode'
  ) THEN
    ALTER TABLE stokvel_purchase_proposals
      ADD COLUMN delivery_mode ENUM('GROUP','INDIVIDUAL') NOT NULL DEFAULT 'GROUP' AFTER delivery_address;
  END IF;
END$$
DELIMITER ;
CALL sp_stockwell_delivery_migration();
DROP PROCEDURE IF EXISTS sp_stockwell_delivery_migration;

CREATE TABLE IF NOT EXISTS stokvel_purchase_proposal_allocations (
  allocation_id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  proposal_item_id INT NOT NULL,
  stokvel_member_id INT NOT NULL,
  address_id INT NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_proposal_item_member (proposal_item_id,stokvel_member_id),
  INDEX idx_allocations_proposal (proposal_id),
  INDEX idx_allocations_member (stokvel_member_id),
  CONSTRAINT fk_allocation_proposal FOREIGN KEY (proposal_id)
    REFERENCES stokvel_purchase_proposals(proposal_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_allocation_item FOREIGN KEY (proposal_item_id)
    REFERENCES stokvel_purchase_proposal_items(proposal_item_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_allocation_member FOREIGN KEY (stokvel_member_id)
    REFERENCES stokvel_members(stokvel_member_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_allocation_address FOREIGN KEY (address_id)
    REFERENCES stokvel_member_addresses(address_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS order_deliveries (
  order_delivery_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  delivery_id INT NOT NULL,
  stokvel_member_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_order_delivery_member (order_id,stokvel_member_id),
  INDEX idx_order_deliveries_order (order_id),
  INDEX idx_order_deliveries_delivery (delivery_id),
  CONSTRAINT fk_order_delivery_order FOREIGN KEY (order_id)
    REFERENCES order_details(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_delivery_delivery FOREIGN KEY (delivery_id)
    REFERENCES delivery_details(delivery_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_delivery_member FOREIGN KEY (stokvel_member_id)
    REFERENCES stokvel_members(stokvel_member_id) ON DELETE SET NULL ON UPDATE CASCADE
);
