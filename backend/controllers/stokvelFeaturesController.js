import {
  getStokvelFeatures,
  saveStokvelGoal,
} from "../models/StokvelFeatures.js";

export const getFeatures = async (req, res) => {
  try {
    const features = await getStokvelFeatures(req.user.user_id);
    if (!features) {
      return res.status(403).json({ success: false, message: "You are not a member of a Stokvel." });
    }
    return res.json({ success: true, ...features });
  } catch (error) {
    console.error("Get Stokvel features error:", error);
    return res.status(500).json({ success: false, message: "Failed to load Stokvel features." });
  }
};

export const saveGoal = async (req, res) => {
  try {
    const goal = await saveStokvelGoal({
      userId: req.user.user_id,
      targetAmount: req.body.target_amount ?? req.body.targetAmount,
      deadline: req.body.deadline,
    });
    return res.json({ success: true, message: "Funding goal saved.", goal });
  } catch (error) {
    console.error("Stokvel goal error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to save funding goal." });
  }
};
