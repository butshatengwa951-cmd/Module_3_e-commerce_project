<template>
  <section class="dashboard-page">
    <div class="dashboard-wrap">
      <header class="dashboard-hero glass">
        <div class="hero-copy">
          <div class="eyebrow"><span>●</span> MEMBER HUB</div>
          <h1>{{ dashboard?.stokvel?.stokvel_name || 'Group Dashboard' }}</h1>
          <p class="hero-text">
            See what your group has contributed, what has been spent, and how much is currently available.
          </p>
          <div class="hero-meta">
            <span class="meta-pill">{{ dashboard?.members?.length || 0 }} members</span>
            <span class="meta-pill">Shared group wallet</span>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="orbit orbit-a"></div>
          <div class="orbit orbit-b"></div>
          <div class="hero-core">R</div>
          <div class="floating-tag tag-top">GROUP</div>
          <div class="floating-tag tag-bottom">TOGETHER</div>
        </div>
      </header>

      <div v-if="loading" class="state-card glass">Loading your group dashboard...</div>
      <div v-else-if="error" class="state-card glass error">{{ error }}</div>
      <template v-else-if="dashboard">
        <section class="wallet-section">
          <div class="section-heading">
            <div>
              <span class="section-label">YOUR GROUP AT A GLANCE</span>
              <h2>Shared money, <em>shared progress.</em></h2>
            </div>
          </div>

          <div class="wallet-grid">
            <article class="wallet-card wallet-main glass">
              <div class="card-topline"><span>GROUP WALLET</span><span class="card-dot">●</span></div>
              <strong>R {{ money(dashboard.wallet.available_balance) }}</strong>
              <small>Estimated balance after recorded group spending</small>
              <div class="wallet-bar"><span :style="{ width: walletPercent + '%' }"></span></div>
              <div class="wallet-bar-labels"><span>Available</span><span>{{ walletPercent }}%</span></div>
            </article>

            <article class="wallet-card glass">
              <div class="card-topline"><span>TOTAL CONTRIBUTIONS</span><span>01</span></div>
              <strong>R {{ money(dashboard.wallet.paid_contributions) }}</strong>
              <small>Paid contributions recorded for the group</small>
              <div class="mini-line gold"></div>
            </article>

            <article class="wallet-card glass">
              <div class="card-topline"><span>GROUP SPENDING</span><span>02</span></div>
              <strong>R {{ money(dashboard.wallet.spent_amount) }}</strong>
              <small>Orders currently processing or completed</small>
              <div class="mini-line terra"></div>
            </article>

            <article class="wallet-card glass">
              <div class="card-topline"><span>MEMBERS</span><span>03</span></div>
              <strong>{{ dashboard.members.length }}</strong>
              <small>People contributing to this Stokvel</small>
              <div class="member-stack">
                <span v-for="member in dashboard.members.slice(0, 5)" :key="member.user_id">{{ initials(member.full_name) }}</span>
                <span v-if="dashboard.members.length > 5">+{{ dashboard.members.length - 5 }}</span>
              </div>
            </article>
          </div>
        </section>

        <div class="content-grid">
          <article class="panel glass contributions-panel">
            <div class="panel-heading">
              <div>
                <span class="section-label">TRANSACTION FEED</span>
                <h3>Member contributions</h3>
                <p>Every recorded contribution made by the group.</p>
              </div>
              <span class="record-count">{{ dashboard.contributions.length }} records</span>
            </div>

            <div v-if="dashboard.contributions.length" class="contribution-list">
              <div v-for="contribution in dashboard.contributions" :key="contribution.contribution_id" class="contribution-row">
                <div class="member-avatar">{{ initials(contribution.full_name) }}</div>
                <div class="member-info">
                  <strong>{{ contribution.full_name }}</strong>
                  <small>{{ formatDate(contribution.contribution_date) }}</small>
                </div>
                <div class="contribution-right">
                  <span class="status-badge" :class="String(contribution.payment_status || '').toLowerCase()">{{ contribution.payment_status }}</span>
                  <strong>R {{ money(contribution.amount) }}</strong>
                </div>
              </div>
            </div>
            <div v-else class="empty">No contributions have been recorded yet.</div>
          </article>

          <article class="panel glass members-panel">
            <div class="panel-heading">
              <div>
                <span class="section-label">GROUP PEOPLE</span>
                <h3>Who's contributing</h3>
                <p>Total paid contributions by member.</p>
              </div>
            </div>

            <div class="members-list">
              <div v-for="member in dashboard.members" :key="member.user_id" class="member-row">
                <div class="member-avatar">{{ initials(member.full_name) }}</div>
                <div class="member-info">
                  <strong>{{ member.full_name }}</strong>
                  <small class="capitalize">{{ member.role }}</small>
                </div>
                <div class="member-total">
                  <strong>R {{ money(member.paid_contributions) }}</strong>
                  <small>paid</small>
                </div>
              </div>
            </div>
          </article>
        </div>

        <article class="wallet-explainer glass">
          <div class="explainer-icon">↗</div>
          <div>
            <span class="section-label">WALLET OVERVIEW</span>
            <h3>How the group balance is calculated</h3>
            <p>
              Paid member contributions are counted as money in. Processing and completed group orders are counted as money out. The displayed available balance is the difference between those recorded amounts.
            </p>
          </div>
        </article>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { getMemberDashboard } from "../services/api.js";

