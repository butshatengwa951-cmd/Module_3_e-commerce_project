import pool from "../config/db.js";

export const getStokvelFeatures = async (userId) => {
  const [membershipRows] = await pool.query(`SELECT sm.stokvel_id, s.stokvel_name, s.description, u.role FROM stokvel_members sm INNER JOIN stokvels s ON s.stokvel_id = sm.stokvel_id INNER JOIN users u ON u.user_id = ? WHERE sm.user_id = ? LIMIT 1`, [userId, userId]);
  if (!membershipRows.length) return null;
  const membership = membershipRows[0];
  const [goals] = await pool.query(`SELECT goal_id, target_amount, deadline, created_at, updated_at FROM stokvel_goals WHERE stokvel_id = ? LIMIT 1`, [membership.stokvel_id]);
  const [cards] = await pool.query(`SELECT card_id, card_type, last_four_digits, available_amount FROM card_details WHERE expiry_date IS NULL OR expiry_date >= CURDATE() ORDER BY card_id ASC`);
  const [products] = await pool.query(`SELECT p.product_id, p.product_name, p.category, p.image_url, COALESCE(SUM(CASE WHEN sv.vote_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS vote_count, MAX(CASE WHEN sv.user_id = ? THEN 1 ELSE 0 END) AS user_voted FROM products p LEFT JOIN stokvel_product_votes sv ON sv.product_id = p.product_id AND sv.stokvel_id = ? GROUP BY p.product_id, p.product_name, p.category, p.image_url ORDER BY p.category ASC, vote_count DESC, p.product_name ASC`, [userId, membership.stokvel_id]);
  const [walletRows] = await pool.query(`SELECT balance FROM stokvel_wallets WHERE stokvel_id = ? LIMIT 1`, [membership.stokvel_id]);
  return { membership, goal: goals[0] || null, cards, wallet: { available_balance: Number(walletRows[0]?.balance || 0) }, votes: products.map((product) => ({ ...product, vote_count: Number(product.vote_count || 0), user_voted: Boolean(product.user_voted) })) };
};

export const contributeToStokvel = async ({ userId, cardId, amount }) => {
  const contributionAmount = Number(amount);
  if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) { const error = new Error("Contribution amount must be greater than zero."); error.statusCode = 400; throw error; }
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [memberships] = await db.query(`SELECT sm.stokvel_id, u.full_name FROM stokvel_members sm INNER JOIN users u ON u.user_id = sm.user_id WHERE sm.user_id = ? LIMIT 1 FOR UPDATE`, [userId]);
    if (!memberships.length) { const error = new Error("You are not a member of a Stokvel."); error.statusCode = 403; throw error; }
    const stokvelId = memberships[0].stokvel_id;
    const [cards] = await db.query(`SELECT card_id, card_type, last_four_digits, available_amount FROM card_details WHERE card_id = ? LIMIT 1 FOR UPDATE`, [cardId]);
    if (!cards.length) { const error = new Error("Payment method not found."); error.statusCode = 400; throw error; }
    if (Number(cards[0].available_amount) < contributionAmount) { const error = new Error(`Insufficient available funds. Available amount: R ${Number(cards[0].available_amount).toFixed(2)}`); error.statusCode = 400; throw error; }
    const [wallets] = await db.query(`SELECT wallet_id FROM stokvel_wallets WHERE stokvel_id = ? LIMIT 1 FOR UPDATE`, [stokvelId]);
    if (!wallets.length) { const error = new Error("The Stokvel wallet has not been set up yet. Run backend/sql/stokvel_wallet.sql first."); error.statusCode = 503; throw error; }
    await db.query(`UPDATE card_details SET available_amount = available_amount - ? WHERE card_id = ?`, [contributionAmount, cardId]);
    const [created] = await db.query(`INSERT INTO money_contributions (card_id, stokvel_id, member_name, amount, payment_status) VALUES (?, ?, ?, ?, 'Paid')`, [cardId, stokvelId, memberships[0].full_name, contributionAmount]);
    await db.query(`UPDATE stokvel_wallets SET balance = balance + ? WHERE wallet_id = ?`, [contributionAmount, wallets[0].wallet_id]);
    await db.query(`INSERT INTO stokvel_wallet_transactions (stokvel_id, user_id, transaction_type, amount, reference_id, description) VALUES (?, ?, 'CONTRIBUTION', ?, ?, ?)`, [stokvelId, userId, contributionAmount, created.insertId, `Member contribution #${created.insertId}`]);
    await db.commit();
    return { contribution_id: created.insertId, amount: Number(contributionAmount.toFixed(2)), payment_status: "Paid", card_type: cards[0].card_type, last_four_digits: cards[0].last_four_digits };
  } catch (error) { await db.rollback(); throw error; }
  finally { db.release(); }
};

export const saveStokvelGoal = async ({ userId, targetAmount, deadline }) => {
  const target = Number(targetAmount);
  if (!Number.isFinite(target) || target <= 0) { const error = new Error("Target amount must be greater than zero."); error.statusCode = 400; throw error; }
  if (!deadline) { const error = new Error("A funding deadline is required."); error.statusCode = 400; throw error; }
  const [memberships] = await pool.query(`SELECT sm.stokvel_id, u.role FROM stokvel_members sm INNER JOIN users u ON u.user_id = sm.user_id WHERE sm.user_id = ? LIMIT 1`, [userId]);
  if (!memberships.length) { const error = new Error("You are not a member of a Stokvel."); error.statusCode = 403; throw error; }
  if (!['chairperson', 'admin'].includes(memberships[0].role)) { const error = new Error("Only the Stokvel chairperson can manage the funding goal."); error.statusCode = 403; throw error; }
  await pool.query(`INSERT INTO stokvel_goals (stokvel_id, target_amount, deadline) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount), deadline = VALUES(deadline), updated_at = CURRENT_TIMESTAMP`, [memberships[0].stokvel_id, target, deadline]);
  const [rows] = await pool.query(`SELECT goal_id, target_amount, deadline, created_at, updated_at FROM stokvel_goals WHERE stokvel_id = ? LIMIT 1`, [memberships[0].stokvel_id]);
  return rows[0];
};

export const voteForProduct = async ({ userId, productId }) => {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [membershipRows] = await db.query(`SELECT stokvel_id FROM stokvel_members WHERE user_id = ? LIMIT 1`, [userId]);
    if (!membershipRows.length) { const error = new Error("You are not a member of a Stokvel."); error.statusCode = 403; throw error; }
    const stokvelId = membershipRows[0].stokvel_id;
    const [products] = await db.query(`SELECT product_id, category FROM products WHERE product_id = ? LIMIT 1`, [productId]);
    if (!products.length) { const error = new Error("Product not found."); error.statusCode = 404; throw error; }
    await db.query(`DELETE sv FROM stokvel_product_votes sv INNER JOIN products oldp ON oldp.product_id = sv.product_id WHERE sv.stokvel_id = ? AND sv.user_id = ? AND oldp.category = ?`, [stokvelId, userId, products[0].category]);
    await db.query(`INSERT INTO stokvel_product_votes (stokvel_id, user_id, product_id) VALUES (?, ?, ?)`, [stokvelId, userId, productId]);
    await db.commit();
    return { product_id: productId, category: products[0].category };
  } catch (error) { await db.rollback(); throw error; }
  finally { db.release(); }
};
