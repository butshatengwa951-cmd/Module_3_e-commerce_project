<template>
  <section class="hub-page">
    <div class="hub-wrap">
      <header class="hub-hero glass">
        <div><span class="eyebrow">GROUP WALLET · MEMBER VOTING</span><h1>{{ data?.membership?.stokvel_name || 'Group Hub' }}</h1><p>Contribute to the shared wallet, set a group funding target, and vote on products your Stokvel wants to buy.</p></div>
        <div class="hero-balance"><span>AVAILABLE</span><strong>R {{ money(walletBalance) }}</strong><small>Current recorded group balance</small></div>
      </header>

      <div v-if="loading" class="state glass">Loading your group hub...</div>
      <div v-else-if="error" class="state glass error">{{ error }}</div>
      <template v-else>
        <div class="grid">
          <article class="panel glass wallet-panel">
            <div class="heading"><div><span class="label">GROUP FUNDING</span><h2>Build the group wallet</h2></div><span class="badge">{{ goalPercent }}%</span></div>
            <div class="goal-amount"><strong>R {{ money(walletBalance) }}</strong><span>of R {{ money(goalTarget) }}</span></div>
            <div class="progress"><span :style="{ width: goalPercent + '%' }"></span></div>
            <div class="goal-meta"><span>{{ goalRemaining > 0 ? `R ${money(goalRemaining)} remaining` : 'Goal reached' }}</span><span>{{ goalDeadline ? `Due ${formatDate(goalDeadline)}` : 'No deadline set' }}</span></div>
            <form class="form" @submit.prevent="submitContribution"><input v-model.number="amount" type="number" min="1" step="0.01" placeholder="Contribution amount" required><select v-model="cardId" required><option disabled value="">Choose payment method</option><option v-for="card in data.cards" :key="card.card_id" :value="card.card_id">{{ card.card_type }} •••• {{ card.last_four_digits }} — R {{ money(card.available_amount) }}</option></select><button :disabled="busy">{{ busy ? 'Processing...' : 'Add contribution' }}</button></form>
            <p v-if="message" class="success">{{ message }}</p><p v-if="actionError" class="error-text">{{ actionError }}</p>
          </article>

          <article class="panel glass goal-panel">
            <div class="heading"><div><span class="label">FUNDING GOAL</span><h2>Set the target</h2></div><span v-if="isChairperson" class="badge">CHAIRPERSON</span></div>
            <p>Choose the amount and date your group is working toward. Only the chairperson can change this target.</p>
            <form v-if="isChairperson" class="form" @submit.prevent="submitGoal"><input v-model.number="goalAmount" type="number" min="1" step="0.01" placeholder="Target amount" required><input v-model="goalDate" type="date" required><button :disabled="busy">Save funding goal</button></form>
            <div v-else class="locked">The chairperson manages the shared target and deadline.</div>
          </article>
        </div>

        <article class="panel glass voting-panel">
          <div class="heading"><div><span class="label">GROUP VOTE</span><h2>What should we buy?</h2><p>Each member can choose one product per category. Your vote replaces your previous choice in that category.</p></div><span class="badge">ONE VOTE / CATEGORY</span></div>
          <div class="vote-grid"><div v-for="category in categories" :key="category" class="vote-card"><div class="category">{{ category }}</div><div v-for="product in productsFor(category)" :key="product.product_id" class="vote-row"><div><strong>{{ product.product_name }}</strong><small>{{ product.vote_count }} group vote{{ product.vote_count === 1 ? '' : 's' }}</small></div><button :class="{ selected: product.user_voted }" @click="castVote(product.product_id)" :disabled="busy">{{ product.user_voted ? 'Voted ✓' : 'Vote' }}</button></div></div></div>
        </article>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { contributeToStokvel, getStokvelFeatures, saveStokvelGoal, voteForProduct } from "../services/api.js";
