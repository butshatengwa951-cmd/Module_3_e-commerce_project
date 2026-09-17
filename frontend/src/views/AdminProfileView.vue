<template>
  <main class="admin-profile-page">
    <div class="admin-profile-wrap">
      <section class="admin-hero">
        <div>
          <span class="eyebrow">STOCKWELL ADMIN</span>
          <h1>Administrator Profile</h1>
          <p>Manage your administrator identity, access level and company oversight from one place.</p>
        </div>
        <div class="admin-identity-badge">
          <span class="crown">★</span>
          <span>ADMINISTRATOR</span>
        </div>
      </section>

      <div v-if="loading" class="state-card">Loading administrator profile…</div>
      <div v-else-if="error" class="state-card error">{{ error }}</div>

      <template v-else>
        <section class="identity-grid">
          <article class="panel identity-card">
            <div class="avatar">{{ initials }}</div>
            <div class="identity-copy">
              <span class="section-label">ADMIN ACCOUNT</span>
              <h2>{{ profile.full_name || 'Administrator' }}</h2>
              <p>{{ profile.email }}</p>
              <span class="role-pill">ADMIN</span>
            </div>
          </article>

          <article class="panel access-card">
            <div class="section-label">ACCESS LEVEL</div>
            <div class="access-main">
              <strong>Full administrator</strong>
              <span>Backend-protected administrative access</span>
            </div>
            <div class="access-list">
              <div><span>USER MANAGEMENT</span><strong>Enabled</strong></div>
              <div><span>INVENTORY & PRODUCTS</span><strong>Enabled</strong></div>
              <div><span>ORDERS & DELIVERIES</span><strong>Enabled</strong></div>
              <div><span>SUGGESTIONS</span><strong>Enabled</strong></div>
              <div><span>ANALYTICS & AUDIT</span><strong>Enabled</strong></div>
            </div>
          </article>
        </section>

        <section class="stats-grid">
          <article class="stat-card">
            <span>USERS</span>
            <strong>{{ dashboard.stats?.users ?? 0 }}</strong>
            <small>Registered StockWell accounts</small>
          </article>
          <article class="stat-card">
            <span>STOKVELS</span>
            <strong>{{ dashboard.stats?.stokvels ?? 0 }}</strong>
            <small>Groups under administration</small>
          </article>
          <article class="stat-card">
            <span>ACTIVE ORDERS</span>
            <strong>{{ dashboard.stats?.active_orders ?? 0 }}</strong>
            <small>Pending, confirmed or processing</small>
          </article>
          <article class="stat-card">
            <span>REVENUE</span>
            <strong>R {{ money(dashboard.stats?.revenue) }}</strong>
            <small>Recorded company revenue</small>
          </article>
        </section>

        <section class="content-grid">
          <article class="panel">
            <div class="panel-heading">
              <div>
                <span class="section-label">ACCOUNT DETAILS</span>
                <h2>Administrator information</h2>
              </div>
            </div>
            <div class="details">
              <div><span>FULL NAME</span><strong>{{ profile.full_name || 'Not provided' }}</strong></div>
              <div><span>EMAIL</span><strong>{{ profile.email || 'Not provided' }}</strong></div>
              <div><span>PHONE NUMBER</span><strong>{{ profile.phone_number || 'Not provided' }}</strong></div>
              <div><span>ACCOUNT ROLE</span><strong class="admin-text">Administrator</strong></div>
              <div><span>ACCOUNT CREATED</span><strong>{{ formatDate(profile.created_at) }}</strong></div>
              <div><span>USER ID</span><strong>#{{ profile.user_id ?? '—' }}</strong></div>
            </div>
          </article>

          <article class="panel responsibilities-card">
            <div class="panel-heading">
              <div>
                <span class="section-label">ADMIN RESPONSIBILITIES</span>
                <h2>Company control areas</h2>
              </div>
            </div>
            <div class="responsibilities">
              <div v-for="item in responsibilities" :key="item.title" class="responsibility">
                <span class="responsibility-icon">{{ item.icon }}</span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.description }}</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="panel activity-panel">
          <div class="panel-heading">
            <div>
              <span class="section-label">SECURITY & ACCOUNTABILITY</span>
              <h2>Recent administrator activity</h2>
            </div>
            <span class="activity-count">{{ auditEntries.length }} shown</span>
          </div>

          <div v-if="auditEntries.length" class="activity-list">
            <article v-for="entry in auditEntries" :key="entry.audit_id" class="activity-row">
              <div class="activity-marker">✓</div>
              <div class="activity-main">
                <strong>{{ entry.action }}</strong>
                <p>{{ entry.details || `${entry.entity_type} #${entry.entity_id ?? '—'}` }}</p>
              </div>
              <time>{{ formatDateTime(entry.created_at) }}</time>
            </article>
          </div>
          <div v-else class="empty">No administrative actions have been recorded yet.</div>
        </section>

        <div class="profile-actions">
          <router-link to="/admin" class="secondary-btn">Back to Dashboard</router-link>
          <router-link to="/admin/management" class="primary-btn">Open Administration</router-link>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api, { getAdminAuditLog, getAdminDashboard } from "../services/api.js";

