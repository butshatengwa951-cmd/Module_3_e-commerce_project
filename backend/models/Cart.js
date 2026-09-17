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

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      throw new Error("Quantity must be a positive whole number");
    }

    // Keep the Stokvel row locked during pending-cart creation so two members
    // cannot create competing pending shared orders at the same time.
    await db.query(
      `SELECT stokvel_id FROM stokvels WHERE stokvel_id = ? FOR UPDATE`,
      [stokvelId],
    );

    const selectedSupplierId = supplierPriceId ? Number(supplierPriceId) : null;

    // Fetch the product and all supplier prices in one round-trip. The
    // catalogue can then choose the cheapest supplier that can fulfil the
    // requested quantity, while an explicitly selected supplier remains exact.
    const [products] = await db.query(
      `
        SELECT
          p.product_id,
          p.quantity_available,
          p.product_name,
          p.image_url,
          sp.supplier_price_id,
          sp.price,
          sp.supplier_name,
          sp.minimum_quantity
        FROM products p
        LEFT JOIN supplier_prices sp
          ON sp.product_id = p.product_id
         AND (? IS NULL OR sp.supplier_price_id = ?)
        WHERE p.product_id = ?
        ORDER BY sp.price ASC
      `,
      [selectedSupplierId, selectedSupplierId, productId],
    );

    if (!products.length) {
      throw new Error("Product not found");
    }

    if (requestedQuantity > Number(products[0].quantity_available)) {
      throw new Error("Requested quantity exceeds available stock");
    }

    const candidate = selectedSupplierId
      ? products[0]
      : products.find((supplier) => supplier.supplier_price_id && requestedQuantity >= Number(supplier.minimum_quantity || 1));

    if (!candidate?.supplier_price_id) {
      if (selectedSupplierId) {
        throw new Error("Selected supplier price is not valid for this product");
      }

      throw new Error("No supplier price is available for the requested quantity");
    }

    const minimumQuantity = Number(candidate.minimum_quantity || 1);

    if (requestedQuantity < minimumQuantity) {
      throw new Error(`Minimum quantity for ${candidate.supplier_name} is ${minimumQuantity}`);
    }

    const selectedSupplierPriceId = candidate.supplier_price_id;
    const unitPrice = Number(candidate.price);
    const supplierName = candidate.supplier_name;

    // Get the latest pending order and the matching cart item together.
    const [pendingRows] = await db.query(
      `
        SELECT
          od.order_id,
          od.total_amount,
          oi.order_item_id,
          oi.quantity,
          oi.subtotal
        FROM order_details od
        LEFT JOIN order_items oi
          ON oi.order_id = od.order_id
         AND oi.product_id = ?
         AND oi.supplier_price_id = ?
        WHERE od.stokvel_id = ?
          AND od.order_status = 'Pending'
        ORDER BY od.order_id DESC
        LIMIT 1
      `,
      [productId, selectedSupplierPriceId, stokvelId],
    );

    let orderId = pendingRows[0]?.order_id;
    let currentOrderTotal = Number(pendingRows[0]?.total_amount || 0);
    const existingItem = pendingRows[0]?.order_item_id
      ? pendingRows[0]
      : null;

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
      currentOrderTotal = 0;
    }

    let orderItemId;
    let finalQuantity;
    let finalSubtotal;
    let totalDelta;

    if (existingItem) {
      finalQuantity = Number(existingItem.quantity) + requestedQuantity;

      if (finalQuantity > Number(candidate.quantity_available)) {
        throw new Error("Requested quantity exceeds available stock");
      }

      if (finalQuantity < minimumQuantity) {
        throw new Error(`Minimum quantity for ${supplierName} is ${minimumQuantity}`);
      }

      finalSubtotal = Number((unitPrice * finalQuantity).toFixed(2));
      totalDelta = Number((finalSubtotal - Number(existingItem.subtotal)).toFixed(2));

      await db.query(
        `
          UPDATE order_items
          SET quantity = ?, unit_price = ?, subtotal = ?
          WHERE order_item_id = ?
        `,
        [finalQuantity, unitPrice, finalSubtotal, existingItem.order_item_id],
      );

      orderItemId = existingItem.order_item_id;
    } else {
      finalQuantity = requestedQuantity;
      finalSubtotal = Number((unitPrice * finalQuantity).toFixed(2));
      totalDelta = finalSubtotal;

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
          finalSubtotal,
        ],
      );

      orderItemId = createdItem.insertId;
    }

    // Update the order total by the exact change introduced by this operation.
    // This removes the extra SUM(subtotal) round-trip while preserving the same total.
    const finalOrderTotal = Number((currentOrderTotal + totalDelta).toFixed(2));

    await db.query(
      `
        UPDATE order_details
        SET total_amount = ?
        WHERE order_id = ?
      `,
      [finalOrderTotal, orderId],
    );

    await db.commit();

    return {
      item: {
        order_item_id: orderItemId,
        order_id: orderId,
        product_id: productId,
        supplier_price_id: selectedSupplierPriceId,
        quantity: finalQuantity,
        unit_price: unitPrice,
        subtotal: finalSubtotal,
        product_name: candidate.product_name,
        image_url: candidate.image_url,
        supplier_name: supplierName,
        total_amount: finalOrderTotal,
      },
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
