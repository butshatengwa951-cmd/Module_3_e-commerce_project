USE StockWell;

CREATE TABLE IF NOT EXISTS suggestions (
    suggestion_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(150) NOT NULL,
    category ENUM('General','Products','Orders','Delivery','Stokvel','Website') NOT NULL DEFAULT 'General',
    message TEXT NOT NULL,
    status ENUM('Submitted','Under Review','Planned','Implemented','Declined') NOT NULL DEFAULT 'Submitted',
    admin_response TEXT NULL,
    reviewed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_suggestions_status (status),
    INDEX idx_suggestions_user (user_id),
    INDEX idx_suggestions_created (created_at)
);