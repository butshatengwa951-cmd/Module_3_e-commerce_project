import { getMembershipByUserId } from "../models/Cart.js";
import {
  confirmPendingOrder,
  getOrderDetailsForStokvel,
  getOrderHistoryForStokvel,
  getPendingOrderForStokvel,
} from "../models/Order.js";

export const getCurrentOrder = async (req, res) => {
  try {
    const membership = await getMembershipByUserId(req.user.user_id);
    if (!membership) return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });
    const result = await getPendingOrderForStokvel(membership.stokvel_id);
    return res.json({ success: true, order: result?.order || null, items: result?.items || [] });
  } catch (error) {
    console.error("Get current order error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve the current order." });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const membership = await getMembershipByUserId(req.user.user_id);
    if (!membership) return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });
    const orders = await getOrderHistoryForStokvel(membership.stokvel_id);
    return res.json({ success: true, stokvel: membership, orders });
  } catch (error) {
    console.error("Get order history error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve order history." });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const membership = await getMembershipByUserId(req.user.user_id);
    if (!membership) return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const result = await getOrderDetailsForStokvel(orderId, membership.stokvel_id);
    if (!result) return res.status(404).json({ success: false, message: "Order not found." });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Get order details error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve order details." });
  }
};

export const confirmCurrentOrder = async (req, res) => {
  try {
    const membership = await getMembershipByUserId(req.user.user_id);
    if (!membership) return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });
    const order = await confirmPendingOrder(membership.stokvel_id);
    return res.json({ success: true, message: "Order confirmed successfully.", order });
  } catch (error) {
    console.error("Confirm order error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to confirm the order." });
  }
};
