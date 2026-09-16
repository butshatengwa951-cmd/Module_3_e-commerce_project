import pool from "../config/db.js";

export const updateCartItemQuantity = async (orderItemId, quantity) => {
  const requestedQuantity = Number(quantity);

  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw new Error("Quantity must be a positive whole number");
  }

  const db = await pool.getConnection();

  try {
    await db.beginTransaction();

    const [items] = await db.query(
      `
        SELECT
          oi.order_item_id,
          oi.order_id,
          oi.unit_price,
          od.order_status
        FROM order_items oi
        INNER JOIN order_details od ON od.order_id = oi.order_id
        WHERE oi.order_item_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [orderItemId],
    );

    if (!items.length || items[0].order_status !== "Pending") {
      throw new Error("Pending cart item not found");
    }

    const orderId = items[0].order_id;
    const unitPrice = Number(items[0].unit_price);
    const subtotal = Number((unitPrice * requestedQuantity).toFixed(2));

    await db.query(
      `
        UPDATE order_items
        SET quantity = ?,
            subtotal = ?
        WHERE order_item_id = ?
      `,
      [requestedQuantity, subtotal, orderItemId],
    );

    await db.query(
      `
        UPDATE order_details od
        SET od.total_amount = (
          SELECT COALESCE(SUM(oi.subtotal), 0)
          FROM order_items oi
          WHERE oi.order_id = od.order_id
        )
        WHERE od.order_id = ?
          AND od.order_status = 'Pending'
      `,
      [orderId],
    );

    const [updatedItems] = await db.query(
      `
        SELECT
          oi.order_item_id,
          oi.order_id,
          oi.product_id,
          oi.supplier_price_id,
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          p.product_name,
          p.image_url,
          sp.supplier_name,
          od.total_amount
        FROM order_items oi
        INNER JOIN order_details od ON od.order_id = oi.order_id
        INNER JOIN products p ON p.product_id = oi.product_id
        INNER JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id
        WHERE oi.order_item_id = ?
        LIMIT 1
      `,
      [orderItemId],
    );

    await db.commit();

    return updatedItems[0];
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
};
