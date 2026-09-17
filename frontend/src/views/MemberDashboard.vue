<template>
  <section class="dashboard-page">
    <div class="dashboard-wrap">
      <header class="dashboard-heading">
        <div>
          <p class="eyebrow">STOCKWELL MEMBER AREA</p>
          <h1>{{ dashboard?.stokvel?.stokvel_name || 'Member Dashboard' }}</h1>
          <p class="intro">See your group's shared wallet and the contributions made by every member.</p>
        </div>
        <div class="wallet-icon">💰</div>
      </header>

      <div v-if="loading" class="state-card glass">Loading your group dashboard...</div>
      <div v-else-if="error" class="state-card glass error">{{ error }}</div>
      <template v-else-if="dashboard">
        <div class="wallet-grid">
          <article class="wallet-card glass primary">
            <span>GROUP WALLET</span>
            <strong>R {{ money(dashboard.wallet.available_balance) }}</strong>
            <small>Available after recorded group spending</small>
          </article>
          <article class="wallet-card glass">
            <span>TOTAL CONTRIBUTIONS</span>
            <strong>R {{ money(dashboard.wallet.paid_contributions) }}</strong>
            <small>Paid contributions from the group</small>
          </article>
          <article class="wallet-card glass">
            <span>GROUP SPENDING</span>
            <strong>R {{ money(dashboard.wallet.spent_amount) }}</strong>
            <small>Processing and completed orders</small>
          </article>
          <article class="wallet-card glass">
            <span>MEMBERS</span>
            <strong>{{ dashboard.members.length }}</strong>
            <small>Members in this Stokvel</small>
          </article>
        </div>

        <div class="content-grid">
          <article class="panel glass">
            <div class="panel-heading">
              <div>
                <div class="panel-title">MEMBER CONTRIBUTIONS</div>
                <p class="muted">Every member's recorded contribution history for this group.</p>
              </div>
              <span>{{ dashboard.contributions.length }} records</span>
            </div>

            <div v-if="dashboard.contributions.length" class="contribution-list">
              <div v-for="contribution in dashboard.contributions" :key="contribution.contribution_id" class="contribution-row">
                <div class="member-avatar">{{ initials(contribution.full_name) }}</div>
                <div class="member-info">
                  <strong>{{ contribution.full_name }}</strong>
                  <small>{{ formatDate(contribution.contribution_date) }} · {{ contribution.payment_status }}</small>
                </div>
                <strong class="amount">R {{ money(contribution.amount) }}</strong>
              </div>
            </div>
            <div v-else class="empty">No contributions have been recorded yet.</div>
          </article>

          <article class="panel glass">
            <div class="panel-heading">
              <div>
                <div class="panel-title">GROUP MEMBERS</div>
                <p class="muted">Contribution totals by member.</p>
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

        <article class="panel glass explanation">
          <div class="panel-title">HOW THE GROUP WALLET WORKS</div>
          <p>The wallet starts with paid member contributions. When the group pays for an order, that order is counted as group spending. The available balance is the recorded paid contributions less processing and completed order spending.</p>
        </article>
      </template>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getMemberDashboard } from "../services/api.js";

const dashboard = ref(null);
const loading = ref(true);
const error = ref("");

const money = (value) => Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const initials = (name) => String(name || "Member").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

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
.dashboard-page { min-height: 100vh; background: var(--sw-page-background); color: var(--sw-page-text); }
.dashboard-wrap { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 52px 0 80px; }
.dashboard-heading { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; margin-bottom:30px; }
.eyebrow { margin:0 0 8px; color:var(--sw-gold-500); font:800 11px var(--sw-font-body); letter-spacing:.16em; }
h1 { margin:0; font:800 clamp(40px,6vw,68px)/.95 var(--sw-font-heading); letter-spacing:-.04em; }
.intro { max-width:680px; margin:16px 0 0; color:var(--sw-page-text-soft); font:15px/1.6 var(--sw-font-body); }
.wallet-icon { width:64px; height:64px; display:grid; place-items:center; border:1px solid var(--sw-input-border); border-radius:20px; background:var(--sw-page-surface); font-size:28px; }
.wallet-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
.wallet-card { padding:20px; }
.wallet-card span { display:block; color:var(--sw-page-text-soft); font:800 10px var(--sw-font-body); letter-spacing:.12em; }
.wallet-card strong { display:block; margin-top:8px; font:800 24px var(--sw-font-heading); }
.wallet-card small { display:block; margin-top:7px; color:var(--sw-page-text-soft); font:11px/1.4 var(--sw-font-body); }
.wallet-card.primary { border-color:var(--sw-gold-500); }
.content-grid { display:grid; grid-template-columns:1.35fr 1fr; gap:18px; }
.panel { padding:22px; }
.panel-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:18px; padding-bottom:18px; border-bottom:1px solid var(--sw-input-border); }
.panel-title { color:var(--sw-page-text); font:800 11px var(--sw-font-body); letter-spacing:.12em; }
.panel-heading > span { color:var(--sw-page-text-soft); font:10px var(--sw-font-body); white-space:nowrap; }
.muted { margin:7px 0 0; color:var(--sw-page-text-soft); font:12px/1.5 var(--sw-font-body); }
.contribution-list,.members-list { display:grid; }
.contribution-row,.member-row { display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; padding:15px 2px; border-bottom:1px solid var(--sw-input-border); }
.contribution-row:last-child,.member-row:last-child { border-bottom:0; }
.member-avatar { width:38px; height:38px; display:grid; place-items:center; border-radius:50%; background:var(--sw-page-surface); border:1px solid var(--sw-input-border); color:var(--sw-gold-500); font:800 11px var(--sw-font-body); }
.member-info strong { display:block; font:700 12px var(--sw-font-body); }
.member-info small,.member-total small { display:block; margin-top:4px; color:var(--sw-page-text-soft); font:10px var(--sw-font-body); }
.amount,.member-total strong { white-space:nowrap; font:800 12px var(--sw-font-body); }
.member-total { text-align:right; }
.capitalize { text-transform:capitalize; }
.empty,.state-card { color:var(--sw-page-text-soft); font:12px var(--sw-font-body); text-align:center; padding:45px 15px; }
.state-card.error { color:var(--sw-orange-600); }
.explanation { margin-top:18px; }
.explanation p { max-width:850px; margin:10px 0 0; color:var(--sw-page-text-soft); font:12px/1.7 var(--sw-font-body); }
@media (max-width:900px) { .wallet-grid { grid-template-columns:repeat(2,1fr); } .content-grid { grid-template-columns:1fr; } }
@media (max-width:600px) { .dashboard-wrap { padding-top:32px; } .dashboard-heading { flex-direction:column; } .wallet-grid { grid-template-columns:1fr; } .panel-heading { flex-direction:column; } }
</style>
