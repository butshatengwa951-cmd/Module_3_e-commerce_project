import {
  contributeToStokvel,
  getStokvelFeatures,
  saveStokvelGoal,
  voteForProduct,
} from "../models/StokvelFeatures.js";

export const getFeatures = async (req, res) => {
  try {
    const features = await getStokvelFeatures(req.user.user_id);
    if (!features) return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });
    return res.json({ success: true, ...features });
  } catch (error) {
    console.error("Get Stokvel features error:", error);
    return res.status(500).json({ success: false, message: "Failed to load Stokvel features." });
  }
};

export const contribute = async (req, res) => {
  try {
    const result = await contributeToStokvel({
      userId: req.user.user_id,
      cardId: Number(req.body.card_id),
      amount: req.body.amount,
    });
    return res.status(201).json({ success: true, message: "Contribution added to the group wallet.", contribution: result });
  } catch (error) {
    console.error("Stokvel contribution error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to add contribution." });
  }
};

export const saveGoal = async (req, res) => {
  try {
    const goal = await saveStokvelGoal({
      userId: req.user.user_id,
      targetAmount: req.body.target_amount,
      deadline: req.body.deadline,
    });
    return res.json({ success: true, message: "Funding goal saved.", goal });
  } catch (error) {
    console.error("Stokvel goal error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to save funding goal." });
  }
};

export const vote = async (req, res) => {
  try {
    const productId = Number(req.body.product_id);
    if (!Number.isInteger(productId) || productId < 1) return res.status(400).json({ success: false, message: "Invalid product." });
    const result = await voteForProduct({ userId: req.user.user_id, productId });
    return res.json({ success: true, message: "Your group vote has been recorded.", vote: result });
  } catch (error) {
    console.error("Stokvel product vote error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to record vote." });
  }
};
