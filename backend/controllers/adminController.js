import pool from "../config/db.js";

const sendError = (res, error, message = "Admin request failed.") => {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
};

export const getDashboard = async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE role = 'member') AS members,
        (SELECT COUNT(*) FROM users WHERE role = 'chairperson') AS chairpersons,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
        (SELECT COUNT(*) FROM stokvels) AS stokvels,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(DISTINCT supplier_name) FROM supplier_prices) AS suppliers,
        (SELECT COUNT(*) FROM order_details) AS orders,
        (SELECT COUNT(*) FROM order_details WHERE order_status IN ('Pending','Confirmed','Processing')) AS active_orders,
        (SELECT COUNT(*) FROM delivery_details WHERE delivery_status IN ('Pending','In Transit')) AS active_deliveries,
        (SELECT COALESCE(SUM(total_amount), 0) FROM order_details WHERE order_status <> 'Cancelled') AS revenue,
        (SELECT COUNT(*) FROM products WHERE quantity_available <= 10) AS low_stock
    `);

    return res.json({ success: true, stats });
  } catch (error) {
    return sendError(res, error, "Unable to load admin dashboard.");
  }
};

export const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT
        u.user_id, u.full_name, u.email, u.phone_number, u.role, u.created_at,
        GROUP_CONCAT(DISTINCT s.stokvel_name ORDER BY s.stokvel_name SEPARATOR ', ') AS stokvels
      FROM users u
      LEFT JOIN stokvel_members sm ON sm.user_id = u.user_id
      LEFT JOIN stokvels s ON s.stokvel_id = sm.stokvel_id
      GROUP BY u.user_id
      ORDER BY u.user_id DESC
    `);
    return res.json({ success: true, users });
  } catch (error) {
    return sendError(res, error, "Unable to load users.");
  }
};

export const getStokvels = async (req, res) => {
  try {
    const [stokvels] = await pool.query(`
      SELECT
        s.stokvel_id,
        s.stokvel_name,
        s.description,
        s.created_at,
        u.full_name AS chairperson_name,
        COUNT(sm.stokvel_member_id) AS member_count
      FROM stokvels s
      JOIN users u ON u.user_id = s.chairperson_id
      LEFT JOIN stokvel_members sm ON sm.stokvel_id = s.stokvel_id
      GROUP BY s.stokvel_id
      ORDER BY s.stokvel_id
    `);
    return res.json({ success: true, stokvels });
  } catch (error) {
    return sendError(res, error, "Unable to load Stokvels.");
  }
};

export const getProducts = async (req, res) => {
  try {
    const [products] = await pool.query(`SELECT * FROM products ORDER BY product_id DESC`);
    return res.json({ success: true, products });
  } catch (error) {
    return sendError(res, error, "Unable to load products.");
  }
};

