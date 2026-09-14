-- StockWell database
CREATE DATABASE IF NOT EXISTS StockWell;
USE StockWell;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS order_details;
DROP TABLE IF EXISTS money_contributions;
DROP TABLE IF EXISTS stokvel_members;
DROP TABLE IF EXISTS supplier_prices;
DROP TABLE IF EXISTS stokvels;
DROP TABLE IF EXISTS delivery_details;
DROP TABLE IF EXISTS card_details;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role ENUM('member', 'chairperson', 'admin') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    image_url VARCHAR(255),
    quantity_available INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE card_details (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    card_type VARCHAR(50),
    last_four_digits VARCHAR(4),
    voucher_number VARCHAR(50),
    expiry_date DATE,
    available_amount DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE delivery_details (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_address VARCHAR(255) NOT NULL,
    transport_type VARCHAR(100) NOT NULL,
    driver_name VARCHAR(100),
    driver_contact VARCHAR(20),
    delivery_date DATE,
    delivery_status ENUM('Pending','In Transit','Delivered','Cancelled') DEFAULT 'Pending'
);

CREATE TABLE stokvels (
    stokvel_id INT AUTO_INCREMENT PRIMARY KEY,
    stokvel_name VARCHAR(100) NOT NULL,
    description TEXT,
    chairperson_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chairperson_id) REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE supplier_prices (
    supplier_price_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    minimum_quantity INT NOT NULL DEFAULT 10,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_product_supplier (product_id, supplier_name)
);

CREATE TABLE stokvel_members (
    stokvel_member_id INT AUTO_INCREMENT PRIMARY KEY,
    stokvel_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (stokvel_id, user_id)
);

CREATE TABLE money_contributions (
    contribution_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    contribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('Pending','Paid','Failed') DEFAULT 'Pending',
    FOREIGN KEY (card_id) REFERENCES card_details(card_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE order_details (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT,
    delivery_id INT,
    user_id INT,
    stokvel_id INT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('Pending','Confirmed','Processing','Completed','Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (card_id) REFERENCES card_details(card_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (delivery_id) REFERENCES delivery_details(delivery_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id)
);

CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    supplier_price_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES order_details(order_id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (supplier_price_id) REFERENCES supplier_prices(supplier_price_id)
        ON DELETE RESTRICT
);

