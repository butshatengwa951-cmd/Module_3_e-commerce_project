import pool from "../config/db.js";

const getMembership = async (userId, db = pool) => {
  const [rows] = await db.query(
    `SELECT sm.stokvel_member_id,sm.stokvel_id,sm.user_id,
            COALESCE(smr.stokvel_role,'MEMBER') AS stokvel_role,
            s.stokvel_name
     FROM stokvel_members sm
     INNER JOIN stokvels s ON s.stokvel_id=sm.stokvel_id
     LEFT JOIN stokvel_member_roles smr ON smr.stokvel_member_id=sm.stokvel_member_id
     WHERE sm.user_id=? LIMIT 1`,
    [userId]
  );
  return rows[0]||null;
};
const assertMember=async(userId,db=pool)=>{const membership=await getMembership(userId,db);if(!membership)throw Object.assign(new Error("You are not a member of a Stokvel."),{statusCode:403});return membership;};
const assertOfficer=(membership)=>{if(!["CHAIRPERSON","TREASURER"].includes(String(membership.stokvel_role).toUpperCase()))throw Object.assign(new Error("Only the Stokvel chairperson or treasurer can perform this action."),{statusCode:403});};

export const getProposalDashboard=async(userId)=>{
  const membership=await assertMember(userId);
  const [proposals]=await pool.query(`SELECT p.proposal_id,p.title,p.description,p.delivery_address,p.delivery_mode,p.status,p.voting_deadline,p.created_at,p.updated_at,p.created_by,p.approved_at,p.approved_by,p.authorised_at,p.authorised_by,p.order_id,u.full_name AS created_by_name,COALESCE((SELECT COUNT(*) FROM stokvel_purchase_proposal_votes v1 WHERE v1.proposal_id=p.proposal_id AND v1.vote='APPROVE'),0) approve_votes,COALESCE((SELECT COUNT(*) FROM stokvel_purchase_proposal_votes v2 WHERE v2.proposal_id=p.proposal_id AND v2.vote='REJECT'),0) reject_votes,(SELECT v3.vote FROM stokvel_purchase_proposal_votes v3 WHERE v3.proposal_id=p.proposal_id AND v3.user_id=? LIMIT 1) my_vote FROM stokvel_purchase_proposals p INNER JOIN users u ON u.user_id=p.created_by WHERE p.stokvel_id=? ORDER BY p.created_at DESC`,[userId,membership.stokvel_id]);
  const ids=proposals.map(p=>p.proposal_id);let items=[];if(ids.length)[items]=await pool.query(`SELECT i.proposal_id,i.proposal_item_id,i.product_id,p.product_name,p.category,i.supplier_price_id,sp.supplier_name,i.quantity,i.unit_price,i.subtotal FROM stokvel_purchase_proposal_items i INNER JOIN products p ON p.product_id=i.product_id INNER JOIN supplier_prices sp ON sp.supplier_price_id=i.supplier_price_id WHERE i.proposal_id IN (?) ORDER BY i.proposal_id DESC,i.proposal_item_id ASC`,[ids]);
  const [wallet]=await pool.query(`SELECT balance FROM stokvel_wallets WHERE stokvel_id=? LIMIT 1`,[membership.stokvel_id]);
  return{membership,wallet_balance:Number(wallet[0]?.balance||0),proposals:proposals.map(p=>({...p,approve_votes:Number(p.approve_votes||0),reject_votes:Number(p.reject_votes||0),items:items.filter(i=>i.proposal_id===p.proposal_id)}))};
};

