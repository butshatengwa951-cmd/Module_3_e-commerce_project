import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "../controllers/stokvelMemberAddressController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.post("/:id/default", setDefaultAddress);
export default router;
