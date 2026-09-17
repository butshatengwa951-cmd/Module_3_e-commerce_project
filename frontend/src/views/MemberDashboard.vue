<template>
  <main class="hub-page">
    <div class="hub-wrap">
      <header class="hero glass">
        <div>
          <span class="eyebrow">GROUP HUB · STOCKWELL</span>
          <h1>{{ dashboard?.stokvel?.stokvel_name || 'Your Group' }}</h1>
          <p>Manage contributions, group purchase decisions, approved spending and delivery from one place.</p>
          <div class="actions">
            <RouterLink class="primary" to="/proposals">View group decisions →</RouterLink>
            <RouterLink class="secondary" to="/catalogue">Shop together</RouterLink>
          </div>
        </div>
        <div class="orb"><span>GROUP</span><strong>HUB</strong></div>
      </header>

      <div v-if="loading" class="state glass">Loading your Group Hub...</div>
      <div v-else-if="error" class="state glass error">{{ error }}</div>

      <template v-else-if="dashboard">
        <section class="quick-grid">
          <RouterLink class="quick-card glass" to="/payment"><b>CONTRIBUTE</b><small>Add money to the shared Stokvel wallet through PayFast.</small><strong>+</strong></RouterLink>
          <RouterLink class="quick-card glass" to="/proposals"><b>GROUP DECISIONS</b><small>Review proposals and vote before group money is spent.</small><strong>→</strong></RouterLink>
          <RouterLink class="quick-card glass" to="/cart"><b>GROUP BASKET</b><small>Prepare a basket and submit it as a purchase proposal.</small><strong>→</strong></RouterLink>
          <RouterLink class="quick-card glass" to="/order-history"><b>ORDERS & DELIVERY</b><small>Follow authorised group purchases through delivery.</small><strong>→</strong></RouterLink>
        </section>

        <section class="overview-grid">
          <article class="wallet glass">
            <span class="label">SHARED WALLET</span>
            <div class="wallet-head"><div><small>AVAILABLE TO THE GROUP</small><strong>R {{ money(dashboard.wallet.available_balance) }}</strong></div><div class="ring">{{ walletPercent }}%</div></div>
            <div class="progress"><span :style="{width: walletPercent + '%'}"></span></div>
            <div class="meta"><span>R {{ money(dashboard.wallet.paid_contributions) }} contributed</span><span>R {{ money(dashboard.wallet.spent_amount) }} spent</span></div>
            <p>Wallet funds are not spent from the shopping cart. An approved proposal must be authorised by the Stokvel treasurer before funds are released.</p>
            <RouterLink class="text" to="/payment">Add a contribution →</RouterLink>
          </article>

          <article class="goal glass">
            <span class="label">GROUP PROGRESS</span>
            <h2>{{ goal ? 'Shared funding goal' : 'Set a group goal' }}</h2>
            <p>{{ goal?.deadline ? `Target deadline: ${formatDate(goal.deadline)}` : 'Set a target so members can coordinate saving and group purchases.' }}</p>
            <div class="goal-numbers"><strong>R {{ money(goalCurrent) }}</strong><span>of R {{ money(goalTarget) }}</span></div>
            <div class="progress"><span :style="{width: goalPercent + '%'}"></span></div>
            <div class="meta"><span>{{ goalPercent }}% funded</span><span>{{ memberCount }} members</span></div>
            <button v-if="canManageGoal" class="secondary full" @click="showGoal = true">Manage group goal</button>
            <small v-else-if="isChairperson" class="permission-note">The Treasurer manages the shared funding goal.</small>
          </article>
        </section>

        <section class="decision glass">
          <div class="section-title"><div><span class="label">THE PURCHASE FLOW</span><h2>How group spending works.</h2><p>StockWell separates shopping from the decision to spend shared funds.</p></div><RouterLink class="text" to="/proposals">Open proposals →</RouterLink></div>
          <div class="flow">
            <div><b>01</b><strong>Contribute</strong><small>Members fund the shared wallet.</small></div>
            <div><b>02</b><strong>Propose</strong><small>A basket becomes a purchase proposal.</small></div>
            <div><b>03</b><strong>Vote</strong><small>Members approve or reject the proposal.</small></div>
            <div><b>04</b><strong>Approve</strong><small>The Chairperson approves a proposal after the member vote.</small></div>
            <div><b>05</b><strong>Authorise & deliver</strong><small>The Treasurer authorises the approved purchase and releases group funds for delivery.</small></div>
          </div>
        </section>

        <section class="activity-grid">
          <article class="panel glass">
            <div class="section-title compact"><div><span class="label">MEMBER ACTIVITY</span><h2>Recent contributions.</h2></div><span class="pill">{{ dashboard.contributions.length }} records</span></div>
            <div v-if="dashboard.contributions.length">
              <div v-for="item in dashboard.contributions.slice(0,6)" :key="item.contribution_id" class="row"><span class="avatar">{{ initials(item.full_name) }}</span><div><b>{{ item.full_name }}</b><small>{{ formatDate(item.contribution_date) }} · {{ item.payment_status }}</small></div><strong>R {{ money(item.amount) }}</strong></div>
            </div>
            <div v-else class="empty-inline">No contributions recorded yet.</div>
          </article>
          <article class="panel glass">
            <div class="section-title compact"><div><span class="label">GROUP MEMBERS</span><h2>Contributors.</h2></div><span class="pill">{{ memberCount }}</span></div>
            <div v-for="member in dashboard.members.slice(0,6)" :key="member.user_id" class="row"><span class="avatar">{{ initials(member.full_name) }}</span><div><b>{{ member.full_name }}</b><small>{{ member.role }}</small></div><strong>R {{ money(member.paid_contributions) }}</strong></div>
          </article>
        </section>
      </template>

      <div v-if="showGoal" class="backdrop" @click.self="showGoal=false">
        <form class="modal glass" @submit.prevent="saveGoal">
          <button class="close" type="button" @click="showGoal=false">×</button>
          <span class="label">GROUP GOAL</span><h2>Set a shared target.</h2>
          <input v-model.number="goalForm.target_amount" type="number" min="1" step="0.01" placeholder="Target amount (R)" required>
          <input v-model="goalForm.deadline" type="date" required>
          <button class="primary full" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save goal →' }}</button>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { getMemberDashboard, getStokvelFeatures, saveStokvelGoal } from "../services/api.js";

