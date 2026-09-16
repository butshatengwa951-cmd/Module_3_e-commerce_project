import {
  getPaymentOptionsForUser,
  payCurrentOrder,
} from "../models/Payment.js";

export const getPaymentOptions = async (req, res) => {
  try {
    const data = await getPaymentOptionsForUser(req.user.user_id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No confirmed order is ready for payment.",
      });
    }

    return res.json({ success: true, ...data });
  } catch (error) {
    console.error("Get payment options error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load payment options.",
    });
  }
};

export const payOrder = async (req, res) => {
  try {
    const { card_id, delivery_address } = req.body;

    const cardId = Number(card_id);

    if (!Number.isInteger(cardId) || cardId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid payment card is required.",
      });
    }

    const result = await payCurrentOrder({
      userId: req.user.user_id,
      cardId,
      deliveryAddress: delivery_address,
    });

    return res.json({
      success: true,
      message: "Payment successful. Your order is now processing.",
      ...result,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Payment failed.",
    });
  }
};
