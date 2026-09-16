import { pool } from "../config/db.js";

// view order items by order ID with product and supplier lookup details
export const getItemsByOrderId = async (order_id) => {
  const [rows] = await pool.query(
    `SELECT
      oi.order_item_id,
      oi.order_id,
      oi.product_id,
      oi.supplier_price_id,
      oi.quantity,
      oi.unit_price,
      oi.subtotal,
      p.product_name,
      sp.supplier_name
    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id
    WHERE oi.order_id = ?`,
    [order_id],
  );
  return rows;
};

export const getCartItemsByStokvelId = async (stokvel_id) => {
  const [rows] = await pool.query(
    `SELECT
      oi.order_item_id,
      oi.order_id,
      oi.product_id,
      oi.supplier_price_id,
      oi.quantity,
      oi.unit_price,
      oi.subtotal,
      p.product_name,
      sp.supplier_name,
      sp.price AS supplier_price
    FROM order_items oi
    JOIN order_details od ON od.order_id = oi.order_id
    JOIN supplier_prices sp ON oi.supplier_price_id = sp.supplier_price_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE od.stokvel_id = ?`,
    [stokvel_id],
  );

  return rows;
};

export const getOrCreatePendingCartByStokvelId = async (stokvel_id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [pendingOrders] = await connection.query(
      `SELECT od.order_id
       FROM order_details od
       JOIN order_items oi ON oi.order_id = od.order_id
       WHERE od.stokvel_id = ? AND od.order_status = 'Pending'
       GROUP BY od.order_id
       ORDER BY od.order_date DESC, od.order_id DESC
       LIMIT 1`,
      [stokvel_id],
    );

    let orderId = pendingOrders[0]?.order_id;

    if (!orderId) {
      const [sourceOrders] = await connection.query(
        `SELECT od.order_id, od.card_id, od.delivery_id,
                COALESCE(SUM(oi.subtotal), 0) AS total_amount
         FROM order_details od
         JOIN order_items oi ON oi.order_id = od.order_id
         GROUP BY od.order_id, od.card_id, od.delivery_id
         ORDER BY od.order_id DESC
         LIMIT 1`,
      );
      const sourceOrder = sourceOrders[0];

      if (!sourceOrder) {
        await connection.commit();
        return { orderId: null, items: [] };
      }

      const [newOrder] = await connection.query(
        `INSERT INTO order_details
          (card_id, delivery_id, total_amount, order_status, stokvel_id)
         VALUES (?, ?, ?, 'Pending', ?)`,
        [
          sourceOrder.card_id,
          sourceOrder.delivery_id,
          sourceOrder.total_amount,
          stokvel_id,
        ],
      );
      orderId = newOrder.insertId;

      await connection.query(
        `INSERT INTO order_items
          (order_id, product_id, supplier_price_id, quantity, unit_price, subtotal)
         SELECT ?, product_id, supplier_price_id, quantity, unit_price, subtotal
         FROM order_items
         WHERE order_id = ?`,
        [orderId, sourceOrder.order_id],
      );
    }

    const [items] = await connection.query(
      `SELECT
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.supplier_price_id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        p.product_name,
        sp.supplier_name,
        sp.price AS supplier_price
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      JOIN supplier_prices sp ON oi.supplier_price_id = sp.supplier_price_id
      WHERE oi.order_id = ?`,
      [orderId],
    );

    await connection.commit();
    return { orderId, items };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateOrderItemQuantity = async (order_item_id, quantity) => {
  const [current] = await pool.query(
    "SELECT order_id, unit_price FROM order_items WHERE order_item_id = ?",
    [order_item_id],
  );

  if (!current.length) {
    throw new Error("Order item not found");
  }

  const unit_price = Number(current[0].unit_price);
  const subtotal = Number(unit_price * quantity).toFixed(2);

  const [result] = await pool.query(
    "UPDATE order_items SET quantity = ?, subtotal = ? WHERE order_item_id = ?",
    [quantity, subtotal, order_item_id],
  );

  await pool.query(
    `UPDATE order_details
     SET total_amount = (
       SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?
     )
     WHERE order_id = ?`,
    [current[0].order_id, current[0].order_id],
  );

  return result;
};

export const deleteOrderItem = async (order_item_id) => {
  const [current] = await pool.query(
    "SELECT order_id FROM order_items WHERE order_item_id = ?",
    [order_item_id],
  );

  const [result] = await pool.query(
    "DELETE FROM order_items WHERE order_item_id = ?",
    [order_item_id],
  );

  if (current.length) {
    await pool.query(
      `UPDATE order_details
       SET total_amount = (
         SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?
       )
       WHERE order_id = ?`,
      [current[0].order_id, current[0].order_id],
    );
  }

  return result;
};
//Add to order items
export const postOrderItems = async ({
  order_id,
  product_id,
  supplier_price_id,
  item_name,
  quantity,
}) => {
  if (!product_id) {
    const [products] = await pool.query(
      "SELECT product_id FROM products WHERE product_name LIKE ? LIMIT 1",
      [`%${item_name}%`],
    );
    product_id = products[0]?.product_id;
  }

  if (!product_id) {
    throw new Error(`Product not found: ${item_name}`);
  }

  if (!supplier_price_id) {
    const [prices] = await pool.query(
      "SELECT supplier_price_id, price FROM supplier_prices WHERE product_id = ? ORDER BY price ASC LIMIT 1",
      [product_id],
    );
    supplier_price_id = prices[0]?.supplier_price_id;
  }

  const [prices] = await pool.query(
    "SELECT price FROM supplier_prices WHERE supplier_price_id = ? AND product_id = ?",
    [supplier_price_id, product_id],
  );
  const unit_price = prices[0]?.price;

  if (unit_price == null) {
    throw new Error("Supplier price not found for product");
  }

  const subtotal = Number(unit_price) * Number(quantity);
  const [rows] = await pool.query(
    "INSERT INTO order_items (order_id, product_id, supplier_price_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
    [order_id, product_id, supplier_price_id, quantity, unit_price, subtotal],
  );
  return rows;
};