const dashboard = ref(null);
const features = ref(null);
const loading = ref(true);
const error = ref("");
const saving = ref(false);
const showGoal = ref(false);
const goalForm = ref({ target_amount: null, deadline: "" });

const money = (value) => Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const initials = (value) => String(value || "Member").split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
const memberCount = computed(() => dashboard.value?.members?.length || 0);
const goal = computed(() => features.value?.goal || null);
const goalCurrent = computed(() => Number(dashboard.value?.wallet?.paid_contributions || 0));
const goalTarget = computed(() => Number(goal.value?.target_amount || 0));
const goalPercent = computed(() => goalTarget.value ? Math.min(100, Math.round(goalCurrent.value / goalTarget.value * 100)) : 0);
const walletPercent = computed(() => {
  const total = Number(dashboard.value?.wallet?.paid_contributions || 0);
  const available = Number(dashboard.value?.wallet?.available_balance || 0);
  return total ? Math.max(0, Math.min(100, Math.round(available / total * 100))) : 0;
});
const stokvelRole = computed(() => String(features.value?.membership?.stokvel_role || "").toUpperCase());
const canManageGoal = computed(() => stokvelRole.value === "TREASURER");
const isChairperson = computed(() => stokvelRole.value === "CHAIRPERSON");

async function load() {
  loading.value = true;
  error.value = "";
  try { [dashboard.value, features.value] = await Promise.all([getMemberDashboard(), getStokvelFeatures()]); }
  catch (e) { console.error(e); error.value = e.response?.data?.message || "Unable to load your Group Hub."; }
  finally { loading.value = false; }
}

async function saveGoal() {
  saving.value = true;
  try { await saveStokvelGoal({ targetAmount: goalForm.value.target_amount, deadline: goalForm.value.deadline }); showGoal.value = false; await load(); }
  catch (e) { alert(e.response?.data?.message || "Goal could not be saved."); }
  finally { saving.value = false; }
}

onMounted(load);
</script>

