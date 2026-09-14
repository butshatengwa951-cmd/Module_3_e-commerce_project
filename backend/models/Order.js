import { pool } from "../config/db.js";

//Get order details
export const getOrder = async () => {
  let [rows, columns] = await pool.query("SELECT * FROM order_details");
  return rows;
};

//Get order by order ID
export const getOrderById = async (order_id) => {
  let [rows, columns] = await pool.query(
    "SELECT * FROM order_details WHERE order_id = ?",
    [order_id],
  );
  return rows;
};

//Add an order
export const postOrder = async (orderData) => {
  const {
    order_id,
    card_id,
    delivery_id,
    order_date,
    total_amount,
    order_status,
  } = orderData;
  // Convert ISO date format to MySQL DATE format (YYYY-MM-DD)
  const formattedDate = new Date(order_date).toISOString().split("T")[0];
  let [rows, columns] = await pool.query(
    "INSERT INTO order_details (order_id, card_id, delivery_id, order_date, total_amount, order_status) VALUES (?, ?, ?, ?, ?, ?)",
    [order_id, card_id, delivery_id, formattedDate, total_amount, order_status],
  );
  return rows;
};

//Update order status
export const updateOrder = async (order_id, order_status) => {
  let [rows, columns] = await pool.query(
    "UPDATE order_details SET order_status = ? WHERE order_id = ?",
    [order_status, order_id],
  );
  return rows;
};

//Update order status to Confirmed
export const updateOrderToConfirmed = async (order_id) => {
  let [rows, columns] = await pool.query(
    "UPDATE order_details SET order_status = 'Confirmed' WHERE order_id = ?",
    [order_id],
  );
  return rows;
};

//Update order status to Cancelled
export const updateOrderToCancelled = async (order_id) => {
  let [rows, columns] = await pool.query(
    "UPDATE order_details SET order_status = 'Cancelled' WHERE order_id = ?",
    [order_id],
  );
  return rows;
};
