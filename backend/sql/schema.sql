CREATE DATABASE IF NOT EXISTS  StockWell;
USE StockWell;

SET FOREIGN_KEY_CHECKS = 0;
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

-- =========================================================
-- 1. USERS 
-- =========================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role ENUM('member', 'chairperson', 'admin') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 2. PRODUCTS 
-- =========================================================
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    image_url VARCHAR(255),
    quantity_available INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 3. CARD DETAILS 
-- =========================================================
CREATE TABLE card_details (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    card_type VARCHAR(50),
    last_four_digits VARCHAR(4),
    voucher_number VARCHAR(50),
    expiry_date DATE,
    available_amount DECIMAL(10,2) DEFAULT 0.00
);

-- =========================================================
-- 4. DELIVERY DETAILS 
-- =========================================================
CREATE TABLE delivery_details (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_address VARCHAR(255) NOT NULL,
    transport_type VARCHAR(100) NOT NULL,
    driver_name VARCHAR(100),
    driver_contact VARCHAR(20),
    delivery_date DATE,
    delivery_status ENUM('Pending','In Transit','Delivered','Cancelled') DEFAULT 'Pending'
);

-- =========================================================
-- 5. STOKVELS 
-- =========================================================
CREATE TABLE stokvels (
    stokvel_id INT AUTO_INCREMENT PRIMARY KEY,
    stokvel_name VARCHAR(100) NOT NULL,
    description TEXT,
    chairperson_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chairperson_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =========================================================
-- 6. SUPPLIER_PRICES 
-- =========================================================
CREATE TABLE supplier_prices (
    supplier_price_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    minimum_quantity INT NOT NULL DEFAULT 10,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_product_supplier (product_id, supplier_name)
);

-- =========================================================
-- 7. STOKVEL_MEMBERS 
-- =========================================================
CREATE TABLE stokvel_members (
    stokvel_member_id INT AUTO_INCREMENT PRIMARY KEY,
    stokvel_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stokvel_id) REFERENCES stokvels(stokvel_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (stokvel_id, user_id)
);

-- =========================================================
-- 8. MONEY_CONTRIBUTIONS 
-- =========================================================
CREATE TABLE money_contributions (
    contribution_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    contribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('Pending','Paid','Failed') DEFAULT 'Pending',
    FOREIGN KEY (card_id) REFERENCES card_details(card_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================================================
-- 9. ORDER_DETAILS
-- =========================================================
CREATE TABLE order_details (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT,
    delivery_id INT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('Pending','Confirmed','Processing','Completed','Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (card_id) REFERENCES card_details(card_id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (delivery_id) REFERENCES delivery_details(delivery_id) ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO users (full_name, email, password, phone_number, role) VALUES
('Nosipho Makeleni', 'nosipho@gmail.com', 'password123', '0612345678', 'chairperson'),
('Thabisa Mkhonto', 'thabisa@gmail.com', 'password123', '0623456789', 'member'),
('Chantel Neil', 'chantel@gmail.com', 'password123', '0634567890', 'member'),
('Thandiwe Kunene', 'thandiwe@gmail.com', 'password123', '0654567832', 'member'),
('Lerato Booi', 'lerato@gmail.com', 'password123', '0764967890', 'member'),
('Sisonke Gidima', 'sisonke@gmail.com', 'password123', '0716707890', 'chairperson'),
('Jacob Williams', 'jacob@gmail.com', 'password123', '0830076789', 'member'),
('Delia April', 'delia@gmail.com', 'password123', '0781887890', 'member'),
('Nasiphi Siyibane', 'nasiphi@gmail.com', 'password123', '0795468791', 'member'),
('Nokukhanya Abrahams', 'nokukhanya@gmail.com', 'password123', '0874530978', 'member'),
('Bongiwe Ngudle', 'bongiwe@gmail.com', 'password123', '0748233898', 'chairperson'),
('Asiphe Mateke', 'asiphe@gmail.com', 'password123', '0757698095', 'member'),
('Nothozamile Khungani', 'nothozamile@gmail.com', 'password123', '0693452679', 'member'),
('Philani Sithole', 'philani@gmail.com', 'password123', '0739085679', 'member'),
('Limilise Fana', 'limilise@gmail.com', 'password123', '0656332765', 'member');

INSERT INTO stokvels (stokvel_name, description, chairperson_id) VALUES
('Khayelitsha Stokvel', 'Built on trust, strengthened by unity, and driven by a shared dream of creating a better future for every member and family.', 1),
('Delft Stokvel', 'We believe that no contribution is too small when we work together. Our shared savings create opportunities that benefit us all.', 6),
('Cape Town Stokvel', 'One group, one goal, one stronger future. Together we turn our collective resources into opportunities, savings, and security.', 11);

INSERT INTO stokvel_members (stokvel_id, user_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 6), (2, 7), (2, 8), (2, 9), (2, 10),
(3, 11), (3, 12), (3, 13), (3, 14), (3, 15);

INSERT INTO products (product_name, description, category, image_url, quantity_available) VALUES
('White Star Maize Meal 10kg', '10kg bag of White Star Super Maize Meal', 'Staples', 'images/white-star.jpg', 500),
('Tastic Rice 10kg', '10kg bag of Tastic long grain rice', 'Staples', 'images/tastic-rice.jpg', 400),
('Sunfoil Cooking Oil 2L', '2 litre bottle of Sunfoil cooking oil', 'Cooking Essentials', 'images/sunfoil-oil.jpg', 500),
('Iwisa Maize Meal 10kg', '10kg bag of Iwisa Super Maize Meal', 'Staples', 'images/iwisa.jpg', 400),
('All Gold Tomato Sauce 750ml', '750ml bottle of All Gold tomato sauce', 'Food', 'images/all-gold.jpg', 300),
('KOO Baked Beans 410g', '410g can of KOO baked beans', 'Canned Food', 'images/koo-beans.jpg', 600),
('Pakco Curry Powder 100g', '100g pack of Pakco curry powder', 'Spices', 'images/pakco-curry.jpg', 300),
('Ace Instant Porridge 1kg', '1kg pack of Ace instant porridge', 'Breakfast', 'images/ace-porridge.jpg', 400),
('Crosse & Blackwell Mayonnaise 750ml', '750ml bottle of mayonnaise', 'Food', 'images/mayonnaise.jpg', 300),
('Huletts White Sugar 2.5kg', '2.5kg bag of Huletts white sugar', 'Staples', 'images/huletts-sugar.jpg', 500),
('Ricoffy Coffee 750g', '750g jar of Ricoffy instant coffee', 'Beverages', 'images/ricoffy.jpg', 300),
('Kelloggs Corn Flakes 500g', '500g box of Kelloggs Corn Flakes', 'Breakfast', 'images/corn-flakes.jpg', 300);

INSERT INTO supplier_prices (product_id, supplier_name, price, minimum_quantity) VALUES
(1, 'Makro', 89.99, 10), (1, 'Boxer', 92.00, 10), (1, 'Local Wholesaler', 87.99, 10),
(2, 'Makro', 119.99, 10), (2, 'Boxer', 124.99, 10), (2, 'Local Wholesaler', 115.99, 10),
(3, 'Makro', 79.99, 10), (3, 'Boxer', 82.99, 10), (3, 'Local Wholesaler', 76.99, 10),
(4, 'Makro', 84.99, 10), (4, 'Boxer', 87.99, 10), (4, 'Local Wholesaler', 82.99, 10),
(5, 'Makro', 39.99, 10), (5, 'Boxer', 42.99, 10), (5, 'Local Wholesaler', 37.99, 10),
(6, 'Makro', 18.99, 10), (6, 'Boxer', 20.99, 10), (6, 'Local Wholesaler', 17.99, 10),
(7, 'Makro', 29.99, 10), (7, 'Boxer', 31.99, 10), (7, 'Local Wholesaler', 27.99, 10),
(8, 'Makro', 34.99, 10), (8, 'Boxer', 36.99, 10), (8, 'Local Wholesaler', 32.99, 10),
(9, 'Makro', 49.99, 10), (9, 'Boxer', 52.99, 10), (9, 'Local Wholesaler', 47.99, 10),
(10, 'Makro', 49.99, 10), (10, 'Boxer', 52.99, 10), (10, 'Local Wholesaler', 47.99, 10),
(11, 'Makro', 89.99, 10), (11, 'Boxer', 94.99, 10), (11, 'Local Wholesaler', 86.99, 10),
(12, 'Makro', 54.99, 10), (12, 'Boxer', 57.99, 10), (12, 'Local Wholesaler', 51.99, 10);

INSERT INTO card_details (card_type, last_four_digits, voucher_number, expiry_date, available_amount) VALUES
('Visa', '4521', 'VCH-2025-1001', '2027-12-31', 2500.00),
('Mastercard', '7845', 'VCH-2025-1002', '2028-06-30', 1200.50),
('Gift Card', '9012', 'VCH-2025-1003', '2025-12-31', 500.00),
('Store Voucher', '3346', 'VCH-2025-1004', '2026-03-15', 750.75),
('Visa', '1290', 'VCH-2025-1005', '2028-01-20', 3200.00);

INSERT INTO delivery_details (delivery_address, transport_type, driver_name, driver_contact, delivery_date, delivery_status) VALUES
('45 Main Road, Cape Town, 2000', 'Van', 'Kagiso Peters', '0821234567', '2025-08-25', 'Pending'),
('12 Oak Avenue, Dunoon, 0002', 'Truck', 'Mandla Zulu', '0839876543', '2025-08-26', 'In Transit'),
('88 Long Street, Cape Town, 4001', 'Van', 'Fatima Khan', '0724567890', '2025-08-24', 'Delivered'),
('101 Beach Road, Delft, 6001', 'Van', 'John Doe', '0791122334', '2025-08-28', 'Pending'),
('7 Industrial Park, khayelitsha, 9301', 'Truck', 'Peter van Wyk', '0815566778', '2025-08-27', 'Cancelled');

INSERT INTO money_contributions (card_id, member_name, amount, contribution_date, payment_status) VALUES
(1, 'Nosipho Makeleni', 500.00, '2025-08-15 10:30:00', 'Paid'),
(1, 'Thabisa Mkhonto', 300.00, '2025-08-16 14:20:00', 'Paid'),
(1, 'Chantel Neil', 400.00, '2025-08-17 09:15:00', 'Paid'),
(1, 'Thandiwe Kunene', 200.50, '2025-08-18 11:00:00', 'Pending'),
(1, 'Lerato Booi', 150.00, '2025-08-19 16:45:00', 'Failed'),
(2, 'Sisonke Gidima', 350.00, '2025-08-20 08:30:00', 'Paid'),
(2, 'Jacob Williams', 250.75, '2025-08-21 13:10:00', 'Paid'),
(2, 'Delia April', 1000.00, '2025-08-22 10:00:00', 'Paid'),
(2, 'Nasiphi Siyibane', 800.00, '2025-08-23 15:25:00', 'Paid'),
(2, 'Nokukhanya Abrahams', 450.00, '2025-08-24 12:05:00', 'Pending'),
(3, 'Bongiwe Ngudle', 900.00, '2025-08-24 11:16:00', 'Paid'),
(3, 'Asiphe Mateke', 250.00, '2025-08-24 10:09:00', 'Pending'),
(3, 'Nothozamile Khungani', 800.00, '2025-08-25 17:50:00', 'Paid'),
(3, 'Philani Sithole', 650.00, '2025-08-25 14:32:00', 'Failed'),
(3, 'Limilise Fana', 400.00, '2025-08-26 12:45:00', 'Paid');

INSERT INTO order_details (card_id, delivery_id, order_date, total_amount, order_status) VALUES
(1, 1, '2025-08-25 09:00:00', 1200.00, 'Confirmed'),
(2, 2, '2025-08-26 10:30:00', 850.50, 'Pending'),
(3, 3, '2025-08-24 14:00:00', 450.00, 'Completed'),
(1, 4, '2025-08-28 11:15:00', 600.00, 'Pending'),
(3, 1, '2025-08-29 08:45:00', 2200.00, 'Confirmed'),
(2, 5, '2025-08-27 16:00:00', 750.75, 'Cancelled'),
(2, NULL, '2025-08-26 12:00:00', 300.00, 'Pending'),
(1, 2, '2025-08-30 09:30:00', 1500.00, 'Pending');