const loading = ref(true);
const error = ref("");
const profile = ref({});
const dashboard = ref({});
const auditEntries = ref([]);

const responsibilities = [
  { icon: "U", title: "Users & roles", description: "Manage member accounts, chairpersons and administrator access." },
  { icon: "P", title: "Products & inventory", description: "Control catalogue data, stock levels and supplier pricing." },
  { icon: "O", title: "Orders & deliveries", description: "Monitor company-wide orders and delivery operations." },
  { icon: "A", title: "Analytics & audit", description: "Review operational performance and track administrative actions." },
];

const initials = computed(() => {
  const name = String(profile.value.full_name || "Admin").trim();
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AD";
});

const money = (value) => Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

async function loadProfile() {
  loading.value = true;
  error.value = "";

  try {
    const [profileResponse, dashboardResponse, auditResponse] = await Promise.all([
      api.get("/api/users/profile"),
      getAdminDashboard(),
      getAdminAuditLog(),
    ]);

    profile.value = profileResponse.data?.user || profileResponse.data || {};
    dashboard.value = dashboardResponse || {};
    auditEntries.value = (auditResponse?.entries || []).slice(0, 8);
  } catch (err) {
    error.value = err.response?.data?.message || err.response?.data?.error || "We could not load your administrator profile.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadProfile);
</script>

<style scoped>
.admin-profile-page {
  min-height: calc(100vh - 68px);
  padding: 42px 24px 64px;
  background: var(--sw-page-background);
  color: var(--sw-page-text);
}

.admin-profile-wrap { max-width: 1180px; margin: 0 auto; }
.admin-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 30px; }
.eyebrow, .section-label, .stat-card span, .details span, .access-list span {
  font-family: var(--sw-font-body);
  letter-spacing: .14em;
  font-size: 10px;
  font-weight: 800;
}
.eyebrow { color: var(--sw-gold-500); margin-bottom: 8px; display: block; }
h1 { margin: 0; font-size: clamp(34px, 5vw, 56px); letter-spacing: -.04em; color: var(--sw-page-text); }
.admin-hero p { max-width: 700px; color: var(--sw-page-text-soft); margin: 10px 0 0; }
.admin-identity-badge { display: inline-flex; align-items: center; gap: 9px; padding: 10px 14px; border-radius: 999px; border: 1px solid rgba(200,176,25,.4); background: color-mix(in srgb, var(--sw-gold-500) 10%, var(--sw-page-surface)); color: var(--sw-gold-500); font: 800 10px var(--sw-font-body); letter-spacing: .13em; white-space: nowrap; }
.crown { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; background: var(--sw-gold-500); color: var(--sw-purple-900); }

.state-card, .panel, .stat-card { border: 1px solid var(--sw-input-border); background: var(--sw-page-surface); box-shadow: var(--sw-card-shadow, 0 12px 30px rgba(0,0,0,.07)); }
.state-card { padding: 28px; border-radius: 22px; text-align: center; color: var(--sw-page-text-soft); }
.state-card.error { color: var(--sw-red-600); }

.identity-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 18px; margin-bottom: 18px; }
.identity-card, .access-card { padding: 24px; border-radius: 24px; }
.identity-card { display: flex; align-items: center; gap: 20px; }
.avatar { width: 88px; height: 88px; flex: none; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(145deg, var(--sw-gold-500), var(--sw-purple-700)); color: var(--sw-white); font-size: 26px; font-weight: 900; box-shadow: 0 12px 28px rgba(0,0,0,.18); }
.identity-copy h2 { margin: 7px 0 4px; font-size: 25px; color: var(--sw-page-text); }
.identity-copy p { margin: 0 0 12px; color: var(--sw-page-text-muted); }
.section-label { color: var(--sw-page-text-faint); }
.role-pill { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: color-mix(in srgb, var(--sw-gold-500) 14%, var(--sw-page-surface)); color: var(--sw-gold-500); border: 1px solid color-mix(in srgb, var(--sw-gold-500) 35%, transparent); font: 800 9px var(--sw-font-body); letter-spacing: .14em; }
.access-main { margin: 16px 0 18px; }
.access-main strong { display: block; color: var(--sw-page-text); font-size: 20px; }
.access-main span { color: var(--sw-page-text-muted); font-size: 12px; }
.access-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.access-list div { padding: 12px; border: 1px solid var(--sw-input-border); border-radius: 13px; background: var(--sw-input-background); }
.access-list span { color: var(--sw-page-text-faint); display: block; margin-bottom: 6px; }
.access-list strong { color: var(--sw-gold-500); font-size: 12px; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.stat-card { padding: 20px; border-radius: 20px; }
.stat-card span { color: var(--sw-page-text-faint); }
.stat-card strong { display: block; color: var(--sw-page-text); font-size: 27px; margin: 10px 0 5px; }
.stat-card small { color: var(--sw-page-text-muted); }

.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
.panel { padding: 24px; border-radius: 24px; }
.panel-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
.panel-heading h2 { margin: 6px 0 0; color: var(--sw-page-text); font-size: 22px; }
.details { display: grid; }
.details div { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 14px 0; border-bottom: 1px solid var(--sw-input-border); }
.details div:last-child { border-bottom: 0; }
.details span { color: var(--sw-page-text-faint); }
.details strong { color: var(--sw-page-text); text-align: right; font-size: 14px; }
.admin-text { color: var(--sw-gold-500) !important; }
.responsibilities { display: grid; gap: 12px; }
.responsibility { display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: start; padding: 13px 0; border-bottom: 1px solid var(--sw-input-border); }
.responsibility:last-child { border-bottom: 0; }
.responsibility-icon { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: color-mix(in srgb, var(--sw-gold-500) 12%, var(--sw-page-surface)); color: var(--sw-gold-500); font: 800 12px var(--sw-font-body); }
.responsibility strong { color: var(--sw-page-text); }
.responsibility p { margin: 4px 0 0; color: var(--sw-page-text-muted); font-size: 12px; line-height: 1.45; }

.activity-panel { margin-bottom: 18px; }
.activity-count { color: var(--sw-page-text-muted); font-size: 12px; }
.activity-list { display: grid; gap: 0; }
.activity-row { display: grid; grid-template-columns: 34px 1fr auto; gap: 12px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--sw-input-border); }
.activity-row:last-child { border-bottom: 0; }
.activity-marker { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--sw-gold-500) 14%, var(--sw-page-surface)); color: var(--sw-gold-500); font-weight: 900; }
.activity-main strong { color: var(--sw-page-text); }
.activity-main p { margin: 3px 0 0; color: var(--sw-page-text-muted); font-size: 12px; }
.activity-row time { color: var(--sw-page-text-faint); font-size: 11px; text-align: right; white-space: nowrap; }
.empty { padding: 20px 0; color: var(--sw-page-text-muted); }
.profile-actions { display: flex; justify-content: flex-end; gap: 10px; }
.primary-btn, .secondary-btn { display: inline-flex; align-items: center; justify-content: center; padding: 11px 17px; border-radius: 12px; text-decoration: none; font: 800 11px var(--sw-font-body); }
.primary-btn { background: var(--sw-purple-900); color: var(--sw-white); border: 1px solid var(--sw-purple-900); }
.secondary-btn { background: var(--sw-page-surface); color: var(--sw-page-text); border: 1px solid var(--sw-input-border); }
.primary-btn:hover, .secondary-btn:hover { border-color: var(--sw-gold-500); }

@media (max-width: 900px) {
  .admin-profile-page { padding: 32px 16px 50px; }
  .admin-hero { flex-direction: column; }
  .identity-grid, .content-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 620px) {
  .identity-card { align-items: flex-start; flex-direction: column; }
  .access-list { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
  .details div { align-items: flex-start; flex-direction: column; gap: 6px; }
  .details strong { text-align: left; }
  .activity-row { grid-template-columns: 34px 1fr; }
  .activity-row time { grid-column: 2; text-align: left; }
  .profile-actions { flex-direction: column; }
}
</style>