export const createProposal=async({userId,title,description,delivery_address,delivery_mode="GROUP",items})=>{
  const membership=await assertMember(userId);const mode=delivery_mode==="INDIVIDUAL"?"INDIVIDUAL":"GROUP";
  if(!title?.trim())throw Object.assign(new Error("A proposal title is required."),{statusCode:400});
  if(!Array.isArray(items)||!items.length)throw Object.assign(new Error("Add at least one product to the proposal."),{statusCode:400});
  if(mode==="GROUP"&&!delivery_address?.trim())throw Object.assign(new Error("A group delivery address is required."),{statusCode:400});
  const db=await pool.getConnection();try{await db.beginTransaction();const[proposal]=await db.query(`INSERT INTO stokvel_purchase_proposals (stokvel_id,created_by,title,description,delivery_address,delivery_mode,status,voting_deadline) VALUES (?,?,?,?,?,?,'VOTING',DATE_ADD(NOW(),INTERVAL 48 HOUR))`,[membership.stokvel_id,userId,title.trim(),description?.trim()||null,mode==="GROUP"?delivery_address.trim():null,mode]);
    for(const raw of items){const productId=Number(raw.product_id),supplierPriceId=Number(raw.supplier_price_id),quantity=Number(raw.quantity);if(!Number.isInteger(productId)||!Number.isInteger(supplierPriceId)||!Number.isInteger(quantity)||quantity<1)throw Object.assign(new Error("Proposal items contain invalid data."),{statusCode:400});const[prices]=await db.query(`SELECT supplier_price_id,product_id,price FROM supplier_prices WHERE supplier_price_id=? AND product_id=? LIMIT 1`,[supplierPriceId,productId]);if(!prices.length)throw Object.assign(new Error("One of the selected supplier prices is no longer available."),{statusCode:400});const unitPrice=Number(prices[0].price),subtotal=Number((unitPrice*quantity).toFixed(2));await db.query(`INSERT INTO stokvel_purchase_proposal_items (proposal_id,product_id,supplier_price_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)`,[proposal.insertId,productId,supplierPriceId,quantity,unitPrice,subtotal]);}
    await db.commit();return{proposal_id:proposal.insertId,status:"VOTING"};
  }catch(e){await db.rollback();throw e}finally{db.release()}
};

export const castProposalVote=async({userId,proposalId,vote})=>{const membership=await assertMember(userId);if(!["APPROVE","REJECT"].includes(vote))throw Object.assign(new Error("Vote must be APPROVE or REJECT."),{statusCode:400});const[p]=await pool.query(`SELECT proposal_id,status,voting_deadline FROM stokvel_purchase_proposals WHERE proposal_id=? AND stokvel_id=? LIMIT 1`,[proposalId,membership.stokvel_id]);if(!p.length)throw Object.assign(new Error("Purchase proposal not found."),{statusCode:404});if(p[0].status!=="VOTING")throw Object.assign(new Error("This proposal is no longer open for voting."),{statusCode:409});if(p[0].voting_deadline&&new Date(p[0].voting_deadline)<new Date())throw Object.assign(new Error("The voting period has ended."),{statusCode:409});await pool.query(`INSERT INTO stokvel_purchase_proposal_votes (proposal_id,user_id,vote) VALUES (?,?,?) ON DUPLICATE KEY UPDATE vote=VALUES(vote),updated_at=CURRENT_TIMESTAMP`,[proposalId,userId,vote]);return{proposal_id:proposalId,vote};};

export const approveProposal=async({userId,proposalId})=>{const membership=await assertMember(userId);assertOfficer(membership);const db=await pool.getConnection();try{await db.beginTransaction();const[rows]=await db.query(`SELECT p.*, (SELECT COUNT(DISTINCT sm.user_id) FROM stokvel_members sm WHERE sm.stokvel_id=p.stokvel_id) AS member_count, (SELECT COUNT(*) FROM stokvel_purchase_proposal_votes v WHERE v.proposal_id=p.proposal_id AND v.vote='APPROVE') AS approve_votes, (SELECT COUNT(*) FROM stokvel_purchase_proposal_votes v WHERE v.proposal_id=p.proposal_id AND v.vote='REJECT') AS reject_votes FROM stokvel_purchase_proposals p WHERE p.proposal_id=? AND p.stokvel_id=? FOR UPDATE`,[proposalId,membership.stokvel_id]);if(!rows.length)throw Object.assign(new Error("Purchase proposal not found."),{statusCode:404});const p=rows[0],required=Math.floor(Number(p.member_count)/2)+1;if(p.status!=="VOTING")throw Object.assign(new Error("Only proposals in voting can be approved."),{statusCode:409});if(Number(p.approve_votes)<required||Number(p.approve_votes)<=Number(p.reject_votes))throw Object.assign(new Error(`A majority is required. ${required} approval votes are needed.`),{statusCode:409});await db.query(`UPDATE stokvel_purchase_proposals SET status='APPROVED',approved_at=NOW(),approved_by=? WHERE proposal_id=?`,[userId,proposalId]);await db.commit();return{proposal_id:proposalId,status:"APPROVED"};}catch(e){await db.rollback();throw e}finally{db.release()}};

