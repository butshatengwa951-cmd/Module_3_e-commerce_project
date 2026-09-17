import pool from "../config/db.js";
import {
  createPayfastCheckout,
  isPayfastSourceIp,
  validatePayfastNotification,
  verifyPayfastSignature,
} from "../utils/payfast.js";

const getMembership = async (userId) => {
  const [rows] = await pool.query(
    `SELECT sm.stokvel_id,s.stokvel_name,u.user_id,u.full_name,u.email,u.phone_number
     FROM stokvel_members sm
     INNER JOIN stokvels s ON s.stokvel_id=sm.stokvel_id
     INNER JOIN users u ON u.user_id=sm.user_id
     WHERE sm.user_id=? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

export const createContributionCheckout = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: "Enter a valid contribution amount." });

    const membership = await getMembership(req.user.user_id);
    if (!membership) return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });

    const mPaymentId = `SW-${Date.now()}-${req.user.user_id}-${Math.random().toString(36).slice(2, 8)}`;
    const itemName = `${membership.stokvel_name} contribution`;
    await pool.query(
      `INSERT INTO payfast_payments (user_id,stokvel_id,m_payment_id,amount,item_name,status)
       VALUES (?,?,?,?,?,'CREATED')`,
      [req.user.user_id, membership.stokvel_id, mPaymentId, amount.toFixed(2), itemName]
    );

    const checkout = createPayfastCheckout({
      paymentId: mPaymentId,
      amount,
      user: membership,
      itemName,
    });

    await pool.query(`UPDATE payfast_payments SET status='PENDING' WHERE m_payment_id=?`, [mPaymentId]);
    return res.status(201).json({ success: true, payment_id: mPaymentId, ...checkout });
  } catch (error) {
    console.error("PayFast checkout creation failed:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Unable to create PayFast checkout." });
  }
};

export const payfastNotify = async (req, res) => {
  try {
    const sourceIp = req.ip || req.socket?.remoteAddress;
    if (!(await isPayfastSourceIp(sourceIp))) return res.status(403).send("Invalid source IP");
    if (!verifyPayfastSignature(req.body || {})) return res.status(400).send("Invalid signature");
    if (!(await validatePayfastNotification(req.body || {}))) return res.status(400).send("Invalid notification");

    const mPaymentId = String(req.body.m_payment_id || "");
    const status = String(req.body.payment_status || "").toUpperCase();
    const [payments] = await pool.query(`SELECT * FROM payfast_payments WHERE m_payment_id=? LIMIT 1`, [mPaymentId]);
    if (!payments.length) return res.status(404).send("Payment not found");
    const payment = payments[0];

    if (Number(req.body.amount_gross).toFixed(2) !== Number(payment.amount).toFixed(2)) return res.status(400).send("Amount mismatch");
    if (String(req.body.merchant_id) !== String(process.env.PAYFAST_MERCHANT_ID)) return res.status(400).send("Merchant mismatch");

    if (status === "COMPLETE" && payment.status !== "COMPLETE") {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [locked] = await connection.query(`SELECT * FROM payfast_payments WHERE payment_id=? FOR UPDATE`, [payment.payment_id]);
        if (locked.length && locked[0].status !== "COMPLETE") {
          await connection.query(
            `UPDATE payfast_payments SET status='COMPLETE',pf_payment_id=?,raw_status=?,completed_at=NOW() WHERE payment_id=?`,
            [req.body.pf_payment_id || null, status, payment.payment_id]
          );

          const [wallets] = await connection.query(`SELECT wallet_id FROM stokvel_wallets WHERE stokvel_id=? FOR UPDATE`, [payment.stokvel_id]);
          if (!wallets.length) {
            await connection.query(`INSERT INTO stokvel_wallets (stokvel_id,balance) VALUES (?,0)`, [payment.stokvel_id]);
          }
          await connection.query(`UPDATE stokvel_wallets SET balance=balance+? WHERE stokvel_id=?`, [payment.amount, payment.stokvel_id]);
          await connection.query(
            `INSERT INTO stokvel_wallet_transactions (stokvel_id,user_id,transaction_type,amount,reference_id,description)
             VALUES (?,?, 'CONTRIBUTION',?,?,?)`,
            [payment.stokvel_id, payment.user_id, payment.amount, payment.payment_id, `PayFast contribution ${payment.m_payment_id}`]
          );
          await connection.query(
            `INSERT INTO money_contributions (card_id,stokvel_id,member_name,amount,payment_status)
             VALUES (NULL,?,?,?,'Paid')`,
            [payment.stokvel_id, payment.user_id ? (await connection.query(`SELECT full_name FROM users WHERE user_id=?`, [payment.user_id]))[0][0]?.full_name : "Member", payment.amount]
          );
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else if (["FAILED", "CANCELLED"].includes(status)) {
      await pool.query(`UPDATE payfast_payments SET status=?,pf_payment_id=?,raw_status=? WHERE payment_id=?`, [status, req.body.pf_payment_id || null, status, payment.payment_id]);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("PayFast ITN failed:", error);
    return res.status(500).send("ITN processing failed");
  }
};

export const getContributionPayment = async (req, res) => {
  try {
    const membership = await getMembership(req.user.user_id);
    if (!membership) return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });
    const [wallet] = await pool.query(`SELECT balance FROM stokvel_wallets WHERE stokvel_id=? LIMIT 1`, [membership.stokvel_id]);
    const [payments] = await pool.query(
      `SELECT m_payment_id,amount,status,created_at,completed_at FROM payfast_payments WHERE user_id=? AND stokvel_id=? ORDER BY created_at DESC LIMIT 10`,
      [req.user.user_id, membership.stokvel_id]
    );
    return res.json({ success: true, stokvel: membership, wallet: { available_balance: Number(wallet[0]?.balance || 0) }, payments });
  } catch (error) {
    console.error("PayFast contribution history failed:", error);
    return res.status(500).json({ success: false, message: "Unable to load contribution payments." });
  }
};
