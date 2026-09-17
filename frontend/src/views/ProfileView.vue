<template>
  <section class="profile-page">
    <div class="profile-wrap">
      <div class="profile-heading">
        <div>
          <p class="eyebrow">MEMBER ACCOUNT</p>
          <h1>My Profile</h1>
          <p class="intro">Your StockWell member information, stokvel membership, savings progress and activity.</p>
        </div>
        <div class="avatar">{{ initials }}</div>
      </div>

      <div v-if="loading" class="state-card glass">Loading your profile...</div>
      <div v-else-if="error" class="state-card glass error">{{ error }}</div>

      <template v-else>
        <div class="stats-grid">
          <article class="stat-card glass">
            <span>CONTRIBUTIONS</span>
            <strong>R {{ money(profile.stats.contribution_total) }}</strong>
            <small>{{ profile.stats.contribution_count }} recorded contribution{{ profile.stats.contribution_count === 1 ? '' : 's' }}</small>
          </article>
          <article class="stat-card glass">
            <span>PAID CONTRIBUTIONS</span>
            <strong>R {{ money(profile.stats.paid_total) }}</strong>
            <small>Confirmed payments</small>
          </article>
          <article class="stat-card glass">
            <span>ORDERS</span>
            <strong>{{ profile.stats.order_count }}</strong>
            <small>R {{ money(profile.stats.order_total) }} total value</small>
          </article>
        </div>

        <div v-if="dashboard" class="dashboard-grid">
          <article class="panel glass savings-panel">
            <div class="panel-title">SAVINGS OVERVIEW</div>
            <div class="saving-amount">R {{ money(dashboard.totalContributions) }}</div>
            <p class="muted">Total contributions recorded for your member account.</p>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${contributionProgress}%` }"></div>
            </div>
            <div class="progress-meta">
              <span>{{ contributionProgress }}% of R {{ money(dashboard.savingsGoal) }} goal</span>
              <strong>R {{ money(Math.max(Number(dashboard.savingsGoal || 0) - Number(dashboard.totalContributions || 0), 0)) }} remaining</strong>
            </div>
          </article>

          <article class="panel glass dashboard-card">
            <div class="panel-title">MEMBER SUMMARY</div>
            <div class="dashboard-details">
              <div><span>MEMBER</span><strong>{{ dashboard.member?.full_name || profile.user.full_name }}</strong></div>
              <div><span>STOKVEL</span><strong>{{ dashboard.stokvel?.stokvel_name || 'Not linked' }}</strong></div>
              <div><span>ROLE</span><strong class="capitalize">{{ dashboard.member?.role || profile.user.role }}</strong></div>
              <div><span>MEMBERS</span><strong>{{ dashboard.memberCount ?? profile.stokvels.length }}</strong></div>
            </div>
          </article>
        </div>

        <div class="content-grid">
          <article class="panel glass">
            <div class="panel-title">PERSONAL INFORMATION</div>
            <div class="details">
              <div class="detail"><span>FULL NAME</span><strong>{{ profile.user.full_name }}</strong></div>
              <div class="detail"><span>EMAIL</span><strong>{{ profile.user.email }}</strong></div>
              <div class="detail"><span>PHONE NUMBER</span><strong>{{ profile.user.phone_number || 'Not provided' }}</strong></div>
              <div class="detail"><span>ACCOUNT ROLE</span><strong class="capitalize">{{ profile.user.role }}</strong></div>
              <div class="detail"><span>MEMBER SINCE</span><strong>{{ formatDate(profile.user.created_at) }}</strong></div>
            </div>
          </article>

          <article class="panel glass">
            <div class="panel-title">MY STOKVEL</div>
            <div v-if="profile.stokvels.length" class="stokvel-list">
              <div v-for="stokvel in profile.stokvels" :key="stokvel.stokvel_id" class="stokvel-card">
                <div>
                  <h2>{{ stokvel.stokvel_name }}</h2>
                  <p>{{ stokvel.description || 'Your shared StockWell community.' }}</p>
                </div>
                <div class="membership">
                  <span>{{ stokvel.membership_role }}</span>
                  <small>Joined {{ formatDate(stokvel.joined_at) }}</small>
                </div>
              </div>
            </div>
            <div v-else class="empty">You are not currently linked to a stokvel.</div>
          </article>
        </div>

        <article v-if="dashboard?.members?.length" class="panel glass members-panel">
          <div class="panel-heading">
            <div class="panel-title">STOKVEL MEMBERS</div>
            <span>{{ dashboard.members.length }} members</span>
          </div>
          <div class="members-list">
            <div v-for="member in dashboard.members" :key="member.user_id" class="member-row">
              <div class="member-avatar">{{ memberInitials(member.full_name) }}</div>
              <div>
                <strong>{{ member.full_name }}</strong>
                <small>{{ member.email }}</small>
              </div>
              <span class="role-badge capitalize">{{ member.role }}</span>
            </div>
          </div>
        </article>

        <article class="panel glass contribution-panel">
          <div class="panel-heading">
            <div>
              <div class="panel-title">MAKE A CONTRIBUTION</div>
              <p class="muted">Record a contribution against your StockWell member account.</p>
            </div>
          </div>
          <form class="contribution-form" @submit.prevent="submitContribution">
            <label>
              Amount (R)
              <input v-model.number="contributionAmount" type="number" min="1" step="0.01" placeholder="500.00" required />
            </label>
            <button type="submit" :disabled="contributionLoading">
              {{ contributionLoading ? 'Saving...' : 'Add Contribution' }}
            </button>
          </form>
          <p v-if="contributionMessage" class="success-message">{{ contributionMessage }}</p>
          <p v-if="contributionError" class="error-message">{{ contributionError }}</p>
        </article>

        <article class="panel glass orders-panel">
          <div class="panel-heading">
            <div class="panel-title">RECENT ORDERS</div>
            <span>{{ profile.recentOrders.length }} shown</span>
          </div>
          <div v-if="profile.recentOrders.length" class="orders">
            <div v-for="order in profile.recentOrders" :key="order.order_id" class="order-row">
              <div><strong>#{{ order.order_id }}</strong><small>{{ formatDate(order.order_date) }}</small></div>
              <strong>R {{ money(order.total_amount) }}</strong>
              <span class="status">{{ order.order_status }}</span>
            </div>
          </div>
          <div v-else class="empty">No orders have been placed yet.</div>
        </article>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api.js";

const loading = ref(true);
const error = ref("");
const profile = ref(null);
const dashboard = ref(null);
const contributionAmount = ref(null);
const contributionLoading = ref(false);
const contributionMessage = ref("");
const contributionError = ref("");

const initials = computed(() => memberInitials(profile.value?.user?.full_name || "Member"));
const contributionProgress = computed(() => {
  const total = Number(dashboard.value?.totalContributions || 0);
  const goal = Number(dashboard.value?.savingsGoal || 0);
  return goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
});

const money = (value) => Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const memberInitials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function normalizeProfileResponse(data) {
  const user = data?.user || data;
  const storedStokvel = JSON.parse(localStorage.getItem("stokvel") || "null");

  return {
    user,
    stats: {
      contribution_total: 0,
      contribution_count: 0,
      paid_total: 0,
      order_count: 0,
      order_total: 0,
    },
    stokvels: storedStokvel?.stokvel_id
      ? [{
          stokvel_id: storedStokvel.stokvel_id,
          stokvel_name: storedStokvel.stokvel_name,
          description: storedStokvel.description || "",
          membership_role: user?.role || "member",
          joined_at: storedStokvel.joined_at || null,
        }]
      : [],
    recentOrders: [],
  };
}

async function loadProfile() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/api/users/profile");
    profile.value = normalizeProfileResponse(data);

    try {
      const dashboardResponse = await api.get("/dashboard/member");
      dashboard.value = dashboardResponse.data;
    } catch (dashboardErr) {
      dashboard.value = null;
      console.warn("Member dashboard data unavailable:", dashboardErr);
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.response?.data?.error || "We could not load your profile. Please sign in again.";
  } finally {
    loading.value = false;
  }
}

async function submitContribution() {
  contributionLoading.value = true;
  contributionMessage.value = "";
  contributionError.value = "";
  try {
    await api.post("/dashboard/contributions", { amount: Number(contributionAmount.value) });
    contributionMessage.value = "Contribution recorded successfully.";
    contributionAmount.value = null;
    await loadProfile();
  } catch (err) {
    contributionError.value = err.response?.data?.message || err.response?.data?.error || "Could not record the contribution.";
  } finally {
    contributionLoading.value = false;
  }
}

onMounted(loadProfile);
</script>

<style scoped>
/*
 * ProfileView follows the global StockWell theme instead of hard-coded
 * white text. Light mode is the default theme and dark-mode is activated
 * by html.dark-mode, matching theme.css.
 */
.profile-page {
  min-height: calc(100vh - 120px);
  padding: 42px 24px 64px;
  color: var(--sw-page-text);
  transition: color var(--sw-transition-slow);
}

.profile-wrap { max-width: 1180px; margin: 0 auto; position: relative; z-index: 2; }
.profile-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
.eyebrow,
.panel-title,
.stat-card span,
.detail span,
.dashboard-details span {
  font-family: var(--sw-font-body);
  letter-spacing: .14em;
  font-size: 11px;
}
.eyebrow { color: var(--sw-orange-600); margin: 0 0 8px; }
h1 { margin: 0; color: var(--sw-page-text); font-size: clamp(34px, 5vw, 56px); letter-spacing: -.04em; }
.intro { color: var(--sw-page-text-soft); margin: 10px 0 0; max-width: 700px; }
.avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
  background: linear-gradient(145deg, var(--sw-gold-500), var(--sw-purple-700));
  color: var(--sw-white);
  font-weight: 800;
  font-size: 22px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, .18);
}

.glass {
  background: var(--sw-glass-light);
  border: 1px solid var(--sw-glass-light-border);
  backdrop-filter: blur(var(--sw-glass-blur)) saturate(var(--sw-glass-saturation));
  box-shadow: var(--sw-glass-shadow-light);
}
.state-card { padding: 28px; border-radius: 24px; text-align: center; color: var(--sw-page-text-soft); }
.error { color: var(--sw-red-600); }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 18px; }
.stat-card { padding: 22px; border-radius: 22px; }
.stat-card span { color: var(--sw-page-text-faint); }
.stat-card strong { display: block; color: var(--sw-page-text); font-size: 27px; margin: 12px 0 5px; }
.stat-card small,
.detail span,
.membership small,
.order-row small,
.muted { color: var(--sw-page-text-muted); }
.dashboard-grid { display: grid; grid-template-columns: 1.3fr .7fr; gap: 18px; margin-bottom: 18px; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.panel { border-radius: 24px; padding: 26px; }
.panel-title { color: var(--sw-page-text); margin-bottom: 22px; }
.saving-amount { color: var(--sw-page-text); font-size: 34px; font-weight: 800; margin-bottom: 4px; }
.progress-track { height: 10px; margin: 24px 0 10px; background: rgba(49, 43, 80, .12); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--sw-gold-500); border-radius: 999px; transition: width .3s ease; }
.progress-meta { display: flex; justify-content: space-between; gap: 16px; color: var(--sw-page-text-muted); font-size: 12px; }
.progress-meta strong { color: var(--sw-page-text-soft); }
.dashboard-details { display: grid; gap: 14px; }
.dashboard-details div { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sw-input-border); }
.dashboard-details div:last-child { border-bottom: 0; }
.dashboard-details strong { color: var(--sw-page-text); text-align: right; font-size: 14px; }
.details { display: grid; gap: 0; }
.detail { padding: 15px 0; border-bottom: 1px solid var(--sw-input-border); display: flex; justify-content: space-between; gap: 20px; }
.detail:last-child { border-bottom: 0; }
.detail strong { color: var(--sw-page-text); text-align: right; font-size: 14px; }
.capitalize { text-transform: capitalize; }
.stokvel-list { display: grid; gap: 12px; }
.stokvel-card { padding: 18px; border-radius: 18px; background: var(--sw-page-surface); border: 1px solid var(--sw-input-border); }
.stokvel-card h2 { color: var(--sw-page-text); margin: 0 0 6px; font-size: 19px; }
.stokvel-card p { margin: 0; color: var(--sw-page-text-muted); font-size: 13px; line-height: 1.5; }
.membership { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.membership span,
.status,
.role-badge {
  color: var(--sw-white);
  background: var(--sw-purple-700);
  padding: 6px 10px;
  border-radius: 999px;
  font: 700 10px var(--sw-font-body);
  text-transform: uppercase;
}
.members-panel,
.contribution-panel,
.orders-panel { margin-top: 18px; }
.panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.panel-heading .panel-title { margin-bottom: 0; }
.panel-heading > span { color: var(--sw-page-text-faint); font: 11px var(--sw-font-body); }
.members-list { display: grid; margin-top: 18px; }
.member-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--sw-input-border); }
.member-row:last-child { border-bottom: 0; }
.member-avatar { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: rgba(200, 176, 25, .16); color: var(--sw-purple-700); font-weight: 800; }
.member-row div:nth-child(2) { display: grid; gap: 4px; }
.member-row strong { color: var(--sw-page-text); }
.member-row small { color: var(--sw-page-text-muted); font-size: 12px; }
.role-badge { background: var(--sw-page-surface); color: var(--sw-page-text); border: 1px solid var(--sw-input-border); }
.contribution-form { display: flex; align-items: end; gap: 14px; }
.contribution-form label { display: grid; gap: 8px; flex: 1; color: var(--sw-page-text-muted); font: 11px var(--sw-font-body); letter-spacing: .08em; }
.contribution-form input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--sw-input-border);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--sw-input-background);
  color: var(--sw-input-text);
  outline: none;
  font: inherit;
}
.contribution-form input:focus { background: var(--sw-input-background-focus); border-color: var(--sw-focus); }
.contribution-form input::placeholder { color: var(--sw-placeholder); }
.contribution-form button { border: 0; border-radius: 12px; padding: 13px 18px; background: var(--sw-button-gradient); color: var(--sw-white); font-weight: 800; cursor: pointer; box-shadow: var(--sw-button-shadow); }
.contribution-form button:disabled { opacity: .55; cursor: not-allowed; }
.success-message { color: #167a45; margin: 14px 0 0; }
.error-message { color: var(--sw-red-600); margin: 14px 0 0; }
.empty { color: var(--sw-page-text-muted); padding: 12px 0; }
.orders { margin-top: 8px; }
.order-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--sw-input-border); }
.order-row:last-child { border-bottom: 0; }
.order-row > div { display: grid; gap: 4px; }
.order-row > div strong,
.order-row > strong { color: var(--sw-page-text); }

/* Dark mode uses the same selectors; only the global theme variables change. */
:global(html.dark-mode) .profile-page .glass {
  background: var(--sw-glass-dark);
  border-color: var(--sw-glass-dark-border);
  box-shadow: var(--sw-glass-shadow-dark);
}
:global(html.dark-mode) .profile-page .progress-track { background: rgba(247, 245, 241, .09); }
:global(html.dark-mode) .profile-page .membership span,
:global(html.dark-mode) .profile-page .status { color: #130e23; background: var(--sw-gold-500); }
:global(html.dark-mode) .profile-page .role-badge { color: rgba(247, 245, 241, .8); background: rgba(255, 255, 255, .09); border-color: rgba(255, 255, 255, .1); }
:global(html.dark-mode) .profile-page .member-avatar { color: var(--sw-gold-500); background: rgba(216, 180, 106, .18); }
:global(html.dark-mode) .profile-page .success-message { color: #8ef0b3; }

@media (max-width: 900px) {
  .dashboard-grid,
  .content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 700px) {
  .profile-page { padding: 30px 16px 48px; }
  .profile-heading { align-items: flex-start; }
  .avatar { width: 58px; height: 58px; font-size: 18px; }
  .stats-grid { grid-template-columns: 1fr; }
  .contribution-form { flex-direction: column; align-items: stretch; }
  .detail,
  .dashboard-details div { align-items: flex-start; }
  .detail strong,
  .dashboard-details strong { max-width: 60%; }
  .order-row { grid-template-columns: 1fr auto; }
  .order-row .status { grid-column: 2; justify-self: end; }
}
</style>
