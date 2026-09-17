import { reorderPreviousOrder } from "../models/Reorder.js";

export const reorder = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId < 1) return res.status(400).json({ success: false, message: "Invalid order ID." });
    const result = await reorderPreviousOrder({ userId: req.user.user_id, orderId });
    return res.status(201).json({ success: true, message: "Previous order added to your group cart.", ...result });
  } catch (error) {
    console.error("Reorder error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to reorder." });
  }
};
