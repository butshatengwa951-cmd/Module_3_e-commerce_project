import pool from "../config/db.js";

export const getPendingOrderForStokvel = async (stokvelId) => {
  const [orders] = await pool.query(`SELECT od.order_id, od.user_id, od.stokvel_id, od.card_id, od.delivery_id, od.order_date, od.total_amount, od.order_status, s.stokvel_name FROM order_details od INNER JOIN stokvels s ON s.stokvel_id = od.stokvel_id WHERE od.stokvel_id = ? AND od.order_status = 'Pending' ORDER BY od.order_id DESC LIMIT 1`, [stokvelId]);
  if (!orders.length) return null;
  const order = orders[0];
  const [items] = await pool.query(`SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.supplier_price_id, oi.quantity, oi.unit_price, oi.subtotal, p.product_name, p.image_url, sp.supplier_name FROM order_items oi INNER JOIN products p ON p.product_id = oi.product_id INNER JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id WHERE oi.order_id = ? ORDER BY oi.order_item_id ASC`, [order.order_id]);
  return { order, items };
};

export const getOrderHistoryForStokvel = async (stokvelId) => {
  const [orders] = await pool.query(`SELECT od.order_id, od.user_id, od.stokvel_id, od.card_id, od.delivery_id, od.order_date, od.total_amount, od.order_status, cd.card_type, cd.last_four_digits, dd.delivery_status, COUNT(oi.order_item_id) AS item_count FROM order_details od LEFT JOIN card_details cd ON cd.card_id = od.card_id LEFT JOIN delivery_details dd ON dd.delivery_id = od.delivery_id LEFT JOIN order_items oi ON oi.order_id = od.order_id WHERE od.stokvel_id = ? AND od.order_status <> 'Pending' GROUP BY od.order_id, od.user_id, od.stokvel_id, od.card_id, od.delivery_id, od.order_date, od.total_amount, od.order_status, cd.card_type, cd.last_four_digits, dd.delivery_status ORDER BY od.order_date DESC, od.order_id DESC`, [stokvelId]);
  return orders.map((order) => ({ ...order, item_count: Number(order.item_count || 0) }));
};

export const getOrderDetailsForStokvel = async (orderId, stokvelId) => {
  const [orders] = await pool.query(`SELECT od.order_id, od.user_id, od.stokvel_id, od.card_id, od.delivery_id, od.order_date, od.total_amount, od.order_status, s.stokvel_name, cd.card_type, cd.last_four_digits, dd.delivery_address, dd.transport_type, dd.driver_name, dd.driver_contact, dd.delivery_date, dd.delivery_status FROM order_details od INNER JOIN stokvels s ON s.stokvel_id = od.stokvel_id LEFT JOIN card_details cd ON cd.card_id = od.card_id LEFT JOIN delivery_details dd ON dd.delivery_id = od.delivery_id WHERE od.order_id = ? AND od.stokvel_id = ? AND od.order_status <> 'Pending' LIMIT 1`, [orderId, stokvelId]);
  if (!orders.length) return null;
  const [items] = await pool.query(`SELECT oi.order_item_id, oi.product_id, oi.supplier_price_id, oi.quantity, oi.unit_price, oi.subtotal, p.product_name, p.image_url, sp.supplier_name FROM order_items oi INNER JOIN products p ON p.product_id = oi.product_id INNER JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id WHERE oi.order_id = ? ORDER BY oi.order_item_id ASC`, [orderId]);
  return { order: orders[0], items };
};

export const confirmPendingOrder = async (stokvelId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(`SELECT od.order_id, od.user_id, od.stokvel_id, od.card_id, od.delivery_id, od.order_date, od.total_amount, od.order_status FROM order_details od WHERE od.stokvel_id = ? AND od.order_status = 'Pending' ORDER BY od.order_id DESC LIMIT 1 FOR UPDATE`, [stokvelId]);
    if (!orders.length) { const error = new Error("No pending order was found for this Stokvel."); error.statusCode = 404; throw error; }
    const order = orders[0];
    const [items] = await connection.query(`SELECT order_item_id FROM order_items WHERE order_id = ? LIMIT 1`, [order.order_id]);
    if (!items.length) { const error = new Error("The pending order has no items."); error.statusCode = 400; throw error; }
    const [wallets] = await connection.query(`SELECT wallet_id, balance FROM stokvel_wallets WHERE stokvel_id = ? LIMIT 1 FOR UPDATE`, [stokvelId]);
    if (!wallets.length) { const error = new Error("The Stokvel wallet has not been set up yet. Run backend/sql/stokvel_wallet.sql first."); error.statusCode = 503; throw error; }
    const walletBalance = Number(wallets[0].balance);
    const orderTotal = Number(order.total_amount);
    if (walletBalance < orderTotal) { const error = new Error(`Insufficient group wallet funds. Available: R ${walletBalance.toFixed(2)}. Required: R ${orderTotal.toFixed(2)}.`); error.statusCode = 400; throw error; }
    await connection.query(`UPDATE stokvel_wallets SET balance = balance - ? WHERE wallet_id = ?`, [orderTotal, wallets[0].wallet_id]);
    await connection.query(`INSERT INTO stokvel_wallet_transactions (stokvel_id, user_id, transaction_type, amount, reference_id, description) VALUES (?, ?, 'PURCHASE', ?, ?, ?)`, [stokvelId, order.user_id, orderTotal, order.order_id, `Group purchase #${order.order_id}`]);
    await connection.query(`UPDATE order_details SET order_status = 'Processing' WHERE order_id = ? AND order_status = 'Pending'`, [order.order_id]);
    await connection.commit();
    return { ...order, order_status: "Processing", wallet_balance: Number((walletBalance - orderTotal).toFixed(2)) };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};
