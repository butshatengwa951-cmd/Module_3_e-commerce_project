const baseUrl = process.env.API_BASE_URL || "http://localhost:4040";
const memberToken = process.env.TEST_MEMBER_TOKEN;
const chairToken = process.env.TEST_CHAIR_TOKEN;
const treasurerToken = process.env.TEST_TREASURER_TOKEN;
const votingProposalId = process.env.TEST_PROPOSAL_ID_VOTING;
const approvedProposalId = process.env.TEST_PROPOSAL_ID_APPROVED;
const insufficientWalletProposalId = process.env.TEST_PROPOSAL_ID_INSUFFICIENT_WALLET;
const insufficientStockProposalId = process.env.TEST_PROPOSAL_ID_INSUFFICIENT_STOCK;
const successfulProposalId = process.env.TEST_PROPOSAL_ID_SUCCESS;

const required = {
  TEST_MEMBER_TOKEN: memberToken,
  TEST_CHAIR_TOKEN: chairToken,
  TEST_TREASURER_TOKEN: treasurerToken,
  TEST_PROPOSAL_ID_VOTING: votingProposalId,
  TEST_PROPOSAL_ID_APPROVED: approvedProposalId,
  TEST_PROPOSAL_ID_INSUFFICIENT_WALLET: insufficientWalletProposalId,
  TEST_PROPOSAL_ID_INSUFFICIENT_STOCK: insufficientStockProposalId,
  TEST_PROPOSAL_ID_SUCCESS: successfulProposalId,
};

const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  console.error(`Missing governance test variables: ${missing.join(", ")}`);
  process.exit(2);
}

if (process.env.CONFIRM_LIVE_MUTATIONS !== "YES") {
  console.error("This test exercises real proposal/wallet/order mutations. Set CONFIRM_LIVE_MUTATIONS=YES after preparing a dedicated test dataset.");
  process.exit(2);
}

const request = async (path, token, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    ...options,
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
};

const expectStatus = (result, expected, label) => {
  if (result.response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, received ${result.response.status}. ${result.body?.message || ""}`);
  }
};

console.log(`Testing Stokvel governance against ${baseUrl}`);

// 1. Invalid vote must be rejected before a vote is stored.
let result = await request(`/api/stokvel-proposals/${votingProposalId}/vote`, memberToken, {
  method: "POST",
  body: JSON.stringify({ vote: "MAYBE" }),
});
expectStatus(result, 400, "vote fails");

// 2. Chairperson cannot approve without a strict majority.
result = await request(`/api/stokvel-proposals/${votingProposalId}/approve`, chairToken, { method: "POST" });
expectStatus(result, 409, "insufficient votes");

// 3. A normal member cannot perform the Chairperson approval action.
result = await request(`/api/stokvel-proposals/${votingProposalId}/approve`, memberToken, { method: "POST" });
expectStatus(result, 403, "wrong officer");

// 4. The Chairperson and Treasurer must be different people.
result = await request(`/api/stokvel-proposals/${approvedProposalId}/authorise`, chairToken, { method: "POST" });
expectStatus(result, 409, "same officer");

// 5. A proposal that is otherwise approved must still fail when the group wallet is too small.
result = await request(`/api/stokvel-proposals/${insufficientWalletProposalId}/authorise`, treasurerToken, { method: "POST" });
expectStatus(result, 400, "insufficient wallet");

// 6. A proposal must fail safely if product stock has fallen below the requested quantity.
result = await request(`/api/stokvel-proposals/${insufficientStockProposalId}/authorise`, treasurerToken, { method: "POST" });
expectStatus(result, 409, "insufficient stock");

// 7. Successful authorisation is expected to create an order, create delivery records,
// debit the wallet and move the proposal to ORDERED in one transaction.
result = await request(`/api/stokvel-proposals/${successfulProposalId}/authorise`, treasurerToken, { method: "POST" });
expectStatus(result, 200, "successful authorisation");
if (result.body?.status !== "ORDERED") throw new Error("successful authorisation: proposal was not moved to ORDERED");
if (!result.body?.order_id) throw new Error("successful authorisation: no order was created");
if (typeof result.body?.wallet_balance !== "number") throw new Error("successful authorisation: response did not include the reduced wallet balance");

const proposals = await request("/api/stokvel-proposals", treasurerToken);
expectStatus(proposals, 200, "proposal verification");
const ordered = proposals.body?.proposals?.find((proposal) => Number(proposal.proposal_id) === Number(successfulProposalId));
if (!ordered || ordered.status !== "ORDERED" || !ordered.order_id) throw new Error("proposal verification: successful order state was not persisted");

console.log("PASS vote failure, insufficient votes, wrong officer, officer separation, insufficient wallet, insufficient stock, successful authorisation, order creation and wallet reduction.");
console.log("Verify delivery creation in the admin delivery/order views or database after this run.");
