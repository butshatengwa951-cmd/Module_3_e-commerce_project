import pool from "../config/db.js";

export const getMembershipByUserId = async (userId, db = pool) => {
  const [rows] = await db.query(
    `
      SELECT sm.stokvel_id, s.stokvel_name
      FROM stokvel_members sm
      INNER JOIN stokvels s ON s.stokvel_id = sm.stokvel_id
      WHERE sm.user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] || null;
};

export const getPendingCart = async (stokvelId) => {
  const [rows] = await pool.query(
    `
      SELECT
        od.order_id,
        od.stokvel_id,
        od.user_id,
        od.order_date,
        od.total_amount,
        od.order_status,
        oi.order_item_id,
        oi.product_id,
        oi.supplier_price_id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        p.product_name,
        p.image_url,
        sp.supplier_name
      FROM order_details od
      LEFT JOIN order_items oi ON oi.order_id = od.order_id
      LEFT JOIN products p ON p.product_id = oi.product_id
      LEFT JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id
      WHERE od.stokvel_id = ?
        AND od.order_status = 'Pending'
      ORDER BY od.order_id DESC, oi.order_item_id ASC
    `,
    [stokvelId],
  );

  if (!rows.length) {
    return { order: null, items: [] };
  }

  const first = rows[0];
  const items = rows
    .filter((row) => row.order_item_id !== null)
    .map((row) => ({
      order_item_id: row.order_item_id,
      order_id: row.order_id,
      product_id: row.product_id,
      supplier_price_id: row.supplier_price_id,
      product_name: row.product_name,
      image_url: row.image_url,
      supplier_name: row.supplier_name,
      quantity: row.quantity,
      unit_price: row.unit_price,
      subtotal: row.subtotal,
    }));

  return {
    order: {
      order_id: first.order_id,
      stokvel_id: first.stokvel_id,
      user_id: first.user_id,
      order_date: first.order_date,
      total_amount: first.total_amount,
      order_status: first.order_status,
    },
    items,
  };
};

export const addItemToGroupCart = async ({
  userId,
  stokvelId,
  productId,
  supplierPriceId,
  quantity = 1,
}) => {
  const db = await pool.getConnection();

  try {
    await db.beginTransaction();

    // Serialize cart creation for this Stokvel so two members do not
    // accidentally create two pending shared orders at the same time.
    await db.query(
      `SELECT stokvel_id FROM stokvels WHERE stokvel_id = ? FOR UPDATE`,
      [stokvelId],
    );

    const [products] = await db.query(
      `
        SELECT product_id, quantity_available
        FROM products
        WHERE product_id = ?
        LIMIT 1
      `,
      [productId],
    );

    if (!products.length) {
      throw new Error("Product not found");
    }

    let selectedSupplierPriceId = supplierPriceId || null;
    let unitPrice;
    let supplierName;

    if (selectedSupplierPriceId) {
      const [prices] = await db.query(
        `
          SELECT supplier_price_id, price, supplier_name
          FROM supplier_prices
          WHERE supplier_price_id = ?
            AND product_id = ?
          LIMIT 1
        `,
        [selectedSupplierPriceId, productId],
      );

      if (!prices.length) {
        throw new Error("Selected supplier price is not valid for this product");
      }

      unitPrice = Number(prices[0].price);
      supplierName = prices[0].supplier_name;
    } else {
      const [prices] = await db.query(
        `
          SELECT supplier_price_id, price, supplier_name
          FROM supplier_prices
          WHERE product_id = ?
          ORDER BY price ASC
          LIMIT 1
        `,
        [productId],
      );

      if (!prices.length) {
        throw new Error("No supplier price is available for this product");
      }

      selectedSupplierPriceId = prices[0].supplier_price_id;
      unitPrice = Number(prices[0].price);
      supplierName = prices[0].supplier_name;
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      throw new Error("Quantity must be a positive whole number");
    }

    if (requestedQuantity > Number(products[0].quantity_available)) {
      throw new Error("Requested quantity exceeds available stock");
    }

    const [pendingOrders] = await db.query(
      `
        SELECT order_id
        FROM order_details
        WHERE stokvel_id = ?
          AND order_status = 'Pending'
        ORDER BY order_id DESC
        LIMIT 1
      `,
      [stokvelId],
    );

    let orderId = pendingOrders[0]?.order_id;

    if (!orderId) {
      const [created] = await db.query(
        `
          INSERT INTO order_details
            (user_id, stokvel_id, card_id, delivery_id, total_amount, order_status)
          VALUES (?, ?, NULL, NULL, 0.00, 'Pending')
        `,
        [userId, stokvelId],
      );

      orderId = created.insertId;
    }

    const [existingItems] = await db.query(
      `
        SELECT order_item_id, quantity
        FROM order_items
        WHERE order_id = ?
          AND product_id = ?
          AND supplier_price_id = ?
        LIMIT 1
      `,
      [orderId, productId, selectedSupplierPriceId],
    );

    let orderItemId;
    let finalQuantity;

    if (existingItems.length) {
      finalQuantity = Number(existingItems[0].quantity) + requestedQuantity;

      if (finalQuantity > Number(products[0].quantity_available)) {
        throw new Error("Requested quantity exceeds available stock");
      }

      const subtotal = Number((unitPrice * finalQuantity).toFixed(2));

      await db.query(
        `
          UPDATE order_items
          SET quantity = ?, unit_price = ?, subtotal = ?
          WHERE order_item_id = ?
        `,
        [finalQuantity, unitPrice, subtotal, existingItems[0].order_item_id],
      );

      orderItemId = existingItems[0].order_item_id;
    } else {
      finalQuantity = requestedQuantity;
      const subtotal = Number((unitPrice * finalQuantity).toFixed(2));

      const [createdItem] = await db.query(
        `
          INSERT INTO order_items
            (order_id, product_id, supplier_price_id, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          productId,
          selectedSupplierPriceId,
          finalQuantity,
          unitPrice,
          subtotal,
        ],
      );

      orderItemId = createdItem.insertId;
    }

    await db.query(
      `
        UPDATE order_details
        SET total_amount = (
          SELECT COALESCE(SUM(subtotal), 0)
          FROM order_items
          WHERE order_id = ?
        )
        WHERE order_id = ?
      `,
      [orderId, orderId],
    );

    const [updated] = await db.query(
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
        INNER JOIN products p ON p.product_id = oi.product_id
        INNER JOIN supplier_prices sp ON sp.supplier_price_id = oi.supplier_price_id
        INNER JOIN order_details od ON od.order_id = oi.order_id
        WHERE oi.order_item_id = ?
        LIMIT 1
      `,
      [orderItemId],
    );

    await db.commit();

    return {
      item: updated[0],
      supplier_name: supplierName,
    };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
};

export const updateCartItemQuantity = async (orderItemId, quantity) => {
  const requestedQuantity = Number(quantity);

  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw new Error("Quantity must be a positive whole number");
  }

  const [result] = await pool.query(
    `
      UPDATE order_items oi
      INNER JOIN order_details od ON od.order_id = oi.order_id
      SET oi.quantity = ?,
          oi.subtotal = ROUND(oi.unit_price * ?, 2),
          od.total_amount = (
            SELECT COALESCE(SUM(oi2.subtotal), 0)
            FROM order_items oi2
            WHERE oi2.order_id = oi.order_id
          )
      WHERE oi.order_item_id = ?
        AND od.order_status = 'Pending'
    `,
    [requestedQuantity, requestedQuantity, orderItemId],
  );

  if (!result.affectedRows) {
    throw new Error("Pending cart item not found");
  }

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

  return items[0];
};

export const removeCartItem = async (orderItemId) => {
  const [items] = await pool.query(
    `
      SELECT order_id
      FROM order_items
      WHERE order_item_id = ?
      LIMIT 1
    `,
    [orderItemId],
  );

  if (!items.length) {
    throw new Error("Cart item not found");
  }

  const orderId = items[0].order_id;

  const [result] = await pool.query(
    `
      DELETE oi
      FROM order_items oi
      INNER JOIN order_details od ON od.order_id = oi.order_id
      WHERE oi.order_item_id = ?
        AND od.order_status = 'Pending'
    `,
    [orderItemId],
  );

  if (!result.affectedRows) {
    throw new Error("Pending cart item not found");
  }

  await pool.query(
    `
      UPDATE order_details
      SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM order_items
        WHERE order_id = ?
      )
      WHERE order_id = ?
    `,
    [orderId, orderId],
  );

  const [remaining] = await pool.query(
    `SELECT COUNT(*) AS item_count FROM order_items WHERE order_id = ?`,
    [orderId],
  );

  if (Number(remaining[0].item_count) === 0) {
    await pool.query(
      `DELETE FROM order_details WHERE order_id = ? AND order_status = 'Pending'`,
      [orderId],
    );
  }

  return { orderId };
};
