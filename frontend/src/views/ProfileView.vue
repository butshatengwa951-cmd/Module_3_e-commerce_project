<template>
  <section class="profile-page">
    <div class="profile-wrap">
      <div class="profile-heading">
        <div>
          <p class="eyebrow">MEMBER ACCOUNT</p>
          <h1>My Profile</h1>
          <p class="intro">Your StockWell member information, stokvel membership and activity.</p>
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

const initials = computed(() => {
  const name = profile.value?.user?.full_name || "Member";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
});

const money = (value) => Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";

async function loadProfile() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/auth/profile");
    profile.value = data;
  } catch (err) {
    error.value = err.response?.data?.error || "We could not load your profile. Please sign in again.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadProfile);
</script>

<style scoped>
.profile-page { min-height: calc(100vh - 120px); padding: 42px 24px 64px; color: #fff; }
.profile-wrap { max-width: 1180px; margin: 0 auto; position: relative; z-index: 2; }
.profile-heading { display:flex; align-items:center; justify-content:space-between; gap:24px; margin-bottom:32px; }
.eyebrow,.panel-title,.stat-card span,.detail span { font-family:'DM Mono',monospace; letter-spacing:.14em; font-size:11px; }
.eyebrow { color:#d8b46a; margin:0 0 8px; }
h1 { margin:0; font-size:clamp(34px,5vw,56px); letter-spacing:-.04em; }
.intro { color:rgba(255,255,255,.62); margin:10px 0 0; max-width:650px; }
.avatar { width:76px; height:76px; border-radius:50%; display:grid; place-items:center; flex:none; background:linear-gradient(145deg,#d8b46a,#80662e); color:#130e23; font-weight:800; font-size:22px; box-shadow:0 12px 30px rgba(0,0,0,.25); }
.glass { background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.1); backdrop-filter:blur(16px); box-shadow:0 18px 50px rgba(0,0,0,.14); }
.state-card { padding:28px; border-radius:24px; text-align:center; color:rgba(255,255,255,.7); }
.error { color:#ffb4b4; }
.stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:18px; }
.stat-card { padding:22px; border-radius:22px; }
.stat-card span { color:rgba(255,255,255,.5); }
.stat-card strong { display:block; font-size:27px; margin:12px 0 5px; }
.stat-card small,.detail span,.membership small,.order-row small { color:rgba(255,255,255,.5); }
.content-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.panel { border-radius:24px; padding:26px; }
.panel-title { color:rgba(255,255,255,.85); margin-bottom:22px; }
.details { display:grid; gap:0; }
.detail { padding:15px 0; border-bottom:1px solid rgba(255,255,255,.07); display:flex; justify-content:space-between; gap:20px; }
.detail:last-child { border-bottom:0; }
.detail strong { text-align:right; font-size:14px; }
.capitalize { text-transform:capitalize; }
.stokvel-list { display:grid; gap:12px; }
.stokvel-card { padding:18px; border-radius:18px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); }
.stokvel-card h2 { margin:0 0 6px; font-size:19px; }
.stokvel-card p { margin:0; color:rgba(255,255,255,.56); font-size:13px; line-height:1.5; }
.membership { margin-top:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.membership span,.status { color:#130e23; background:#d8b46a; padding:6px 10px; border-radius:999px; font:700 10px 'DM Mono',monospace; text-transform:uppercase; }
.orders-panel { margin-top:18px; }
.panel-heading { display:flex; justify-content:space-between; align-items:center; }
.panel-heading .panel-title { margin-bottom:0; }
.panel-heading > span { color:rgba(255,255,255,.4); font:11px 'DM Mono',monospace; }
.orders { display:grid; }
.order-row { display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:24px; padding:16px 0; border-bottom:1px solid rgba(255,255,255,.07); }
.order-row:last-child { border-bottom:0; }
.order-row div { display:grid; gap:5px; }
.status { background:rgba(255,255,255,.09); color:rgba(255,255,255,.8); }
.empty { padding:20px 0; color:rgba(255,255,255,.48); }
@media (max-width:800px) { .stats-grid,.content-grid { grid-template-columns:1fr; } .profile-heading { align-items:flex-start; } }
@media (max-width:560px) { .profile-page { padding-left:16px; padding-right:16px; } .avatar { width:58px; height:58px; font-size:17px; } .detail { display:grid; gap:6px; } .detail strong { text-align:left; } .order-row { grid-template-columns:1fr auto; } .order-row .status { grid-column:2; grid-row:1; } }
</style>
