import pool from "../config/db.js";

export const getMemberDashboardData = async (userId) => {
  const [membershipRows] = await pool.query(
    `
      SELECT sm.stokvel_id, s.stokvel_name, s.description
      FROM stokvel_members sm
      INNER JOIN stokvels s ON s.stokvel_id = sm.stokvel_id
      WHERE sm.user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  if (!membershipRows.length) return null;
  const stokvel = membershipRows[0];

  // money_contributions exists in the original database without a stokvel_id column.
  // Scope contributions to this Stokvel through the member's users/membership records
  // so the dashboard works both before and after the optional migration is applied.
  const [members] = await pool.query(
    `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        sm.joined_at,
        COALESCE(
          SUM(CASE WHEN mc.payment_status = 'Paid' THEN mc.amount ELSE 0 END),
          0
        ) AS paid_contributions,
        COALESCE(SUM(mc.amount), 0) AS recorded_contributions
      FROM stokvel_members sm
      INNER JOIN users u ON u.user_id = sm.user_id
      LEFT JOIN money_contributions mc ON mc.member_name = u.full_name
      WHERE sm.stokvel_id = ?
      GROUP BY u.user_id, u.full_name, u.email, u.role, sm.joined_at
      ORDER BY u.full_name ASC
    `,
    [stokvel.stokvel_id],
  );

  const [walletRows] = await pool.query(
    `
      SELECT
        COALESCE(
          (
            SELECT SUM(mc.amount)
            FROM money_contributions mc
            INNER JOIN users cu ON cu.full_name = mc.member_name
            INNER JOIN stokvel_members csm
              ON csm.user_id = cu.user_id
             AND csm.stokvel_id = ?
            WHERE mc.payment_status = 'Paid'
          ),
          0
        ) AS paid_contributions,
        COALESCE(
          (
            SELECT SUM(od.total_amount)
            FROM order_details od
            WHERE od.stokvel_id = ?
              AND od.order_status IN ('Processing', 'Completed')
          ),
          0
        ) AS spent_amount
    `,
    [stokvel.stokvel_id, stokvel.stokvel_id],
  );

  const [contributionRows] = await pool.query(
    `
      SELECT
        mc.contribution_id,
        u.user_id,
        u.full_name,
        mc.amount,
        mc.contribution_date,
        mc.payment_status,
        mc.card_id
      FROM money_contributions mc
      INNER JOIN users u ON u.full_name = mc.member_name
      INNER JOIN stokvel_members sm
        ON sm.user_id = u.user_id
       AND sm.stokvel_id = ?
      ORDER BY mc.contribution_date DESC, mc.contribution_id DESC
    `,
    [stokvel.stokvel_id],
  );

  const wallet = walletRows[0] || { paid_contributions: 0, spent_amount: 0 };
  const paidContributions = Number(wallet.paid_contributions || 0);
  const spentAmount = Number(wallet.spent_amount || 0);

  return {
    stokvel,
    members: members.map((member) => ({
      ...member,
      paid_contributions: Number(member.paid_contributions || 0),
      recorded_contributions: Number(member.recorded_contributions || 0),
    })),
    contributions: contributionRows.map((contribution) => ({
      ...contribution,
      amount: Number(contribution.amount || 0),
    })),
    wallet: {
      paid_contributions: paidContributions,
      spent_amount: spentAmount,
      available_balance: Number((paidContributions - spentAmount).toFixed(2)),
    },
  };
};
