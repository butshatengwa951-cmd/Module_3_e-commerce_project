import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  approvePurchaseProposal,
  authorisePurchaseProposal,
  createProposalFromCart,
  createPurchaseProposal,
  getProposals,
  voteOnProposal,
} from "../controllers/stokvelProposalController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/", getProposals);
router.post("/", createPurchaseProposal);
router.post("/from-cart", createProposalFromCart);
router.post("/:id/vote", voteOnProposal);
router.post("/:id/approve", approvePurchaseProposal);
router.post("/:id/authorise", authorisePurchaseProposal);
export default router;
