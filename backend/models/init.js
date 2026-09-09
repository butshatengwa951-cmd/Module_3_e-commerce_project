const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function initDB() {
  try {
    const filePath = path.join(__dirname, "../sql/schema.sql");
    let sql = fs.readFileSync(filePath, "utf8");
    sql = sql.replace(/ /g, " ");
    sql = sql.replace(
      "CREATE TABLE order_items (",
      "CREATE TABLE IF NOT EXISTS order_items (",
    );

    try {
      await pool.query(sql);
    } catch (e) {
      if (!e.message.includes("already exists"))
        console.log(e.message.slice(0, 300));
    }
    console.log("✅ schema.sql loaded (fixed NBSP)");

    const extra = `
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      session_id VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cart_id INT NOT NULL,
      product_id INT NOT NULL,
      qty INT NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
      UNIQUE KEY uniq_cart_product (cart_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      tracking_number VARCHAR(50) NOT NULL UNIQUE,
      total_amount DECIMAL(10,2) NOT NULL,
      final_amount DECIMAL(10,2) NOT NULL,
      email VARCHAR(150) NOT NULL,
      member_name VARCHAR(150) NOT NULL,
      delivery_address TEXT NOT NULL,
      status ENUM('pending','paid','shipped','in_transit','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS order_items_ecom (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      qty INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      reference VARCHAR(100) NOT NULL UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      method ENUM('card','bank','voucher') DEFAULT 'card',
      status ENUM('pending','success','failed','abandoned') DEFAULT 'pending',
      card_last4 VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS deliveries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL UNIQUE,
      tracking_number VARCHAR(50) NOT NULL UNIQUE,
      courier VARCHAR(100) DEFAULT 'StockWell Express ZA',
      status ENUM('ordered','paid','shipped','in_transit','out_for_delivery','delivered') DEFAULT 'ordered',
      progress INT DEFAULT 0,
      estimated_text VARCHAR(100) DEFAULT 'Tomorrow by 18:00',
      delivery_address TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS delivery_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      delivery_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status_key VARCHAR(30) NOT NULL,
      tag VARCHAR(50),
      location VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
    );
    `;
    await pool.query(extra);
    console.log("✅ carts/cart_items/orders/deliveries ensured");
  } catch (e) {
    console.error("init error", e.message.slice(0, 500));
  }
}

module.exports = initDB;
