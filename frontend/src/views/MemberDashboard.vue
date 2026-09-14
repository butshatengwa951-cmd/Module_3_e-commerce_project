
<template>
<div class="member-page" :class="theme">
  <section class="member-header">
    <div>
      <div class="page-label">🤝 MEMBER DASHBOARD • UNITY</div>
      <h1>Welcome back.</h1>
      <p>{{ group.stokvel_name || "Eastleigh Savers • 8 members" }} • Township strong • DM Mono + Space Grotesk</p>
    </div>
    <div class="group-badge"><span></span> ACTIVE • R{{ contributionTotal.toFixed(0) }} / R{{ goalAmount.toFixed(0) }}</div>
  </section>

  <section class="dashboard-content">
    <div class="goal-card">
      <div class="goal-top">
        <div><span>🤝 GROUP SHOPPING GOAL • UNITY SAVINGS</span><h2>R{{ contributionTotal.toFixed(2) }}</h2></div>
        <div class="goal-target">Goal<strong>R{{ goalAmount.toFixed(2) }}</strong></div>
      </div>
      <div class="progress-background"><div class="progress" :style="{ width: progress + '%' }"></div></div>
      <div class="goal-bottom"><span>{{ progress.toFixed(0) }}% complete • {{ members.length || 8 }} hands joined 🤝</span><span>R{{ remaining.toFixed(2) }} remaining</span></div>
      <div class="hands-row">Joined 🤝🤝🤝🤝🤝🤝🤝🤝 • 8/8 contributed this month • Trust circle</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span>GROUP</span><strong>{{ group.stokvel_name || "Eastleigh Savers" }}</strong><small>Your stokvel • Township</small></div>
      <div class="stat-card purple"><span>MEMBERS</span><strong>{{ members.length || 8 }}</strong><small>Hands united • Unity</small></div>
      <div class="stat-card brown"><span>PRODUCTS</span><strong>{{ productsAvailable || 24 }}</strong><small>Best price comparison • Real images</small></div>
    </div>

    <div class="dashboard-grid">
      <div class="panel">
        <div class="panel-header"><span>YOUR GROUP • UNITY</span><h2>Member Contributions 🤝</h2></div>
        <div v-if="members.length" class="members-list">
          <div v-for="(m,i) in members" :key="m.user_id||i" class="member-row">
            <div class="avatar">{{ getInitials(m) }}</div>
            <div class="member-name"><strong>{{ m.full_name||m.member_name||'Member '+(i+1) }}</strong><span>Group member • Verified • Gauteng</span></div>
            <div class="member-contribution">R{{ Number(m.contribution_amount||m.amount||90+i*10).toFixed(2) }}</div>
          </div>
        </div>
        <div v-else class="members-list">
          <div v-for="i in 8" :key="i" class="member-row"><div class="avatar">{{ String.fromCharCode(64+i) }}</div><div class="member-name"><strong>Member {{i}}</strong><span>Active • Township • DM Mono</span></div><div class="member-contribution">R{{ (80+i*10).toFixed(2) }}</div></div>
        </div>
      </div>

      <div class="panel contribution-panel">
        <div class="panel-header"><span>ADD MONEY • UNITY</span><h2>Make a Contribution</h2></div>
        <p>Add your contribution towards group's next bulk purchase. When we save together, we grow together 🤝</p>
        <form @submit.prevent="submitContribution">
          <label>Contribution Amount</label>
          <div class="amount-input"><span>R</span><input v-model.number="contributionAmount" type="number" min="1" step="0.01" placeholder="0.00" required /></div>
          <button class="contribute-button" type="submit">Add Contribution →</button>
        </form>
        <div v-if="message" class="form-message">{{ message }}</div>
        <div class="trust"><small>🔒 Secure • ✓ Payout Guaranteed • 5k+ members trust • Real e-commerce</small></div>
      </div>
    </div>

    <section class="shop-banner">
      <div><span>READY TO SHOP? • SAVE 30% TOGETHER • REAL IMAGES</span><h2>Build your group's basket.</h2><p>Compare Local vs Makro vs Boxer - authentic supplier prices, real product images.</p></div>
      <RouterLink to="/catalogue" class="shop-button">Open Catalogue →</RouterLink>
    </section>
  </section>
</div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"; import { getMemberDashboard, addContribution, getProducts } from "../services/api.js"; defineProps({theme:{type:String, default:'light'}});
const group=ref({}); const members=ref([]); const productsAvailable=ref(0); const contributionTotal=ref(720); const contributionAmount=ref(0); const message=ref(""); const goalAmount=ref(1200);
const progress=computed(()=> Math.min((contributionTotal.value/goalAmount.value)*100,100)); const remaining=computed(()=> Math.max(goalAmount.value-contributionTotal.value,0));
function getInitials(m){ const n=m.full_name||m.member_name||"M"; const w=n.trim().split(" "); return w.length===1?w[0].substring(0,2).toUpperCase():(w[0][0]+w[w.length-1][0]).toUpperCase(); }
async function submitContribution(){ try{ await addContribution({card_id:1, member_name:"Current member", amount:contributionAmount.value}); contributionTotal.value+=Number(contributionAmount.value); message.value="Contribution added 🤝 Thank you!"; contributionAmount.value=0; }catch(e){ contributionTotal.value+=Number(contributionAmount.value||0); message.value="Contribution added (offline demo) 🤝"; contributionAmount.value=0; } }
async function loadDashboard(){ try{ const d=await getMemberDashboard(); group.value=d.group||{stokvel_name:"Eastleigh Savers"}; members.value=d.members||[]; contributionTotal.value=Number(d.contributionTotal||720); const prods=await getProducts(); productsAvailable.value=prods.length; }catch(e){ group.value={stokvel_name:"Eastleigh Savers"}; productsAvailable.value=24; } }
onMounted(loadDashboard);
</script>

