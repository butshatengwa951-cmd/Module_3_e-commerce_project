import pool from "../config/db.js";

const getMembership = async (userId) => {
  const [rows] = await pool.query(
    `SELECT sm.stokvel_member_id, sm.stokvel_id, sm.user_id,
            COALESCE(smr.stokvel_role, CASE WHEN s.chairperson_id=? THEN 'CHAIRPERSON' ELSE 'MEMBER' END) AS stokvel_role,
            s.stokvel_name
     FROM stokvel_members sm
     INNER JOIN stokvels s ON s.stokvel_id=sm.stokvel_id
     LEFT JOIN stokvel_member_roles smr ON smr.stokvel_member_id=sm.stokvel_member_id
     WHERE sm.user_id=?
     LIMIT 1`,
    [userId, userId]
  );
  return rows[0] || null;
};

const assertMember = async (userId) => {
  const membership = await getMembership(userId);
  if (!membership) {
    const error = new Error("You are not a member of a Stokvel.");
    error.statusCode = 403;
    throw error;
  }
  return membership;
};

const assertOfficer = (membership) => {
  if (!["CHAIRPERSON", "TREASURER"].includes(membership.stokvel_role)) {
    const error = new Error("Only the Stokvel chairperson or treasurer can perform this action.");
    error.statusCode = 403;
    throw error;
  }
};

export const getProposalDashboard = async (userId) => {
  const membership = await assertMember(userId);
  const [proposals] = await pool.query(
    `SELECT p.proposal_id,p.title,p.description,p.delivery_address,p.status,p.voting_deadline,
            p.created_at,p.updated_at,p.created_by,p.approved_at,p.approved_by,p.authorised_at,p.authorised_by,
            u.full_name AS created_by_name,
            COALESCE(SUM(CASE WHEN v.vote='APPROVE' THEN 1 ELSE 0 END),0) AS approve_votes,
            COALESCE(SUM(CASE WHEN v.vote='REJECT' THEN 1 ELSE 0 END),0) AS reject_votes,
            MAX(CASE WHEN v.user_id=? THEN v.vote END) AS my_vote
     FROM stokvel_purchase_proposals p
     INNER JOIN users u ON u.user_id=p.created_by
     LEFT JOIN stokvel_purchase_proposal_votes v ON v.proposal_id=p.proposal_id
     WHERE p.stokvel_id=?
     GROUP BY p.proposal_id,p.title,p.description,p.delivery_address,p.status,p.voting_deadline,
              p.created_at,p.updated_at,p.created_by,p.approved_at,p.approved_by,p.authorised_at,p.authorised_by,u.full_name
     ORDER BY p.created_at DESC`,
    [userId, membership.stokvel_id]
  );

  const proposalIds = proposals.map((proposal) => proposal.proposal_id);
  let items = [];
  if (proposalIds.length) {
    [items] = await pool.query(
      `SELECT i.proposal_id,i.proposal_item_id,i.product_id,p.product_name,p.category,
              i.supplier_price_id,sp.supplier_name,i.quantity,i.unit_price,i.subtotal
       FROM stokvel_purchase_proposal_items i
       INNER JOIN products p ON p.product_id=i.product_id
       INNER JOIN supplier_prices sp ON sp.supplier_price_id=i.supplier_price_id
       WHERE i.proposal_id IN (?)
       ORDER BY i.proposal_id DESC,i.proposal_item_id ASC`,
      [proposalIds]
    );
  }

  const [wallet] = await pool.query(
    `SELECT balance FROM stokvel_wallets WHERE stokvel_id=? LIMIT 1`,
    [membership.stokvel_id]
  );

  return {
    membership,
    wallet_balance: Number(wallet[0]?.balance || 0),
    proposals: proposals.map((proposal) => ({
      ...proposal,
      approve_votes: Number(proposal.approve_votes || 0),
      reject_votes: Number(proposal.reject_votes || 0),
      items: items.filter((item) => item.proposal_id === proposal.proposal_id),
    })),
  };
};

