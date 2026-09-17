import pool from "../config/db.js";

export const getPaymentOptionsForUser = async (userId) => {
  const [orders] = await pool.query(
    `
      SELECT od.order_id, od.stokvel_id, od.total_amount, od.order_status, od.order_date
      FROM order_details od
      INNER JOIN stokvel_members sm ON sm.stokvel_id = od.stokvel_id AND sm.user_id = ?
      WHERE od.order_status = 'Confirmed'
      ORDER BY od.order_id DESC LIMIT 1
    `,
    [userId],
  );
  if (!orders.length) return null;
  const [cards] = await pool.query(
    `SELECT card_id, card_type, last_four_digits, available_amount FROM card_details WHERE expiry_date IS NULL OR expiry_date >= CURDATE() ORDER BY card_id ASC`,
  );
  return { order: orders[0], cards };
};

export const payCurrentOrder = async ({ userId, cardId, deliveryAddress }) => {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [orders] = await db.query(
      `
        SELECT od.order_id, od.user_id, od.stokvel_id, od.total_amount, od.order_status
        FROM order_details od
        INNER JOIN stokvel_members sm ON sm.stokvel_id = od.stokvel_id AND sm.user_id = ?
        WHERE od.order_status = 'Confirmed'
        ORDER BY od.order_id DESC LIMIT 1 FOR UPDATE
      `,
      [userId],
    );
    if (!orders.length) { const error = new Error("No confirmed order is ready for payment."); error.statusCode = 404; throw error; }
    const order = orders[0];
    const [cards] = await db.query(`SELECT card_id, card_type, last_four_digits, available_amount FROM card_details WHERE card_id = ? LIMIT 1 FOR UPDATE`, [cardId]);
    if (!cards.length) { const error = new Error("Payment card not found."); error.statusCode = 400; throw error; }
    const card = cards[0];
    const amount = Number(order.total_amount);
    if (Number(card.available_amount) < amount) { const error = new Error(`Insufficient available funds. Available amount: R ${Number(card.available_amount).toFixed(2)}`); error.statusCode = 400; throw error; }
    const address = String(deliveryAddress || "").trim();
    if (!address) { const error = new Error("Delivery address is required before payment."); error.statusCode = 400; throw error; }
    const [users] = await db.query(`SELECT full_name FROM users WHERE user_id = ? LIMIT 1`, [userId]);
    const memberName = users[0]?.full_name || "StockWell Member";
    await db.query(`UPDATE card_details SET available_amount = available_amount - ? WHERE card_id = ?`, [amount, cardId]);
    await db.query(`INSERT INTO money_contributions (card_id, stokvel_id, member_name, amount, payment_status) VALUES (?, ?, ?, ?, 'Paid')`, [cardId, order.stokvel_id, memberName, amount]);
    const [delivery] = await db.query(`INSERT INTO delivery_details (delivery_address, transport_type, delivery_status) VALUES (?, 'Van', 'Pending')`, [address]);
    await db.query(`UPDATE order_details SET card_id = ?, delivery_id = ?, order_status = 'Processing' WHERE order_id = ? AND order_status = 'Confirmed'`, [cardId, delivery.insertId, order.order_id]);
    const [updatedOrder] = await db.query(`SELECT order_id, user_id, stokvel_id, card_id, delivery_id, order_date, total_amount, order_status FROM order_details WHERE order_id = ? LIMIT 1`, [order.order_id]);
    await db.commit();
    return { order: updatedOrder[0], delivery_id: delivery.insertId, card: { card_id: card.card_id, card_type: card.card_type, last_four_digits: card.last_four_digits, remaining_amount: Number(card.available_amount) - amount } };
  } catch (error) { await db.rollback(); throw error; } finally { db.release(); }
};
