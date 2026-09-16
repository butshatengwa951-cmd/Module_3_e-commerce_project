import { getMembershipByUserId } from "../models/Cart.js";
import {
  confirmPendingOrder,
  getPendingOrderForStokvel,
} from "../models/Order.js";

export const getCurrentOrder = async (req, res) => {
  try {
    const membership = await getMembershipByUserId(req.user.user_id);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of a Stokvel.",
      });
    }

    const result = await getPendingOrderForStokvel(membership.stokvel_id);

    return res.json({
      success: true,
      order: result?.order || null,
      items: result?.items || [],
    });
  } catch (error) {
    console.error("Get current order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the current order.",
    });
  }
};

export const confirmCurrentOrder = async (req, res) => {
  try {
    const membership = await getMembershipByUserId(req.user.user_id);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of a Stokvel.",
      });
    }

    const order = await confirmPendingOrder(membership.stokvel_id);

    return res.json({
      success: true,
      message: "Order confirmed successfully.",
      order,
    });
  } catch (error) {
    console.error("Confirm order error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to confirm the order.",
    });
  }
};
