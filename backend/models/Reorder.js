import pool from "../config/db.js";

export const reorderPreviousOrder = async ({ userId, orderId }) => {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [membership] = await db.query(
      `SELECT stokvel_id FROM stokvel_members WHERE user_id = ? LIMIT 1 FOR UPDATE`,
      [userId],
    );
    if (!membership.length) {
      const error = new Error("You are not a member of a Stokvel.");
      error.statusCode = 403;
      throw error;
    }
    const stokvelId = membership[0].stokvel_id;
    const [orders] = await db.query(
      `SELECT order_id, order_status FROM order_details
       WHERE order_id = ? AND stokvel_id = ? AND order_status <> 'Pending'
       LIMIT 1`,
      [orderId, stokvelId],
    );
    if (!orders.length) {
      const error = new Error("Order not found for your Stokvel.");
      error.statusCode = 404;
      throw error;
    }

    const [items] = await db.query(
      `SELECT oi.product_id, oi.supplier_price_id, oi.quantity,
              p.product_name, p.quantity_available,
              sp.price, sp.supplier_name, sp.minimum_quantity
       FROM order_items oi
       INNER JOIN products p ON p.product_id = oi.product_id
       INNER JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id
       WHERE oi.order_id = ? ORDER BY oi.order_item_id ASC`,
      [orderId],
    );
    if (!items.length) {
      const error = new Error("That order has no items to reorder.");
      error.statusCode = 400;
      throw error;
    }

    const [pending] = await db.query(
      `SELECT order_id, total_amount FROM order_details
       WHERE stokvel_id = ? AND order_status = 'Pending'
       ORDER BY order_id DESC LIMIT 1 FOR UPDATE`,
      [stokvelId],
    );
    let pendingOrderId = pending[0]?.order_id;
    let total = Number(pending[0]?.total_amount || 0);
    if (!pendingOrderId) {
      const [created] = await db.query(
        `INSERT INTO order_details (user_id, stokvel_id, card_id, delivery_id, total_amount, order_status)
         VALUES (?, ?, NULL, NULL, 0.00, 'Pending')`,
        [userId, stokvelId],
      );
      pendingOrderId = created.insertId;
    }

    const added = [];
    for (const item of items) {
      const stock = Number(item.quantity_available || 0);
      const minimum = Number(item.minimum_quantity || 1);
      const requested = Number(item.quantity || 0);
      const quantity = Math.min(requested, stock);
      if (quantity < minimum || quantity < 1) continue;

      const [existing] = await db.query(
        `SELECT order_item_id, quantity FROM order_items
         WHERE order_id = ? AND product_id = ? AND supplier_price_id = ? LIMIT 1`,
        [pendingOrderId, item.product_id, item.supplier_price_id],
      );
      const finalQuantity = Math.min(quantity + Number(existing[0]?.quantity || 0), stock);
      if (finalQuantity < minimum) continue;
      const subtotal = Number((Number(item.price) * finalQuantity).toFixed(2));

      if (existing.length) {
        const oldSubtotalRows = await db.query(`SELECT subtotal FROM order_items WHERE order_item_id = ?`, [existing[0].order_item_id]);
        const oldSubtotal = Number(oldSubtotalRows[0][0]?.subtotal || 0);
        await db.query(`UPDATE order_items SET quantity = ?, unit_price = ?, subtotal = ? WHERE order_item_id = ?`, [finalQuantity, item.price, subtotal, existing[0].order_item_id]);
        total += subtotal - oldSubtotal;
      } else {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, supplier_price_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pendingOrderId, item.product_id, item.supplier_price_id, finalQuantity, item.price, subtotal],
        );
        total += subtotal;
      }
      added.push({ product_id: item.product_id, product_name: item.product_name, quantity: finalQuantity, supplier_name: item.supplier_name, subtotal });
    }

    if (!added.length) {
      const error = new Error("None of the previous order items currently meet stock and supplier minimum requirements.");
      error.statusCode = 400;
      throw error;
    }
    await db.query(`UPDATE order_details SET total_amount = ? WHERE order_id = ?`, [Number(total.toFixed(2)), pendingOrderId]);
    await db.commit();
    return { order_id: pendingOrderId, total_amount: Number(total.toFixed(2)), items: added };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
};
