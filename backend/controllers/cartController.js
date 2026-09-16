import {
  getMembershipByUserId,
  getPendingCart,
  addItemToGroupCart,
  removeCartItem,
} from "../models/Cart.js";
import { updateCartItemQuantity } from "../models/CartQuantity.js";

const getUserMembership = async (userId) => {
  const membership = await getMembershipByUserId(userId);

  if (!membership) {
    const error = new Error("You must belong to a Stokvel to use the group basket.");
    error.statusCode = 403;
    throw error;
  }

  return membership;
};

export const getCart = async (req, res) => {
  try {
    const membership = await getUserMembership(req.user.user_id);
    const cart = await getPendingCart(membership.stokvel_id);

    return res.status(200).json({ success: true, stokvel: membership, ...cart });
  } catch (error) {
    console.error("Failed to get group cart:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to retrieve group basket.",
    });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const { product_id, supplier_price_id, quantity } = req.body;
    const productId = Number(product_id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: "A valid product_id is required." });
    }

    const membership = await getUserMembership(req.user.user_id);

    const result = await addItemToGroupCart({
      userId: req.user.user_id,
      stokvelId: membership.stokvel_id,
      productId,
      supplierPriceId: supplier_price_id ? Number(supplier_price_id) : null,
      quantity: quantity ?? 1,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to the group basket.",
      item: result.item,
    });
  } catch (error) {
    console.error("Failed to add cart item:", error);
    const status = error.statusCode || (error.message.includes("not found") || error.message.includes("valid") ? 404 : 400);
    return res.status(status).json({ success: false, message: error.message || "Failed to add product." });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID." });
    }

    const membership = await getUserMembership(req.user.user_id);
    const cart = await getPendingCart(membership.stokvel_id);

    if (!cart.items.some((item) => item.order_item_id === itemId)) {
      return res.status(403).json({ success: false, message: "You cannot modify this group basket item." });
    }

    const item = await updateCartItemQuantity(itemId, quantity);
    return res.status(200).json({ success: true, item });
  } catch (error) {
    console.error("Failed to update cart item:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to update basket item." });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID." });
    }

    const membership = await getUserMembership(req.user.user_id);
    const cart = await getPendingCart(membership.stokvel_id);

    if (!cart.items.some((item) => item.order_item_id === itemId)) {
      return res.status(403).json({ success: false, message: "You cannot modify this group basket item." });
    }

    await removeCartItem(itemId);
    return res.status(200).json({ success: true, message: "Basket item removed." });
  } catch (error) {
    console.error("Failed to remove cart item:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || "Failed to remove basket item." });
  }
};
