// payment.js - UNIFIED Payment Model for StockWell
// Supports both SIMULATED (for testing) and REAL Paystack (for production)
// Toggle via .env: PAYMENT_MODE=simulated or PAYMENT_MODE=paystack

import pool from "../config/db.js";
import axios from "axios";
import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";
const PAYMENT_MODE = process.env.PAYMENT_MODE || "simulated"; // simulated | paystack

const getPaystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

export const PaymentModels = {
  // --- CORE POT LOGIC (shared) ---
  async getCardPot(card_id) {
    const [rows] = await pool.query(
      `SELECT * FROM card_details WHERE card_id = ?`,
      [card_id],
    );
    return rows[0] || null;
  },

  async checkPotBalance(card_id, requiredAmount) {
    const pot = await this.getCardPot(card_id);
    if (!pot) throw new Error("Stokvel pot / voucher not found");
    if (new Date(pot.expiry_date) < new Date())
      throw new Error("Voucher expired");
    return {
      hasEnough: parseFloat(pot.available_amount) >= parseFloat(requiredAmount),
      available: parseFloat(pot.available_amount),
      pot,
    };
  },

  // --- CONTRIBUTION - SWITCHES BASED ON MODE ---
  async createContribution({
    card_id,
    member_name,
    amount,
    method = "EFT",
    email,
  }) {
    if (PAYMENT_MODE === "paystack") {
      return await this.initializeRealPayment({
        email,
        amount,
        card_id,
        member_name,
        method,
      });
    } else {
      return await this.simulateContribution({
        card_id,
        member_name,
        amount,
        method,
      });
    }
  },

  async simulateContribution({ card_id, member_name, amount, method = "EFT" }) {
    const random = Math.random();
    let status = "Paid";
    let gateway_response = "";
    if (random < 0.1) {
      status = "Failed";
      gateway_response = `Simulated ${method} failed`;
    } else if (method === "EFT" && random < 0.25) {
      status = "Pending";
      gateway_response = `Simulated EFT pending`;
    } else {
      gateway_response = `Simulated ${method} success - Ref: SW-${Date.now()}`;
    }
    const [result] = await pool.query(
      `INSERT INTO money_contributions (card_id, member_name, amount, payment_status) VALUES (?, ?, ?, ?)`,
      [card_id, member_name, amount, status],
    );
    if (status === "Paid") {
      await pool.query(
        `UPDATE card_details SET available_amount = available_amount + ? WHERE card_id = ?`,
        [amount, card_id],
      );
    }
    const [contribution] = await pool.query(
      `SELECT * FROM money_contributions WHERE contribution_id = ?`,
      [result.insertId],
    );
    return {
      ...contribution[0],
      simulated_method: method,
      gateway_response,
      credited: status === "Paid",
      mode: "simulated",
    };
  },

  async initializeRealPayment({
    email,
    amount,
    card_id,
    member_name,
    metadata = {},
  }) {
    const amountInKobo = Math.round(parseFloat(amount) * 100);
    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email,
        amount: amountInKobo,
        currency: "ZAR",
        reference: `STW-${card_id}-${Date.now()}`,
        metadata: { card_id, member_name, ...metadata },
        callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
      },
      { headers: getPaystackHeaders() },
    );
    const data = response.data.data;
    const [result] = await pool.query(
      `INSERT INTO money_contributions (card_id, member_name, amount, payment_status) VALUES (?, ?, ?, 'Pending')`,
      [card_id, member_name, amount],
    );
    await pool.query(
      `CREATE TABLE IF NOT EXISTS payment_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        contribution_id INT,
        paystack_reference VARCHAR(100) UNIQUE,
        authorization_url TEXT,
        access_code VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contribution_id) REFERENCES money_contributions(contribution_id)
      )`,
    );
    await pool.query(
      `INSERT INTO payment_logs (contribution_id, paystack_reference, authorization_url, access_code) VALUES (?, ?, ?, ?)`,
      [
        result.insertId,
        data.reference,
        data.authorization_url,
        data.access_code,
      ],
    );
    return {
      success: true,
      contribution_id: result.insertId,
      authorization_url: data.authorization_url,
      reference: data.reference,
      mode: "paystack",
    };
  },

  async verifyRealPayment(reference) {
    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: getPaystackHeaders() },
    );
    const paystackData = response.data.data;
    const [logs] = await pool.query(
      `SELECT * FROM payment_logs WHERE paystack_reference = ?`,
      [reference],
    );
    if (logs.length === 0) throw new Error("Payment log not found");
    const contributionId = logs[0].contribution_id;
    const [contrib] = await pool.query(
      `SELECT * FROM money_contributions WHERE contribution_id = ?`,
      [contributionId],
    );
    if (paystackData.status === "success") {
      await pool.query(
        `UPDATE money_contributions SET payment_status = 'Paid' WHERE contribution_id = ?`,
        [contributionId],
      );
      await pool.query(
        `UPDATE card_details SET available_amount = available_amount + ? WHERE card_id = ?`,
        [contrib[0].amount, contrib[0].card_id],
      );
      return {
        success: true,
        status: "Paid",
        contribution_id: contributionId,
        amount: paystackData.amount / 100,
      };
    } else {
      await pool.query(
        `UPDATE money_contributions SET payment_status = 'Failed' WHERE contribution_id = ?`,
        [contributionId],
      );
      return { success: false, status: "Failed", reference };
    }
  },

  verifyWebhookSignature(req) {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)
      .digest("hex");
    return hash === req.headers["x-paystack-signature"];
  },

  async handleWebhookEvent(event) {
    if (event.event === "charge.success")
      return await this.verifyRealPayment(event.data.reference);
    if (event.event === "charge.failed") {
      const [logs] = await pool.query(
        `SELECT * FROM payment_logs WHERE paystack_reference = ?`,
        [event.data.reference],
      );
      if (logs.length > 0)
        await pool.query(
          `UPDATE money_contributions SET payment_status = 'Failed' WHERE contribution_id = ?`,
          [logs[0].contribution_id],
        );
      return { success: false, status: "Failed" };
    }
    return { ignored: true };
  },

  async payOrderFromPot({ card_id, total_amount, order_id }) {
    const [cardRows] = await pool.query(
      `SELECT * FROM card_details WHERE card_id = ? FOR UPDATE`,
      [card_id],
    );
    const card = cardRows[0];
    if (!card) throw new Error("Pot not found");
    if (parseFloat(card.available_amount) < parseFloat(total_amount))
      throw new Error(`Insufficient balance: R${card.available_amount}`);
    await pool.query(
      `UPDATE card_details SET available_amount = available_amount - ? WHERE card_id = ?`,
      [total_amount, card_id],
    );
    if (order_id)
      await pool.query(
        `UPDATE order_details SET order_status = 'Confirmed' WHERE order_id = ?`,
        [order_id],
      );
    return {
      success: true,
      new_balance: parseFloat(card.available_amount) - parseFloat(total_amount),
    };
  },

  async getPotSummary(card_id) {
    // FIXED: MySQL syntax [rows] not [[pot]]
    const [cardRows] = await pool.query(
      `SELECT * FROM card_details WHERE card_id = ?`,
      [card_id],
    );
    const [contributions] = await pool.query(
      `SELECT payment_status, COUNT(*) as count, SUM(amount) as total FROM money_contributions WHERE card_id = ? GROUP BY payment_status`,
      [card_id],
    );
    const [orders] = await pool.query(
      `SELECT order_status, COUNT(*) as count, SUM(total_amount) as total FROM order_details WHERE card_id = ? GROUP BY order_status`,
      [card_id],
    );
    return {
      pot: cardRows[0],
      contributions_breakdown: contributions,
      orders_breakdown: orders,
      total_paid:
        contributions.find((s) => s.payment_status === "Paid")?.total || 0,
    };
  },
};

export default PaymentModels;