export const createProduct = async (req, res) => {
  try {
    const { product_name, description = "", category = "", image_url = "", quantity_available = 0 } = req.body;
    if (!product_name?.trim()) {
      return res.status(400).json({ success: false, message: "Product name is required." });
    }
    const [result] = await pool.query(
      `INSERT INTO products (product_name, description, category, image_url, quantity_available) VALUES (?, ?, ?, ?, ?)`,
      [product_name.trim(), description, category, image_url, Math.max(0, Number(quantity_available) || 0)]
    );
    const [rows] = await pool.query(`SELECT * FROM products WHERE product_id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, product: rows[0] });
  } catch (error) {
    return sendError(res, error, "Unable to create product.");
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { product_name, description, category, image_url, quantity_available } = req.body;
    const [result] = await pool.query(
      `UPDATE products SET product_name = COALESCE(?, product_name), description = COALESCE(?, description), category = COALESCE(?, category), image_url = COALESCE(?, image_url), quantity_available = COALESCE(?, quantity_available) WHERE product_id = ?`,
      [product_name, description, category, image_url, quantity_available == null ? null : Math.max(0, Number(quantity_available) || 0), req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Product not found." });
    const [rows] = await pool.query(`SELECT * FROM products WHERE product_id = ?`, [req.params.id]);
    return res.json({ success: true, product: rows[0] });
  } catch (error) {
    return sendError(res, error, "Unable to update product.");
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM products WHERE product_id = ?`, [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Product not found." });
    return res.json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    return sendError(res, error, "Unable to delete product. It may already be referenced by an order.");
  }
};

export const getSupplierPrices = async (req, res) => {
  try {
    const [prices] = await pool.query(`
      SELECT sp.*, p.product_name
      FROM supplier_prices sp
      JOIN products p ON p.product_id = sp.product_id
      ORDER BY sp.supplier_price_id DESC
    `);
    return res.json({ success: true, supplierPrices: prices });
  } catch (error) {
    return sendError(res, error, "Unable to load supplier prices.");
  }
};

export const createSupplierPrice = async (req, res) => {
  try {
    const { product_id, supplier_name, price, minimum_quantity = 10 } = req.body;
    if (!product_id || !supplier_name || price == null) {
      return res.status(400).json({ success: false, message: "Product, supplier and price are required." });
    }
    const [result] = await pool.query(
      `INSERT INTO supplier_prices (product_id, supplier_name, price, minimum_quantity) VALUES (?, ?, ?, ?)`,
      [product_id, supplier_name.trim(), Number(price), Math.max(1, Number(minimum_quantity) || 10)]
    );
    const [rows] = await pool.query(`SELECT sp.*, p.product_name FROM supplier_prices sp JOIN products p ON p.product_id = sp.product_id WHERE sp.supplier_price_id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, supplierPrice: rows[0] });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ success: false, message: "That supplier already has a price for this product." });
    return sendError(res, error, "Unable to create supplier price.");
  }
};

export const updateSupplierPrice = async (req, res) => {
  try {
    const { supplier_name, price, minimum_quantity } = req.body;
    const [result] = await pool.query(
      `UPDATE supplier_prices SET supplier_name = COALESCE(?, supplier_name), price = COALESCE(?, price), minimum_quantity = COALESCE(?, minimum_quantity) WHERE supplier_price_id = ?`,
      [supplier_name, price == null ? null : Number(price), minimum_quantity == null ? null : Math.max(1, Number(minimum_quantity) || 1), req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Supplier price not found." });
    const [rows] = await pool.query(`SELECT sp.*, p.product_name FROM supplier_prices sp JOIN products p ON p.product_id = sp.product_id WHERE sp.supplier_price_id = ?`, [req.params.id]);
    return res.json({ success: true, supplierPrice: rows[0] });
  } catch (error) {
    return sendError(res, error, "Unable to update supplier price.");
  }
};

export const deleteSupplierPrice = async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM supplier_prices WHERE supplier_price_id = ?`, [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Supplier price not found." });
    return res.json({ success: true, message: "Supplier price deleted successfully." });
  } catch (error) {
    return sendError(res, error, "Unable to delete supplier price.");
  }
};

export const getOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        o.order_id, o.order_date, o.total_amount, o.order_status,
        u.full_name AS customer_name, u.email AS customer_email,
        s.stokvel_name,
        d.delivery_id, d.delivery_address, d.transport_type, d.driver_name, d.driver_contact, d.delivery_date, d.delivery_status
      FROM order_details o
      LEFT JOIN users u ON u.user_id = o.user_id
      LEFT JOIN stokvels s ON s.stokvel_id = o.stokvel_id
      LEFT JOIN delivery_details d ON d.delivery_id = o.delivery_id
      ORDER BY o.order_date DESC, o.order_id DESC
    `);
    return res.json({ success: true, orders });
  } catch (error) {
    return sendError(res, error, "Unable to load orders.");
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const allowed = ["Pending", "Confirmed", "Processing", "Completed", "Cancelled"];
    const { status } = req.body;
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid order status." });
    const [result] = await pool.query(`UPDATE order_details SET order_status = ? WHERE order_id = ?`, [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Order not found." });
    return res.json({ success: true, message: "Order status updated." });
  } catch (error) {
    return sendError(res, error, "Unable to update order status.");
  }
};

export const getDeliveries = async (req, res) => {
  try {
    const [deliveries] = await pool.query(`SELECT * FROM delivery_details ORDER BY delivery_id DESC`);
    return res.json({ success: true, deliveries });
  } catch (error) {
    return sendError(res, error, "Unable to load deliveries.");
  }
};

export const updateDelivery = async (req, res) => {
  try {
    const allowed = ["Pending", "In Transit", "Delivered", "Cancelled"];
    const { delivery_status, driver_name, driver_contact, transport_type, delivery_date, delivery_address } = req.body;
    if (delivery_status && !allowed.includes(delivery_status)) return res.status(400).json({ success: false, message: "Invalid delivery status." });
    const [result] = await pool.query(
      `UPDATE delivery_details SET delivery_status = COALESCE(?, delivery_status), driver_name = COALESCE(?, driver_name), driver_contact = COALESCE(?, driver_contact), transport_type = COALESCE(?, transport_type), delivery_date = COALESCE(?, delivery_date), delivery_address = COALESCE(?, delivery_address) WHERE delivery_id = ?`,
      [delivery_status || null, driver_name, driver_contact, transport_type, delivery_date || null, delivery_address, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Delivery not found." });
    return res.json({ success: true, message: "Delivery updated." });
  } catch (error) {
    return sendError(res, error, "Unable to update delivery.");
  }
};