export const createProposal = async ({ userId, title, description, delivery_address, items }) => {
  const membership = await assertMember(userId);
  if (!title?.trim()) throw Object.assign(new Error("A proposal title is required."), { statusCode: 400 });
  if (!Array.isArray(items) || items.length === 0) throw Object.assign(new Error("Add at least one product to the proposal."), { statusCode: 400 });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [proposalResult] = await connection.query(
      `INSERT INTO stokvel_purchase_proposals
       (stokvel_id,created_by,title,description,delivery_address,status,voting_deadline)
       VALUES (?,?,?,?,?,'VOTING',DATE_ADD(NOW(),INTERVAL 48 HOUR))`,
      [membership.stokvel_id, userId, title.trim(), description?.trim() || null, delivery_address?.trim() || null]
    );

    let total = 0;
    for (const rawItem of items) {
      const productId = Number(rawItem.product_id);
      const supplierPriceId = Number(rawItem.supplier_price_id);
      const quantity = Number(rawItem.quantity);
      if (!Number.isInteger(productId) || !Number.isInteger(supplierPriceId) || !Number.isInteger(quantity) || quantity < 1) {
        throw Object.assign(new Error("Proposal items contain invalid product, supplier, or quantity data."), { statusCode: 400 });
      }
      const [prices] = await connection.query(
        `SELECT supplier_price_id,product_id,price FROM supplier_prices WHERE supplier_price_id=? AND product_id=? LIMIT 1`,
        [supplierPriceId, productId]
      );
      if (!prices.length) throw Object.assign(new Error("One of the selected supplier prices is no longer available."), { statusCode: 400 });
      const unitPrice = Number(prices[0].price);
      const subtotal = unitPrice * quantity;
      total += subtotal;
      await connection.query(
        `INSERT INTO stokvel_purchase_proposal_items
         (proposal_id,product_id,supplier_price_id,quantity,unit_price,subtotal)
         VALUES (?,?,?,?,?,?)`,
        [proposalResult.insertId, productId, supplierPriceId, quantity, unitPrice, subtotal]
      );
    }

    await connection.commit();
    return { proposal_id: proposalResult.insertId, total };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const castProposalVote = async ({ userId, proposalId, vote }) => {
  const membership = await assertMember(userId);
  if (!["APPROVE", "REJECT"].includes(vote)) throw Object.assign(new Error("Vote must be APPROVE or REJECT."), { statusCode: 400 });
  const [proposals] = await pool.query(
    `SELECT proposal_id,status,voting_deadline FROM stokvel_purchase_proposals WHERE proposal_id=? AND stokvel_id=? LIMIT 1`,
    [proposalId, membership.stokvel_id]
  );
  if (!proposals.length) throw Object.assign(new Error("Purchase proposal not found."), { statusCode: 404 });
  if (proposals[0].status !== "VOTING") throw Object.assign(new Error("This proposal is no longer open for voting."), { statusCode: 409 });
  if (proposals[0].voting_deadline && new Date(proposals[0].voting_deadline) < new Date()) throw Object.assign(new Error("The voting period has ended."), { statusCode: 409 });

  await pool.query(
    `INSERT INTO stokvel_purchase_proposal_votes (proposal_id,user_id,vote)
     VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE vote=VALUES(vote),updated_at=CURRENT_TIMESTAMP`,
    [proposalId, userId, vote]
  );
  return { proposal_id: proposalId, vote };
};

export const approveProposal = async ({ userId, proposalId }) => {
  const membership = await assertMember(userId);
  assertOfficer(membership);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT p.*, COUNT(DISTINCT sm.user_id) AS member_count,
              COALESCE(SUM(CASE WHEN v.vote='APPROVE' THEN 1 ELSE 0 END),0) AS approve_votes,
              COALESCE(SUM(CASE WHEN v.vote='REJECT' THEN 1 ELSE 0 END),0) AS reject_votes
       FROM stokvel_purchase_proposals p
       INNER JOIN stokvel_members sm ON sm.stokvel_id=p.stokvel_id
       LEFT JOIN stokvel_purchase_proposal_votes v ON v.proposal_id=p.proposal_id
       WHERE p.proposal_id=? AND p.stokvel_id=?
       GROUP BY p.proposal_id
       FOR UPDATE`,
      [proposalId, membership.stokvel_id]
    );
    if (!rows.length) throw Object.assign(new Error("Purchase proposal not found."), { statusCode: 404 });
    const proposal = rows[0];
    const required = Math.floor(Number(proposal.member_count) / 2) + 1;
    if (proposal.status !== "VOTING") throw Object.assign(new Error("Only proposals in voting can be approved."), { statusCode: 409 });
    if (Number(proposal.approve_votes) < required) throw Object.assign(new Error(`A majority is required. ${required} approval votes are needed.`), { statusCode: 409 });
    if (Number(proposal.approve_votes) <= Number(proposal.reject_votes)) throw Object.assign(new Error("The proposal does not have a majority approval."), { statusCode: 409 });

    await connection.query(
      `UPDATE stokvel_purchase_proposals SET status='APPROVED',approved_at=NOW(),approved_by=? WHERE proposal_id=?`,
      [userId, proposalId]
    );
    await connection.commit();
    return { proposal_id: proposalId, status: "APPROVED" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const authoriseProposal = async ({ userId, proposalId }) => {
  const membership = await assertMember(userId);
  assertOfficer(membership);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [proposals] = await connection.query(
      `SELECT proposal_id,status FROM stokvel_purchase_proposals WHERE proposal_id=? AND stokvel_id=? FOR UPDATE`,
      [proposalId, membership.stokvel_id]
    );
    if (!proposals.length) throw Object.assign(new Error("Purchase proposal not found."), { statusCode: 404 });
    if (proposals[0].status !== "APPROVED") throw Object.assign(new Error("Only an approved proposal can be authorised."), { statusCode: 409 });
    await connection.query(
      `UPDATE stokvel_purchase_proposals SET status='AUTHORISED',authorised_at=NOW(),authorised_by=? WHERE proposal_id=?`,
      [userId, proposalId]
    );
    await connection.commit();
    return { proposal_id: proposalId, status: "AUTHORISED" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