<style scoped>
.hub-page{min-height:100vh;background:var(--sw-page-background);color:var(--sw-page-text)}.hub-wrap{width:min(1180px,calc(100% - 32px));margin:auto;padding:40px 0 80px}.glass{background:var(--sw-glass-light);border:1px solid var(--sw-glass-light-border);box-shadow:var(--sw-glass-shadow-light);backdrop-filter:blur(var(--sw-glass-blur));border-radius:22px}.hero{min-height:310px;padding:45px 50px;display:grid;grid-template-columns:1fr 230px;gap:30px;align-items:center;background:var(--sw-page-gradient)}.eyebrow,.label{font:800 10px var(--sw-font-body);letter-spacing:.14em;color:var(--sw-purple-700)}.eyebrow{display:inline-block;padding:8px 12px;border:1px solid var(--sw-input-border);border-radius:99px}.hero h1{font:800 clamp(44px,7vw,74px)/.9 var(--sw-font-heading);letter-spacing:-.07em;margin:20px 0 14px}.hero p,.wallet p,.goal p,.decision p{color:var(--sw-page-text-soft);line-height:1.7}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.primary,.secondary,.text{font:800 11px var(--sw-font-body);text-decoration:none;cursor:pointer}.primary{display:inline-flex;justify-content:center;padding:13px 18px;border:0;border-radius:10px;background:var(--sw-gold-500);color:#17120a}.secondary{padding:12px 17px;border:1px solid var(--sw-input-border);border-radius:10px;background:transparent;color:var(--sw-page-text)}.text{color:var(--sw-purple-700)}.orb{height:210px;width:210px;border:1px solid var(--sw-input-border);border-radius:50%;display:grid;place-items:center;align-content:center;justify-self:center}.orb span{font:800 9px var(--sw-font-body);letter-spacing:.15em;color:var(--sw-page-text-soft)}.orb strong{font:800 45px var(--sw-font-heading);color:var(--sw-gold-500)}.quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.quick-card{min-height:105px;padding:18px;display:flex;flex-direction:column;gap:8px;color:var(--sw-page-text);text-decoration:none}.quick-card b{font:800 10px var(--sw-font-body);letter-spacing:.08em}.quick-card small{flex:1;color:var(--sw-page-text-soft);font:10px/1.5 var(--sw-font-body)}.quick-card strong{color:var(--sw-gold-500)}.overview-grid,.activity-grid{display:grid;grid-template-columns:1.3fr .9fr;gap:16px;margin-top:18px}.wallet,.goal,.panel{padding:25px}.wallet-head{display:flex;justify-content:space-between;align-items:center;margin-top:20px}.wallet-head small{display:block;color:var(--sw-page-text-soft);font:800 9px var(--sw-font-body)}.wallet-head strong{display:block;font:800 38px var(--sw-font-heading);margin-top:7px}.ring{width:68px;height:68px;border-radius:50%;border:7px solid var(--sw-gold-500);display:grid;place-items:center;font:800 12px var(--sw-font-body)}.progress{height:7px;background:rgba(128,128,128,.14);border-radius:99px;overflow:hidden;margin-top:22px}.progress span{height:100%;display:block;background:var(--sw-gold-500)}.meta{display:flex;justify-content:space-between;gap:12px;margin-top:8px;color:var(--sw-page-text-soft);font:9px var(--sw-font-body)}.wallet p,.goal p{font:11px/1.6 var(--sw-font-body);margin:20px 0 12px}.goal h2,.decision h2,.panel h2{font:800 27px var(--sw-font-heading);margin:10px 0}.goal-numbers{display:flex;align-items:end;gap:7px;margin-top:20px}.goal-numbers strong{font:800 25px var(--sw-font-heading)}.goal-numbers span{font:10px var(--sw-font-body);color:var(--sw-page-text-soft)}.full{width:100%;margin-top:15px;box-sizing:border-box}.permission-note{display:block;margin-top:15px;color:var(--sw-page-text-muted);font:10px/1.5 var(--sw-font-body)}.decision{margin-top:42px;padding:25px}.section-title{display:flex;justify-content:space-between;align-items:end;gap:20px}.section-title.compact{align-items:center}.section-title p{margin:6px 0;color:var(--sw-page-text-soft);font:11px var(--sw-font-body)}.flow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:22px}.flow>div{padding:17px;border:1px solid var(--sw-input-border);border-radius:14px}.flow b{display:block;color:var(--sw-gold-500);font:800 10px var(--sw-font-body)}.flow strong{display:block;margin-top:9px;font:800 14px var(--sw-font-body)}.flow small{display:block;margin-top:5px;color:var(--sw-page-text-soft);font:10px/1.5 var(--sw-font-body)}.activity-grid{margin-top:18px}.pill{font:800 9px var(--sw-font-body);padding:6px 9px;border-radius:99px;background:rgba(121,93,137,.1);color:var(--sw-purple-700)}.row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;padding:13px 0;border-bottom:1px solid var(--sw-input-border)}.row:last-child{border:0}.avatar{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:rgba(121,93,137,.1);border:1px solid var(--sw-input-border);color:var(--sw-gold-500);font:800 9px var(--sw-font-body)}.row b{display:block;font:700 11px var(--sw-font-body)}.row small{display:block;margin-top:4px;color:var(--sw-page-text-soft);font:9px var(--sw-font-body)}.row>strong{font:800 11px var(--sw-font-body)}.state{padding:55px;text-align:center;margin-top:18px}.error{color:#d86f61}.empty-inline{padding:30px 0;color:var(--sw-page-text-soft);font:11px var(--sw-font-body)}.backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50;display:grid;place-items:center;padding:20px}.modal{width:min(430px,100%);padding:28px;position:relative}.modal h2{font:800 30px var(--sw-font-heading);margin:10px 0}.modal input{width:100%;box-sizing:border-box;margin-top:10px;padding:12px;border:1px solid var(--sw-input-border);border-radius:10px;background:var(--sw-input-background);color:var(--sw-input-text)}.close{position:absolute;top:12px;right:14px;border:0;background:transparent;color:var(--sw-page-text);font-size:25px;cursor:pointer}@media(max-width:900px){.quick-grid{grid-template-columns:1fr 1fr}.flow{grid-template-columns:1fr 1fr}.hero{grid-template-columns:1fr}.orb{display:none}}@media(max-width:600px){.hub-wrap{padding-top:20px}.hero{padding:30px 25px}.quick-grid,.overview-grid,.activity-grid{grid-template-columns:1fr}.flow{grid-template-columns:1fr}.section-title{align-items:flex-start;flex-direction:column}}
</style>
