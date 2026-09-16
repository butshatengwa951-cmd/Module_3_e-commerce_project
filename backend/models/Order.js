import pool from "../config/db.js";

export const getPendingOrderForStokvel = async (stokvelId) => {
  const [orders] = await pool.query(
    `
      SELECT
        od.order_id,
        od.user_id,
        od.stokvel_id,
        od.card_id,
        od.delivery_id,
        od.order_date,
        od.total_amount,
        od.order_status,
        s.stokvel_name
      FROM order_details od
      INNER JOIN stokvels s ON s.stokvel_id = od.stokvel_id
      WHERE od.stokvel_id = ?
        AND od.order_status = 'Pending'
      ORDER BY od.order_id DESC
      LIMIT 1
    `,
    [stokvelId],
  );

  if (!orders.length) {
    return null;
  }

  const order = orders[0];

  const [items] = await pool.query(
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
        sp.supplier_name
      FROM order_items oi
      INNER JOIN products p ON p.product_id = oi.product_id
      INNER JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id ASC
    `,
    [order.order_id],
  );

  return { order, items };
};

export const confirmPendingOrder = async (stokvelId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      `
        SELECT
          od.order_id,
          od.user_id,
          od.stokvel_id,
          od.card_id,
          od.delivery_id,
          od.order_date,
          od.total_amount,
          od.order_status
        FROM order_details od
        WHERE od.stokvel_id = ?
          AND od.order_status = 'Pending'
        ORDER BY od.order_id DESC
        LIMIT 1
        FOR UPDATE
      `,
      [stokvelId],
    );

    if (!orders.length) {
      const error = new Error("No pending order was found for this Stokvel.");
      error.statusCode = 404;
      throw error;
    }

    const order = orders[0];

    const [items] = await connection.query(
      `
        SELECT order_item_id
        FROM order_items
        WHERE order_id = ?
        LIMIT 1
      `,
      [order.order_id],
    );

    if (!items.length) {
      const error = new Error("The pending order has no items.");
      error.statusCode = 400;
      throw error;
    }

    await connection.query(
      `
        UPDATE order_details
        SET order_status = 'Confirmed'
        WHERE order_id = ?
          AND order_status = 'Pending'
      `,
      [order.order_id],
    );

    await connection.commit();

    return {
      ...order,
      order_status: "Confirmed",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
