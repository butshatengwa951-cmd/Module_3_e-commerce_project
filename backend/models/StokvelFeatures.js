import pool from "../config/db.js";

const getMembership = async (userId) => {
  const [rows] = await pool.query(
    `SELECT sm.stokvel_member_id,
            sm.stokvel_id,
            s.stokvel_name,
            s.description,
            COALESCE(smr.stokvel_role, 'MEMBER') AS stokvel_role
     FROM stokvel_members sm
     INNER JOIN stokvels s ON s.stokvel_id = sm.stokvel_id
     LEFT JOIN stokvel_member_roles smr ON smr.stokvel_member_id = sm.stokvel_member_id
     WHERE sm.user_id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

export const getStokvelFeatures = async (userId) => {
  const membership = await getMembership(userId);
  if (!membership) return null;

  const [goals] = await pool.query(
    `SELECT goal_id,target_amount,deadline,created_at,updated_at
     FROM stokvel_goals
     WHERE stokvel_id = ?
     LIMIT 1`,
    [membership.stokvel_id]
  );

  const [walletRows] = await pool.query(
    `SELECT balance
     FROM stokvel_wallets
     WHERE stokvel_id = ?
     LIMIT 1`,
    [membership.stokvel_id]
  );

  return {
    membership,
    goal: goals[0] || null,
    wallet: { available_balance: Number(walletRows[0]?.balance || 0) },
  };
};

export const saveStokvelGoal = async ({ userId, targetAmount, deadline }) => {
  const target = Number(targetAmount);
  if (!Number.isFinite(target) || target <= 0) {
    const error = new Error("Target amount must be greater than zero."); error.statusCode = 400; throw error;
  }
  if (!deadline) {
    const error = new Error("A funding deadline is required."); error.statusCode = 400; throw error;
  }

  const membership = await getMembership(userId);
  if (!membership) {
    const error = new Error("You are not a member of a Stokvel."); error.statusCode = 403; throw error;
  }
  if (String(membership.stokvel_role).toUpperCase() !== "TREASURER") {
    const error = new Error("Only the Stokvel treasurer can manage the funding goal."); error.statusCode = 403; throw error;
  }

  await pool.query(
    `INSERT INTO stokvel_goals (stokvel_id,target_amount,deadline)
     VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE target_amount=VALUES(target_amount),deadline=VALUES(deadline),updated_at=CURRENT_TIMESTAMP`,
    [membership.stokvel_id, target, deadline]
  );

  const [rows] = await pool.query(
    `SELECT goal_id,target_amount,deadline,created_at,updated_at
     FROM stokvel_goals WHERE stokvel_id=? LIMIT 1`,
    [membership.stokvel_id]
  );
  return rows[0];
};