const makeIndividualAllocations=async(db,proposalId,stokvelId)=>{
  const[members]=await db.query(`SELECT sm.stokvel_member_id,sm.user_id,a.address_id FROM stokvel_members sm LEFT JOIN stokvel_member_addresses a ON a.stokvel_member_id=sm.stokvel_member_id AND a.is_default=1 WHERE sm.stokvel_id=? ORDER BY sm.stokvel_member_id ASC FOR UPDATE`,[stokvelId]);
  if(!members.length)throw Object.assign(new Error("The Stokvel has no members."),{statusCode:400});
  if(members.some(m=>!m.address_id))throw Object.assign(new Error("Every Stokvel member must have a default delivery address before an individual-delivery purchase can be authorised."),{statusCode:400});
  const[items]=await db.query(`SELECT proposal_item_id,quantity FROM stokvel_purchase_proposal_items WHERE proposal_id=? ORDER BY proposal_item_id ASC FOR UPDATE`,[proposalId]);
  for(const item of items){const quantity=Number(item.quantity),base=Math.floor(quantity/members.length),remainder=quantity%members.length;if(quantity<members.length)throw Object.assign(new Error("Each product must have at least one unit per member for individual delivery."),{statusCode:400});for(let index=0;index<members.length;index++){const share=base+(index<remainder?1:0);if(share>0)await db.query(`INSERT INTO stokvel_purchase_proposal_allocations (proposal_id,proposal_item_id,stokvel_member_id,address_id,quantity) VALUES (?,?,?,?,?)`,[proposalId,item.proposal_item_id,members[index].stokvel_member_id,members[index].address_id,share]);}}
};

