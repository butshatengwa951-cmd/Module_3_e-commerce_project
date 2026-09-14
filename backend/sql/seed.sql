USE StockWell;

-- Insert users
INSERT INTO users (full_name, email, password, phone_number, role)
VALUES
('Nosipho Makeleni', 'nosipho@gmail.com', 'password123', '0710000001', 'chairperson'),
('Thabisa Mkhonto', 'thabisa@gmail.com', 'password123', '0720000002', 'member'),
('Chantel Neil', 'chantel@gmail.com', 'password123', '0730000003', 'member'),
('Thandiwe Kunene', 'thandiwe@gmail.com', 'password123', '0740000004', 'member'),
('Lerato Booi', 'lerato@gmail.com', 'password123', '0750000005', 'member'),
('Sisonke Gidima', 'sisonke@gmail.com', 'password123', '0760000006', 'chairperson'),
('Jacob Williams', 'jacob@gmail.com', 'password123', '0780000007', 'member'),
('Delia April', 'delia@gmail.com', 'password123', '07000008', 'member'),
('Nasiphi Siyibane', 'nasiphi@gmail.com', 'password123', '0710000009', 'member'),
('Nokukhanya Abrahams', 'nokukhanya@gmail.com', 'password123', '0710000010', 'member'),
('Bongiwe Ngudle', 'bongiwe@gmail.com', 'password123', '0710000011', 'chairperson'),
('Asiphe Mateke', 'asiphe@gmail.com', 'password123', '0710000012', 'member'),
('Nothozamile Khungani', 'nothozamile@gmail.com', 'password123', '0710000013', 'member'),
('Philani Sithole', 'philani@gmail.com', 'password123', '0710000014', 'member'),
('Limilise Fana', 'limilise@gmail.com', 'password123', '0710000015', 'member');

-- Insert stokvels
INSERT INTO stokvels (stokvel_name, description, chairperson_id)
VALUES
('Khayelitsha Stokvel', 'Group 1 stokvel for collective grocery purchasing.', 1),
('Delft Stokvel', 'Group 2 stokvel for collective grocery purchasing.', 6),
('Cape Town Stokvel', 'Group 3 stokvel for collective grocery purchasing.', 11);

-- Insert stokvel members
INSERT INTO stokvel_members (stokvel_id, user_id)
VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(3, 11),
(3, 12),
(3, 13),
(3, 14),
(3, 15);

-- Insert products
INSERT INTO products (product_name, description, category, image_url, quantity_available)
VALUES
('White Star Maize Meal 10kg', '10kg bag of White Star Super Maize Meal', 'Staples', 'images/white-star.jpg', 500),
('Tastic Rice 10kg', '10kg bag of Tastic long grain rice', 'Staples', 'images/tastic-rice.jpg', 400),
('Sunfoil Cooking Oil 2L', '2 litre bottle of Sunfoil cooking oil', 'Cooking Essentials', 'images/sunfoil-oil.jpg', 500),
('Iwisa Maize Meal 10kg', '10kg bag of Iwisa Super Maize Meal', 'Staples', 'images/iwisa.jpg', 400),
('All Gold Tomato Sauce 750ml', '750ml bottle of All Gold tomato sauce', 'Food', 'images/all-gold.jpg', 300),
('Koo Baked Beans 410g', '410g can of KOO baked beans', 'Canned Food', 'images/koo-beans.jpg', 600),
('Pakco Curry Powder 100g', '100g pack of Pakco curry powder', 'Spices', 'images/pakco-curry.jpg', 300),
('Ace Instant Porridge 1kg', '1kg pack of Ace instant porridge', 'Breakfast', 'images/ace-porridge.jpg', 400),
('Crosse & Blackwell Mayonnaise 750ml', '750ml bottle of mayonnaise', 'Food', 'images/mayonnaise.jpg', 300),
('Huletts White Sugar 2.5kg', '2.5kg bag of Huletts white sugar', 'Staples', 'images/huletts-sugar.jpg', 500),
('Ricoffy Coffee 750g', '750g jar of Ricoffy instant coffee', 'Beverages', 'images/ricoffy.jpg', 300),
('Kelloggs Corn Flakes 500g', '500g box of Kelloggs Corn Flakes', 'Breakfast', 'images/corn-flakes.jpg', 300);

