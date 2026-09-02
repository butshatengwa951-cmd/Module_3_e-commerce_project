import express from "express";
import PaymentModels from "../models/payment.js"; // your unified model

const router = express.Router();

// POST /api/payments/contribute - Works for both simulated & Paystack
router.post("/contribute", async (req, res) => {
  try {
    const { card_id, member_name, amount, method, email } = req.body;
    if (!card_id || !member_name || !amount) {
      return res
        .status(400)
        .json({ error: "card_id, member_name, amount required" });
    }
    // If Paystack mode, email is required
    if (process.env.PAYMENT_MODE === "paystack" && !email) {
      return res
        .status(400)
        .json({ error: "email required for Paystack mode" });
    }

    const result = await PaymentModels.createContribution({
      card_id,
      member_name,
      amount,
      method,
      email,
    });

    // If Paystack, frontend should redirect to authorization_url
    // If simulated, just return contribution
    res.status(201).json(result);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

// GET /api/payments/verify/:reference - For Paystack callback
router.get("/verify/:reference", async (req, res) => {
  try {
    const result = await PaymentModels.verifyRealPayment(req.params.reference);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook/paystack - MUST be raw body in server.js
router.post("/webhook/paystack", async (req, res) => {
  try {
    // req.body is Buffer because of express.raw()
    if (!PaymentModels.verifyWebhookSignature(req)) {
      return res.status(401).send("Invalid signature");
    }
    const event = JSON.parse(req.body.toString());
    const result = await PaymentModels.handleWebhookEvent(event);
    res.status(200).json(result);
  } catch (err) {
    console.error("Webhook error", err);
    res.status(500).send("Webhook error");
  }
});

// POST /api/payments/orders/pay - Pay order from pot
router.post("/orders/pay", async (req, res) => {
  try {
    const { card_id, total_amount, order_id } = req.body;
    const result = await PaymentModels.payOrderFromPot({
      card_id,
      total_amount,
      order_id,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/payments/pot/:card_id - Chairperson summary
router.get("/pot/:card_id", async (req, res) => {
  try {
    const summary = await PaymentModels.getPotSummary(req.params.card_id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/balance/:card_id - Quick balance check
router.get("/balance/:card_id", async (req, res) => {
  try {
    const pot = await PaymentModels.getCardPot(req.params.card_id);
    if (!pot) return res.status(404).json({ error: "Pot not found" });
    res.json({
      card_id: pot.card_id,
      available_amount: pot.available_amount,
      voucher_number: pot.voucher_number,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