const dashboard = ref(null);
const loading = ref(true);
const error = ref("");

const money = (value) => Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const initials = (name) => String(name || "Member").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const walletPercent = computed(() => {
  if (!dashboard.value?.wallet) return 0;
  const total = Number(dashboard.value.wallet.paid_contributions || 0);
  const available = Number(dashboard.value.wallet.available_balance || 0);
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((available / total) * 100)));
});

async function loadDashboard() {
  loading.value = true;
  error.value = "";
  try {
    dashboard.value = await getMemberDashboard();
  } catch (err) {
    console.error("Member dashboard fetch failed:", err);
    error.value = err.response?.data?.message || "Unable to load your group dashboard.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped>
.dashboard-page { min-height:100vh; background:var(--sw-page-background); color:var(--sw-page-text); }
.dashboard-wrap { width:min(1180px,calc(100% - 32px)); margin:0 auto; padding:44px 0 82px; }
.dashboard-hero { position:relative; overflow:hidden; min-height:360px; padding:48px 52px; display:grid; grid-template-columns:1.3fr .7fr; align-items:center; gap:24px; background:var(--sw-page-gradient); border-radius:26px; }
.dashboard-hero::after { content:""; position:absolute; inset:auto -80px -150px auto; width:360px; height:360px; border-radius:50%; border:1px solid rgba(255,255,255,.12); }
.hero-copy { position:relative; z-index:2; max-width:680px; }
.eyebrow { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid var(--sw-input-border); border-radius:999px; color:var(--sw-page-text-soft); font:800 10px var(--sw-font-body); letter-spacing:.13em; }
.eyebrow span { color:var(--sw-gold-500); }
h1 { margin:20px 0 15px; max-width:680px; font:800 clamp(45px,7vw,78px)/.9 var(--sw-font-heading); letter-spacing:-.07em; }
.hero-text { max-width:600px; margin:0; color:var(--sw-page-text-soft); font:15px/1.7 var(--sw-font-body); }
.hero-meta { display:flex; flex-wrap:wrap; gap:9px; margin-top:24px; }
.meta-pill { padding:8px 12px; border:1px solid var(--sw-input-border); border-radius:999px; background:rgba(255,255,255,.04); color:var(--sw-page-text-soft); font:700 10px var(--sw-font-body); }
.hero-visual { position:relative; min-height:250px; display:grid; place-items:center; }
.hero-core { position:relative; z-index:3; width:154px; height:154px; display:grid; place-items:center; border:1px solid var(--sw-glass-light-border); border-radius:50%; background:var(--sw-glass-light); box-shadow:var(--sw-glass-shadow-light); color:var(--sw-gold-500); font:800 72px var(--sw-font-heading); backdrop-filter:blur(var(--sw-glass-blur)); }
.orbit { position:absolute; border-radius:50%; border:1px solid rgba(255,255,255,.12); }
.orbit-a { width:240px; height:240px; }
.orbit-b { width:310px; height:310px; opacity:.45; }
.floating-tag { position:absolute; z-index:4; padding:9px 12px; border-radius:10px; background:var(--sw-page-surface); border:1px solid var(--sw-input-border); color:var(--sw-page-text); font:800 9px var(--sw-font-body); letter-spacing:.12em; box-shadow:var(--sw-glass-shadow-light); }
.tag-top { top:24px; right:8px; }
.tag-bottom { bottom:21px; left:5px; color:var(--sw-gold-500); }
.wallet-section { margin-top:38px; }
.section-heading { margin-bottom:18px; }
.section-label { color:var(--sw-purple-700); font:800 10px var(--sw-font-body); letter-spacing:.13em; }
.section-heading h2 { margin:8px 0 0; font:800 clamp(30px,4vw,46px)/1 var(--sw-font-heading); letter-spacing:-.05em; }
.section-heading h2 em { color:var(--sw-purple-700); font-style:normal; }
.wallet-grid { display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:13px; }
.wallet-card { min-height:190px; padding:20px; border-radius:18px; }
.wallet-main { background:var(--sw-page-gradient); border-color:rgba(200,176,25,.28); }
.card-topline { display:flex; justify-content:space-between; align-items:center; color:var(--sw-page-text-soft); font:800 9px var(--sw-font-body); letter-spacing:.12em; }
.card-dot { color:var(--sw-gold-500); }
.wallet-card > strong { display:block; margin-top:25px; font:800 clamp(24px,3vw,35px) var(--sw-font-heading); letter-spacing:-.04em; }
.wallet-card small { display:block; margin-top:8px; min-height:31px; color:var(--sw-page-text-soft); font:10px/1.5 var(--sw-font-body); }
.wallet-bar { height:6px; margin-top:20px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.08); }
.wallet-bar span { display:block; height:100%; border-radius:inherit; background:var(--sw-gold-500); transition:width .3s ease; }
.wallet-bar-labels { display:flex; justify-content:space-between; margin-top:7px; color:var(--sw-page-text-soft); font:9px var(--sw-font-body); }
.mini-line { width:42px; height:3px; margin-top:20px; border-radius:999px; }
.mini-line.gold { background:var(--sw-gold-500); }
.mini-line.terra { background:var(--sw-orange-600); }
.member-stack { display:flex; margin-top:18px; }
.member-stack span { width:29px; height:29px; display:grid; place-items:center; margin-right:-7px; border:2px solid var(--sw-page-surface); border-radius:50%; background:var(--sw-purple-700); color:#fff; font:800 8px var(--sw-font-body); }
.content-grid { display:grid; grid-template-columns:1.3fr .9fr; gap:18px; margin-top:18px; }
.panel { padding:23px; border-radius:20px; }
.panel-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:15px; padding-bottom:18px; border-bottom:1px solid var(--sw-input-border); }
.panel-heading h3 { margin:6px 0 0; font:800 22px var(--sw-font-heading); letter-spacing:-.035em; }
.panel-heading p { margin:6px 0 0; color:var(--sw-page-text-soft); font:11px/1.5 var(--sw-font-body); }
.record-count { padding:6px 9px; border-radius:999px; background:rgba(121,93,137,.12); color:var(--sw-purple-700); font:800 9px var(--sw-font-body); white-space:nowrap; }
.contribution-list,.members-list { display:grid; }
.contribution-row,.member-row { display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; padding:15px 2px; border-bottom:1px solid var(--sw-input-border); }
.contribution-row:last-child,.member-row:last-child { border-bottom:0; }
.member-avatar { width:39px; height:39px; display:grid; place-items:center; border-radius:13px; background:var(--sw-page-surface); border:1px solid var(--sw-input-border); color:var(--sw-gold-500); font:800 10px var(--sw-font-body); }
.member-info strong { display:block; font:700 12px var(--sw-font-body); }
.member-info small,.member-total small { display:block; margin-top:4px; color:var(--sw-page-text-soft); font:9px var(--sw-font-body); }
.contribution-right { display:grid; justify-items:end; gap:6px; }
.contribution-right > strong,.member-total strong { font:800 12px var(--sw-font-body); }
.status-badge { padding:4px 7px; border-radius:999px; font:800 8px var(--sw-font-body); }
.status-badge.paid { background:rgba(55,170,105,.12); color:#48b97a; }
.status-badge.pending { background:rgba(200,176,25,.13); color:var(--sw-gold-500); }
.status-badge.failed { background:rgba(210,75,55,.12); color:#e27b6b; }
.member-total { text-align:right; }
.capitalize { text-transform:capitalize; }
.empty,.state-card { color:var(--sw-page-text-soft); font:12px var(--sw-font-body); text-align:center; padding:48px 15px; }
.state-card { min-height:220px; margin-top:18px; border-radius:20px; }
.state-card.error { color:var(--sw-orange-600); }
.wallet-explainer { display:flex; gap:17px; align-items:flex-start; margin-top:18px; padding:22px; border-radius:18px; }
.explainer-icon { width:44px; height:44px; display:grid; place-items:center; flex:0 0 auto; border-radius:14px; background:var(--sw-gold-500); color:var(--sw-purple-900); font:800 18px var(--sw-font-body); }
.wallet-explainer h3 { margin:6px 0 0; font:800 20px var(--sw-font-heading); letter-spacing:-.03em; }
.wallet-explainer p { max-width:850px; margin:7px 0 0; color:var(--sw-page-text-soft); font:11px/1.7 var(--sw-font-body); }
@media (max-width:1000px) { .dashboard-hero { grid-template-columns:1fr .55fr; padding:38px; } .wallet-grid { grid-template-columns:repeat(2,1fr); } .content-grid { grid-template-columns:1fr; } }
@media (max-width:680px) { .dashboard-wrap { width:min(100% - 22px,1180px); padding-top:28px; } .dashboard-hero { min-height:auto; grid-template-columns:1fr; padding:30px 24px; } .hero-visual { min-height:190px; } .wallet-grid { grid-template-columns:1fr; } .wallet-explainer { flex-direction:column; } .panel-heading { flex-direction:column; } }
</style>