const data = ref(null); const loading = ref(true); const error = ref(""); const busy = ref(false); const amount = ref(""); const cardId = ref(""); const goalAmount = ref(""); const goalDate = ref(""); const message = ref(""); const actionError = ref("");
const money = (v) => Number(v || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (v) => v ? new Date(v).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const walletBalance = computed(() => Number(data.value?.wallet?.paid_contributions || 0) - Number(data.value?.wallet?.spent_amount || 0));
const goalTarget = computed(() => Number(data.value?.goal?.target_amount || 0));
const goalDeadline = computed(() => data.value?.goal?.deadline || "");
const goalPercent = computed(() => goalTarget.value ? Math.max(0, Math.min(100, Math.round((walletBalance.value / goalTarget.value) * 100))) : 0);
const goalRemaining = computed(() => Math.max(0, goalTarget.value - walletBalance.value));
const isChairperson = computed(() => ['chairperson','admin'].includes(data.value?.membership?.role));
const categories = computed(() => [...new Set((data.value?.votes || []).map((p) => p.category).filter(Boolean))]);
const productsFor = (category) => (data.value?.votes || []).filter((p) => p.category === category);
async function load() { loading.value = true; error.value = ""; try { data.value = await getStokvelFeatures(); if (data.value?.goal) { goalAmount.value = data.value.goal.target_amount; goalDate.value = String(data.value.goal.deadline).slice(0,10); } } catch (e) { error.value = e.response?.data?.message || "Unable to load the group hub."; } finally { loading.value = false; } }
async function run(action, success) { busy.value = true; message.value = ""; actionError.value = ""; try { await action(); await load(); message.value = success; } catch (e) { actionError.value = e.response?.data?.message || "Action failed."; } finally { busy.value = false; } }
function submitContribution() { return run(async () => { await contributeToStokvel({ card_id: Number(cardId.value), amount: Number(amount.value) }); amount.value = ""; cardId.value = ""; }, "Contribution added to the group wallet."); }
function submitGoal() { return run(() => saveStokvelGoal({ target_amount: Number(goalAmount.value), deadline: goalDate.value }), "Funding goal saved."); }
function castVote(productId) { return run(() => voteForProduct(productId), "Your group vote has been recorded."); }
onMounted(load);
</script>

<style scoped>
.hub-page{min-height:100vh;background:var(--sw-page-background);color:var(--sw-page-text)}.hub-wrap{width:min(1180px,calc(100% - 32px));margin:auto;padding:42px 0 80px}.hub-hero{display:grid;grid-template-columns:1.3fr .7fr;gap:25px;align-items:center;padding:44px;border-radius:26px;background:var(--sw-page-gradient)}.eyebrow,.label{font:800 10px var(--sw-font-body);letter-spacing:.13em;color:var(--sw-page-text-soft)}h1{margin:16px 0 12px;font:800 clamp(42px,6vw,70px)/.92 var(--sw-font-heading);letter-spacing:-.06em}h2{margin:7px 0;font:800 25px var(--sw-font-heading);letter-spacing:-.04em}.hub-hero p,.goal-panel p{max-width:650px;color:var(--sw-page-text-soft);font:14px/1.65 var(--sw-font-body)}.hero-balance{padding:28px;border:1px solid rgba(255,255,255,.18);border-radius:20px;background:rgba(255,255,255,.08)}.hero-balance span{font:800 9px var(--sw-font-body);letter-spacing:.12em}.hero-balance strong{display:block;margin:12px 0;font:800 38px var(--sw-font-heading)}.hero-balance small{color:var(--sw-page-text-soft)}.grid{display:grid;grid-template-columns:1.25fr .75fr;gap:16px;margin-top:18px}.panel{padding:24px;border-radius:20px}.heading{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.badge{padding:7px 10px;border:1px solid var(--sw-input-border);border-radius:999px;color:var(--sw-gold-500);font:800 9px var(--sw-font-body);white-space:nowrap}.goal-amount{display:flex;justify-content:space-between;align-items:end;margin:25px 0 10px}.goal-amount strong{font:800 30px var(--sw-font-heading)}.goal-amount span,.goal-meta{color:var(--sw-page-text-soft);font:11px var(--sw-font-body)}.progress{height:10px;border-radius:999px;background:var(--sw-input-border);overflow:hidden}.progress span{display:block;height:100%;background:var(--sw-gold-500);border-radius:inherit}.goal-meta{display:flex;justify-content:space-between;gap:10px;margin-top:8px}.form{display:grid;gap:10px;margin-top:22px}.form input,.form select{width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--sw-input-border);border-radius:10px;background:var(--sw-page-surface);color:var(--sw-page-text)}button{padding:12px 15px;border:0;border-radius:10px;background:var(--sw-gold-500);color:var(--sw-purple-900);font:800 10px var(--sw-font-body);cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}.success{color:#48b97a;font:11px var(--sw-font-body)}.error-text,.error{color:var(--sw-orange-600)}.locked{margin-top:25px;padding:15px;border:1px dashed var(--sw-input-border);border-radius:12px;color:var(--sw-page-text-soft);font:11px var(--sw-font-body)}.voting-panel{margin-top:18px}.voting-panel .heading p{max-width:680px;color:var(--sw-page-text-soft);font:11px/1.5 var(--sw-font-body)}.vote-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:20px}.vote-card{padding:15px;border:1px solid var(--sw-input-border);border-radius:14px;background:var(--sw-page-surface)}.category{margin-bottom:10px;color:var(--sw-purple-700);font:800 10px var(--sw-font-body);text-transform:uppercase}.vote-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-top:1px solid var(--sw-input-border)}.vote-row strong{display:block;font:700 12px var(--sw-font-body)}.vote-row small{display:block;margin-top:4px;color:var(--sw-page-text-soft);font:10px var(--sw-font-body)}.vote-row button{padding:7px 10px}.vote-row button.selected{background:var(--sw-purple-700);color:#fff}.state{margin-top:18px;padding:60px;text-align:center;border-radius:20px}.state.error{font:12px var(--sw-font-body)}@media(max-width:850px){.hub-hero,.grid{grid-template-columns:1fr}.vote-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.hub-wrap{width:min(100% - 22px,1180px);padding-top:25px}.hub-hero{padding:28px}.vote-grid{grid-template-columns:1fr}.goal-amount{align-items:flex-start;flex-direction:column;gap:5px}}
</style>