-- Insert supplier prices
INSERT INTO supplier_prices (product_id, supplier_name, price, minimum_quantity)
VALUES
(1, 'Makro', 89.99, 10),
(1, 'Boxer', 92.00, 10),
(1, 'Local Wholesaler', 87.99, 10),
(2, 'Makro', 119.99, 10),
(2, 'Boxer', 124.99, 10),
(2, 'Local Wholesaler', 115.99, 10),
(3, 'Makro', 79.99, 10),
(3, 'Boxer', 82.99, 10),
(3, 'Local Wholesaler', 76.99, 10),
(4, 'Makro', 84.99, 10),
(4, 'Boxer', 87.99, 10),
(4, 'Local Wholesaler', 82.99, 10),
(5, 'Makro', 39.99, 10),
(5, 'Boxer', 42.99, 10),
(5, 'Local Wholesaler', 37.99, 10),
(6, 'Makro', 18.99, 10),
(6, 'Boxer', 20.99, 10),
(6, 'Local Wholesaler', 17.99, 10),
(7, 'Makro', 29.99, 10),
(7, 'Boxer', 31.99, 10),
(7, 'Local Wholesaler', 27.99, 10),
(8, 'Makro', 34.99, 10),
(8, 'Boxer', 36.99, 10),
(8, 'Local Wholesaler', 32.99, 10),
(9, 'Makro', 49.99, 10),
(9, 'Boxer', 52.99, 10),
(9, 'Local Wholesaler', 47.99, 10),
(10, 'Makro', 49.99, 10),
(10, 'Boxer', 52.99, 10),
(10, 'Local Wholesaler', 47.99, 10),
(11, 'Makro', 89.99, 10),
(11, 'Boxer', 94.99, 10),
(11, 'Local Wholesaler', 86.99, 10),
(12, 'Makro', 54.99, 10),
(12, 'Boxer', 57.99, 10),
(12, 'Local Wholesaler', 51.99, 10);

-- Update phone numbers for nicer sample data
UPDATE users SET phone_number = '0612345678' WHERE user_id = 1;
UPDATE users SET phone_number = '0623456789' WHERE user_id = 2;
UPDATE users SET phone_number = '0634567890' WHERE user_id = 3;
UPDATE users SET phone_number = '0654567832' WHERE user_id = 4;
UPDATE users SET phone_number = '0764967890' WHERE user_id = 5;
UPDATE users SET phone_number = '0716707890' WHERE user_id = 6;
UPDATE users SET phone_number = '0830076789' WHERE user_id = 7;
UPDATE users SET phone_number = '0781887890' WHERE user_id = 8;
UPDATE users SET phone_number = '0795468791' WHERE user_id = 9;
UPDATE users SET phone_number = '0874530978' WHERE user_id = 10;
UPDATE users SET phone_number = '0748233898' WHERE user_id = 11;
UPDATE users SET phone_number = '0757698095' WHERE user_id = 12;
UPDATE users SET phone_number = '0693452679' WHERE user_id = 13;
UPDATE users SET phone_number = '0739085679' WHERE user_id = 14;
UPDATE users SET phone_number = '0656332765' WHERE user_id = 15;

-- Update stokvel descriptions
UPDATE stokvels
SET description = 'Built on trust, strengthened by unity, and driven by a shared dream of creating a better future for every member and family.'
WHERE stokvel_id = 1;

UPDATE stokvels
SET description = 'We believe that no contribution is too small when we work together. Our shared savings create opportunities that benefit us all.'
WHERE stokvel_id = 2;

UPDATE stokvels
SET description = 'One group, one goal, one stronger future. Together we turn our collective resources into opportunities, savings, and security.'
WHERE stokvel_id = 3;
