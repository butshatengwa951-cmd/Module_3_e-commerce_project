import { getStokvelFeatures, contributeToStokvel } from "../models/StokvelFeatures.js";

export const getPaymentOptions = async (req, res) => {
  try {
    const data = await getStokvelFeatures(req.user.user_id);
    if (!data) {
      return res.status(404).json({ success: false, message: "You are not a member of a Stokvel." });
    }
    return res.json({
      success: true,
      stokvel: data.membership,
      cards: data.cards || [],
      wallet: data.wallet || { available_balance: 0 },
    });
  } catch (error) {
    console.error("Get contribution payment options error:", error);
    return res.status(500).json({ success: false, message: "Failed to load contribution payment options." });
  }
};

export const payOrder = async (req, res) => {
  try {
    const cardId = Number(req.body?.card_id);
    const amount = Number(req.body?.amount);

    if (!Number.isInteger(cardId) || cardId < 1) {
      return res.status(400).json({ success: false, message: "Select a valid payment method for your contribution." });
    }

    const result = await contributeToStokvel({
      userId: req.user.user_id,
      cardId,
      amount,
    });

    return res.status(201).json({
      success: true,
      message: "Contribution added to the Group Wallet.",
      contribution: result,
    });
  } catch (error) {
    console.error("Contribution payment error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Contribution could not be completed.",
    });
  }
};
