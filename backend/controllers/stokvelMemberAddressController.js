import {
  createMemberAddress,
  deleteMemberAddress,
  getMemberAddresses,
  setDefaultMemberAddress,
  updateMemberAddress,
} from "../models/StokvelMemberAddress.js";

const handle = (action) => async (req, res) => {
  try {
    return res.json({ success: true, ...(await action(req)) });
  } catch (error) {
    console.error("Stokvel member address error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Address request failed." });
  }
};

export const getAddresses = handle(async (req) => getMemberAddresses(req.user.user_id));
export const createAddress = handle(async (req) => createMemberAddress(req.user.user_id, req.body));
export const updateAddress = handle(async (req) => updateMemberAddress(req.user.user_id, Number(req.params.id), req.body));
export const deleteAddress = handle(async (req) => deleteMemberAddress(req.user.user_id, Number(req.params.id)));
export const setDefaultAddress = handle(async (req) => setDefaultMemberAddress(req.user.user_id, Number(req.params.id)));
