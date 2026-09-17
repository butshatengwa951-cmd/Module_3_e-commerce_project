import {
  approveProposal,
  authoriseProposal,
  castProposalVote,
  createProposal,
  getProposalDashboard,
} from "../models/StokvelPurchaseProposal.js";

const handle = (action) => async (req, res) => {
  try {
    const result = await action(req);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Stokvel proposal error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Stokvel proposal request failed." });
  }
};

export const getProposals = handle(async (req) => getProposalDashboard(req.user.user_id));

export const createPurchaseProposal = handle(async (req) => createProposal({
  userId: req.user.user_id,
  title: req.body?.title,
  description: req.body?.description,
  delivery_address: req.body?.delivery_address,
  items: req.body?.items,
}));

export const voteOnProposal = handle(async (req) => castProposalVote({
  userId: req.user.user_id,
  proposalId: Number(req.params.id),
  vote: req.body?.vote,
}));

export const approvePurchaseProposal = handle(async (req) => approveProposal({
  userId: req.user.user_id,
  proposalId: Number(req.params.id),
}));

export const authorisePurchaseProposal = handle(async (req) => authoriseProposal({
  userId: req.user.user_id,
  proposalId: Number(req.params.id),
}));