<style scoped>
.member-page{--bg:#EDE7F6; --card:#FFFFFF; --text:#221A3A; --muted:#6B6287; --gold:#C8B019; --purple:#795D89; --line:#D4CCEC; --glow:0 8px 32px rgba(121,93,137,0.12); background:var(--bg); color:var(--text); min-height:100vh; padding-bottom:40px; font-family:"Space Grotesk";}
.member-page.dark{--bg:#130E23; --card:#241E38; --text:#EDE7F6; --muted:#9B92B5; --line:rgba(167,139,250,0.2); --glow:0 0 30px rgba(167,139,250,0.2); background:var(--bg);}
.member-header{padding:32px 24px; background:var(--card); border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:flex-end; border-radius:16px; margin:16px; box-shadow:var(--glow);}
.page-label{font-family:'DM Mono'; font-size:11px; color:var(--purple); letter-spacing:1px;}.member-header h1{font-size:38px; font-weight:800; margin:8px 0 4px;}.member-header p{color:var(--muted); font-size:12px; font-family:'DM Mono';}
.group-badge{font-family:'DM Mono'; font-size:11px; display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--line); padding:8px 12px; border-radius:20px;}.group-badge span{width:8px; height:8px; background:#22c55e; border-radius:50%; display:inline-block;}
.dashboard-content{padding:16px;}.goal-card{background:#1A102E; color:white; padding:24px; border-radius:16px; box-shadow:var(--glow);}.goal-top{display:flex; justify-content:space-between; gap:20px;}.goal-top span{font-family:'DM Mono'; font-size:11px; color:rgba(255,255,255,0.6);}.goal-top h2{font-size:36px; margin:8px 0; color:var(--gold);}.goal-target{text-align:right; font-family:'DM Mono'; font-size:11px; color:rgba(255,255,255,0.6);}.goal-target strong{display:block; color:var(--gold); font-size:20px; margin-top:4px;}.progress-background{height:10px; background:rgba(255,255,255,0.15); border-radius:10px; overflow:hidden; margin:16px 0 8px;}.progress{height:100%; background:var(--gold); border-radius:10px; transition:width 0.6s;}.goal-bottom{display:flex; justify-content:space-between; font-size:11px; color:rgba(255,255,255,0.6); font-family:'DM Mono';}.hands-row{margin-top:12px; font-size:11px; color:var(--gold); font-family:'DM Mono';}
.stats-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:16px 0;}.stat-card{background:var(--card); border:1px solid var(--line); padding:18px; border-radius:14px; box-shadow:var(--glow);}.stat-card.purple{background:var(--purple); color:white;}.stat-card.brown{background:#C2583D; color:white;}.stat-card span{font-family:'DM Mono'; font-size:10px; opacity:0.8;}.stat-card strong{font-size:18px; display:block; margin:10px 0 4px;}.stat-card small{font-size:11px; opacity:0.7;}
.dashboard-grid{display:grid; grid-template-columns:1.2fr 0.8fr; gap:16px;}.panel{background:var(--card); padding:20px; border-radius:16px; border:1px solid var(--line); box-shadow:var(--glow);}.panel-header span{font-family:'DM Mono'; font-size:10px; color:var(--purple);}.panel-header h2{font-size:16px; margin:6px 0 16px;}
.members-list{display:flex; flex-direction:column;}.member-row{display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--line);}.avatar{width:36px; height:36px; border-radius:50%; background:var(--purple); color:white; display:grid; place-items:center; font-size:11px; font-weight:700;}.member-name{flex:1; display:flex; flex-direction:column;}.member-name strong{font-size:12px;}.member-name span{font-size:10px; color:var(--muted); font-family:'DM Mono';}.member-contribution{font-weight:700; font-size:12px; color:var(--gold);}
.contribution-panel p{color:var(--muted); font-size:12px; line-height:1.5;}.contribution-panel label{font-family:'DM Mono'; font-size:10px; color:var(--muted); margin:16px 0 6px; display:block;}.amount-input{display:flex; align-items:center; border:1px solid var(--line); border-radius:10px; padding:0 12px; background:var(--bg);}.amount-input span{font-weight:700;}.amount-input input{width:100%; border:none; background:transparent; outline:none; padding:12px 8px; color:var(--text); font-size:16px; font-family:"Space Grotesk";}.contribute-button{width:100%; margin-top:12px; padding:12px; border:none; border-radius:10px; background:var(--gold); color:#221A3A; font-weight:700; cursor:pointer; font-family:"Space Grotesk";}.form-message{margin-top:12px; padding:10px; background:rgba(34,197,94,0.1); color:#16a34a; border-radius:8px; font-size:12px;}.trust{margin-top:12px; text-align:center; color:var(--muted); font-size:10px; font-family:'DM Mono';}
.shop-banner{margin-top:16px; padding:24px; background:var(--purple); color:white; border-radius:16px; display:flex; justify-content:space-between; align-items:center; gap:20px;}.shop-banner span{font-family:'DM Mono'; font-size:10px; opacity:0.7;}.shop-banner h2{font-size:22px; margin:6px 0;}.shop-banner p{opacity:0.8; font-size:12px;}.shop-button{padding:12px 20px; border:1px solid white; border-radius:24px; color:white; text-decoration:none; font-size:13px; white-space:nowrap;}.shop-button:hover{background:white; color:var(--purple);}
@media(max-width:900px){.dashboard-grid{grid-template-columns:1fr;}.stats-grid{grid-template-columns:1fr;}.member-header{flex-direction:column; align-items:flex-start; gap:12px;}}
</style>

