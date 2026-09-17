import pool from "../config/db.js";

export const createProposalFromCurrentCart = async ({ userId, title, description, delivery_address }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [memberships] = await connection.query(
      `SELECT sm.stokvel_id,s.stokvel_name FROM stokvel_members sm INNER JOIN stokvels s ON s.stokvel_id=sm.stokvel_id WHERE sm.user_id=? LIMIT 1`,
      [userId]
    );
    if (!memberships.length) throw Object.assign(new Error("You are not a member of a Stokvel."), { statusCode: 403 });
    const stokvelId = memberships[0].stokvel_id;

    const [rows] = await connection.query(
      `SELECT od.order_id,oi.product_id,oi.supplier_price_id,oi.quantity,oi.unit_price,oi.subtotal
       FROM order_details od
       INNER JOIN order_items oi ON oi.order_id=od.order_id
       WHERE od.stokvel_id=? AND od.order_status='Pending'
       ORDER BY od.order_id DESC,oi.order_item_id ASC`,
      [stokvelId]
    );
    if (!rows.length) throw Object.assign(new Error("Your group basket is empty."), { statusCode: 400 });

    const orderIds = [...new Set(rows.map((row) => row.order_id))];
    if (orderIds.length > 1) throw Object.assign(new Error("The group currently has multiple pending baskets. Clear the older basket before creating a proposal."), { statusCode: 409 });

    const total = rows.reduce((sum, row) => sum + Number(row.subtotal), 0);
    const [proposal] = await connection.query(
      `INSERT INTO stokvel_purchase_proposals
       (stokvel_id,created_by,title,description,delivery_address,status,voting_deadline)
       VALUES (?,?,?,?,?,'VOTING',DATE_ADD(NOW(),INTERVAL 48 HOUR))`,
      [stokvelId,userId,title?.trim() || `${memberships[0].stokvel_name} group purchase`,description?.trim() || null,delivery_address?.trim() || null]
    );

    for (const row of rows) {
      await connection.query(
        `INSERT INTO stokvel_purchase_proposal_items
         (proposal_id,product_id,supplier_price_id,quantity,unit_price,subtotal)
         VALUES (?,?,?,?,?,?)`,
        [proposal.insertId,row.product_id,row.supplier_price_id,row.quantity,row.unit_price,row.subtotal]
      );
    }

    await connection.query(`UPDATE order_details SET order_status='Cancelled' WHERE order_id=?`, [orderIds[0]]);
    await connection.commit();
    return { proposal_id: proposal.insertId, total, status: "VOTING" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