export const authoriseProposal=async({userId,proposalId})=>{
  const membership=await assertMember(userId);assertOfficer(membership);const db=await pool.getConnection();
  try{await db.beginTransaction();
    const[rows]=await db.query(`SELECT proposal_id,stokvel_id,created_by,status,delivery_address,delivery_mode FROM stokvel_purchase_proposals WHERE proposal_id=? AND stokvel_id=? FOR UPDATE`,[proposalId,membership.stokvel_id]);
    if(!rows.length)throw Object.assign(new Error("Purchase proposal not found."),{statusCode:404});const proposal=rows[0];if(proposal.status!=="APPROVED")throw Object.assign(new Error("Only an approved proposal can be authorised."),{statusCode:409});if(proposal.delivery_mode==="GROUP"&&!proposal.delivery_address)throw Object.assign(new Error("A group delivery address is required before authorisation."),{statusCode:400});
    const[items]=await db.query(`SELECT i.*,p.quantity_available,p.product_name FROM stokvel_purchase_proposal_items i INNER JOIN products p ON p.product_id=i.product_id WHERE i.proposal_id=? FOR UPDATE`,[proposalId]);if(!items.length)throw Object.assign(new Error("The proposal has no items."),{statusCode:400});
    if(proposal.delivery_mode==="INDIVIDUAL")await makeIndividualAllocations(db,proposalId,membership.stokvel_id);
    const total=Number(items.reduce((s,i)=>s+Number(i.subtotal),0).toFixed(2));for(const item of items){if(Number(item.quantity)>Number(item.quantity_available))throw Object.assign(new Error(`${item.product_name} no longer has enough stock.`),{statusCode:409});}
    const[wallets]=await db.query(`SELECT wallet_id,balance FROM stokvel_wallets WHERE stokvel_id=? FOR UPDATE`,[membership.stokvel_id]);if(!wallets.length)throw Object.assign(new Error("The Stokvel wallet has not been set up yet."),{statusCode:503});const balance=Number(wallets[0].balance);if(balance<total)throw Object.assign(new Error(`Insufficient group wallet funds. Available: R ${balance.toFixed(2)}. Required: R ${total.toFixed(2)}.`),{statusCode:400});
    const[order]=await db.query(`INSERT INTO order_details (user_id,stokvel_id,card_id,delivery_id,total_amount,order_status) VALUES (?, ?, NULL, NULL, ?, 'Processing')`,[proposal.created_by,membership.stokvel_id,total]);
    if(proposal.delivery_mode==="GROUP"){
      const[delivery]=await db.query(`INSERT INTO delivery_details (delivery_address,transport_type,delivery_status) VALUES (?,'Van','Pending')`,[proposal.delivery_address]);
      await db.query(`UPDATE order_details SET delivery_id=? WHERE order_id=?`,[delivery.insertId,order.insertId]);
      await db.query(`INSERT INTO order_deliveries (order_id,delivery_id,stokvel_member_id) VALUES (?,?,NULL)`,[order.insertId,delivery.insertId]);
    }else{
      const[allocations]=await db.query(`SELECT a.stokvel_member_id,a.address_id,a.quantity,m.user_id,CONCAT(a2.address_line_1,IF(a2.address_line_2 IS NULL,'',CONCAT(', ',a2.address_line_2)),', ',a2.city,', ',a2.province,' ',a2.postal_code) AS full_address,a2.phone_number FROM stokvel_purchase_proposal_allocations a INNER JOIN stokvel_members m ON m.stokvel_member_id=a.stokvel_member_id INNER JOIN stokvel_member_addresses a2 ON a2.address_id=a.address_id WHERE a.proposal_id=? ORDER BY a.stokvel_member_id ASC`,[proposalId]);
      const grouped=new Map();for(const row of allocations){if(!grouped.has(row.stokvel_member_id))grouped.set(row.stokvel_member_id,row);}
      for(const row of grouped.values()){const[delivery]=await db.query(`INSERT INTO delivery_details (delivery_address,transport_type,driver_contact,delivery_status) VALUES (?,'Van',?,'Pending')`,[row.full_address,row.phone_number||null]);await db.query(`INSERT INTO order_deliveries (order_id,delivery_id,stokvel_member_id) VALUES (?,?,?)`,[order.insertId,delivery.insertId,row.stokvel_member_id]);}
    }
    for(const item of items){await db.query(`UPDATE products SET quantity_available=quantity_available-? WHERE product_id=?`,[item.quantity,item.product_id]);await db.query(`INSERT INTO order_items (order_id,product_id,supplier_price_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)`,[order.insertId,item.product_id,item.supplier_price_id,item.quantity,item.unit_price,item.subtotal]);}
    await db.query(`UPDATE stokvel_wallets SET balance=balance-? WHERE wallet_id=?`,[total,wallets[0].wallet_id]);await db.query(`INSERT INTO stokvel_wallet_transactions (stokvel_id,user_id,transaction_type,amount,reference_id,description) VALUES (?,?,'PURCHASE',?,?,?)`,[membership.stokvel_id,userId,total,order.insertId,`Authorised ${proposal.delivery_mode.toLowerCase()} group purchase proposal #${proposalId}`]);await db.query(`UPDATE stokvel_purchase_proposals SET status='ORDERED',authorised_at=NOW(),authorised_by=?,order_id=? WHERE proposal_id=?`,[userId,order.insertId,proposalId]);await db.commit();return{proposal_id:proposalId,status:"ORDERED",order_id:order.insertId,wallet_balance:Number((balance-total).toFixed(2))};
  }catch(e){await db.rollback();throw e}finally{db.release()}
};
