import pool from "../config/db.js";

export const getMemberDashboardData = async (userId) => {
  const [membershipRows] = await pool.query(`SELECT sm.stokvel_id, s.stokvel_name, s.description FROM stokvel_members sm INNER JOIN stokvels s ON s.stokvel_id = sm.stokvel_id WHERE sm.user_id = ? LIMIT 1`, [userId]);
  if (!membershipRows.length) return null;
  const stokvel = membershipRows[0];
  const [members] = await pool.query(`SELECT u.user_id, u.full_name, u.email, u.role, sm.joined_at, COALESCE(SUM(CASE WHEN mc.payment_status = 'Paid' THEN mc.amount ELSE 0 END),0) AS paid_contributions, COALESCE(SUM(mc.amount),0) AS recorded_contributions FROM stokvel_members sm INNER JOIN users u ON u.user_id = sm.user_id LEFT JOIN money_contributions mc ON mc.member_name = u.full_name AND mc.stokvel_id = sm.stokvel_id WHERE sm.stokvel_id = ? GROUP BY u.user_id,u.full_name,u.email,u.role,sm.joined_at ORDER BY u.full_name ASC`, [stokvel.stokvel_id]);
  const [walletRows] = await pool.query(`SELECT w.balance, COALESCE((SELECT SUM(t.amount) FROM stokvel_wallet_transactions t WHERE t.stokvel_id = ? AND t.transaction_type = 'CONTRIBUTION'),0) AS paid_contributions, COALESCE((SELECT SUM(t.amount) FROM stokvel_wallet_transactions t WHERE t.stokvel_id = ? AND t.transaction_type = 'PURCHASE'),0) AS spent_amount FROM stokvel_wallets w WHERE w.stokvel_id = ? LIMIT 1`, [stokvel.stokvel_id, stokvel.stokvel_id, stokvel.stokvel_id]);
  const [contributionRows] = await pool.query(`SELECT mc.contribution_id,u.user_id,u.full_name,mc.amount,mc.contribution_date,mc.payment_status,mc.card_id FROM money_contributions mc INNER JOIN users u ON u.full_name=mc.member_name INNER JOIN stokvel_members sm ON sm.user_id=u.user_id AND sm.stokvel_id=? WHERE mc.stokvel_id=? ORDER BY mc.contribution_date DESC,mc.contribution_id DESC`, [stokvel.stokvel_id, stokvel.stokvel_id]);
  const wallet = walletRows[0] || { balance: 0, paid_contributions: 0, spent_amount: 0 };
  return { stokvel, members: members.map((m)=>({...m,paid_contributions:Number(m.paid_contributions||0),recorded_contributions:Number(m.recorded_contributions||0)})), contributions: contributionRows.map((c)=>({...c,amount:Number(c.amount||0)})), wallet: { paid_contributions:Number(wallet.paid_contributions||0), spent_amount:Number(wallet.spent_amount||0), available_balance:Number(wallet.balance||0) } };
};
