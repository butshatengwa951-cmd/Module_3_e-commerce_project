<template>
  <section class="history-page">
    <div class="history-wrap">
      <div class="history-heading">
        <div>
          <p class="eyebrow">MEMBER ACTIVITY</p>
          <h1>Order History</h1>
          <p class="intro">A record of your StockWell group orders and their current status.</p>
          <p v-if="stokvelName" class="stokvel-name">{{ stokvelName }}</p>
        </div>
        <div class="history-icon" aria-hidden="true">🧾</div>
      </div>

      <div class="stats-grid">
        <article class="stat-card glass">
          <span>ORDERS</span>
          <strong>{{ displayedOrders.length }}</strong>
          <small>Orders in your history</small>
        </article>
        <article class="stat-card glass">
          <span>TOTAL VALUE</span>
          <strong>R {{ money(totalValue) }}</strong>
          <small>Value of displayed orders</small>
        </article>
        <article class="stat-card glass">
          <span>LAST ORDER</span>
          <strong>{{ lastOrderDate }}</strong>
          <small>{{ lastOrder ? `#${lastOrder.order_id}` : "No orders yet" }}</small>
        </article>
      </div>

      <article class="panel glass">
        <div class="panel-heading">
          <div>
            <div class="panel-title">ORDER HISTORY</div>
            <p class="muted">Completed and in-progress orders for your current StockWell group.</p>
          </div>
          <select v-model="selectedStatus" class="status-filter" aria-label="Filter orders by status">
            <option value="">All statuses</option>
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>

        <div v-if="loading" class="state-card">Loading your order history...</div>
        <div v-else-if="error" class="state-card error">{{ error }}</div>
        <div v-else-if="!displayedOrders.length" class="state-card">
          <strong>No order history yet</strong>
          <span>Orders will appear here after they move beyond the pending cart stage.</span>
          <button type="button" @click="goToCatalogue">Browse Catalogue</button>
        </div>

        <div v-else class="orders-list">
          <div v-for="order in displayedOrders" :key="order.order_id" class="order-row">
            <div class="order-main">
              <div class="order-number">#{{ order.order_id }}</div>
              <div>
                <strong>{{ order.item_count }} item{{ order.item_count === 1 ? '' : 's' }}</strong>
                <small>{{ formatDate(order.order_date) }}</small>
              </div>
            </div>
            <div class="order-meta">
              <span class="status" :class="statusClass(order.order_status)">{{ order.order_status }}</span>
              <small v-if="order.card_type">{{ order.card_type }}{{ order.last_four_digits ? ` •••• ${order.last_four_digits}` : '' }}</small>
              <small v-if="order.delivery_status">Delivery: {{ order.delivery_status }}</small>
            </div>
            <strong class="order-total">R {{ money(order.total_amount) }}</strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getOrderHistory } from "../services/api.js";

const router = useRouter();
const orders = ref([]);
const stokvelName = ref("");
const loading = ref(true);
const error = ref("");
const selectedStatus = ref("");

const statusOptions = computed(() => [...new Set(orders.value.map((order) => order.order_status).filter(Boolean))]);
const displayedOrders = computed(() => selectedStatus.value
  ? orders.value.filter((order) => order.order_status === selectedStatus.value)
  : orders.value);
const totalValue = computed(() => displayedOrders.value.reduce((sum, order) => sum + Number(order.total_amount || 0), 0));
const lastOrder = computed(() => displayedOrders.value[0] || null);
const lastOrderDate = computed(() => lastOrder.value ? formatDate(lastOrder.value.order_date) : "—");

function money(value) {
  return Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status) {
  return String(status || "unknown").toLowerCase().replace(/\s+/g, "-");
}

function goToCatalogue() {
  router.push("/catalogue");
}

async function loadHistory() {
  loading.value = true;
  error.value = "";
  try {
    const data = await getOrderHistory();
    orders.value = Array.isArray(data?.orders) ? data.orders : [];
    stokvelName.value = data?.stokvel?.stokvel_name || "";
  } catch (err) {
    console.error("Order history fetch failed:", err);
    orders.value = [];
    error.value = err.response?.data?.message || "Unable to load your order history.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadHistory);
</script>

<style scoped>
.history-page { min-height: 100vh; background: var(--sw-page-background); color: var(--sw-page-text); }
.history-wrap { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 52px 0 80px; }
.history-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 30px; }
.eyebrow { margin: 0 0 8px; color: var(--sw-gold-500); font: 800 11px var(--sw-font-body); letter-spacing: .16em; }
h1 { margin: 0; font: 800 clamp(42px, 6vw, 72px)/.95 var(--sw-font-heading); letter-spacing: -.04em; }
.intro { max-width: 650px; margin: 16px 0 0; color: var(--sw-page-text-soft); font: 15px/1.6 var(--sw-font-body); }
.stokvel-name { margin: 12px 0 0; color: var(--sw-page-text-soft); font: 700 12px var(--sw-font-body); }
.history-icon { width: 64px; height: 64px; display: grid; place-items: center; border: 1px solid var(--sw-input-border); border-radius: 20px; background: var(--sw-page-surface); font-size: 28px; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
.stat-card { padding: 20px; }
.stat-card span { display: block; color: var(--sw-page-text-soft); font: 800 10px var(--sw-font-body); letter-spacing: .12em; }
.stat-card strong { display: block; margin-top: 8px; font: 800 25px var(--sw-font-heading); }
.stat-card small { display: block; margin-top: 7px; color: var(--sw-page-text-soft); font: 11px var(--sw-font-body); }
.panel { padding: 22px; }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--sw-input-border); }
.panel-title { color: var(--sw-page-text); font: 800 11px var(--sw-font-body); letter-spacing: .12em; }
.muted { margin: 7px 0 0; color: var(--sw-page-text-soft); font: 12px/1.5 var(--sw-font-body); }
.status-filter { min-width: 145px; padding: 9px 11px; border: 1px solid var(--sw-input-border); border-radius: 9px; background: var(--sw-page-surface); color: var(--sw-page-text); font: 11px var(--sw-font-body); }
.state-card { display: grid; gap: 8px; place-items: center; min-height: 220px; padding: 30px; text-align: center; color: var(--sw-page-text-soft); font: 12px var(--sw-font-body); }
.state-card strong { color: var(--sw-page-text); font-size: 16px; }
.state-card button { margin-top: 8px; padding: 10px 16px; border: 1px solid var(--sw-gold-500); border-radius: 999px; background: var(--sw-gold-500); color: var(--sw-purple-900); cursor: pointer; font: 800 11px var(--sw-font-body); }
.state-card.error { color: var(--sw-orange-600); }
.orders-list { display: grid; }
.order-row { display: grid; grid-template-columns: 1.5fr 1fr auto; gap: 18px; align-items: center; padding: 18px 4px; border-bottom: 1px solid var(--sw-input-border); }
.order-row:last-child { border-bottom: 0; }
.order-main { display: flex; align-items: center; gap: 14px; }
.order-number { min-width: 58px; color: var(--sw-gold-500); font: 800 13px var(--sw-font-body); }
.order-main strong { display: block; font: 700 13px var(--sw-font-body); }
.order-row small { display: block; margin-top: 5px; color: var(--sw-page-text-soft); font: 10px var(--sw-font-body); }
.order-meta { display: grid; gap: 2px; }
.status { width: max-content; padding: 5px 9px; border-radius: 999px; background: rgba(200,176,25,.14); color: var(--sw-gold-500); font: 800 9px var(--sw-font-body); }
.status.processing, .status.in-transit { background: rgba(90,130,220,.14); color: #6f9eff; }
.status.completed, .status.delivered { background: rgba(55,170,105,.14); color: #48b97a; }
.status.cancelled, .status.failed { background: rgba(210,75,55,.14); color: #e27b6b; }
.order-total { white-space: nowrap; font: 800 14px var(--sw-font-body); }
@media (max-width: 760px) { .history-wrap { padding-top: 32px; } .history-heading { flex-direction: column; } .stats-grid { grid-template-columns: 1fr; } .panel-heading { flex-direction: column; } .status-filter { width: 100%; } .order-row { grid-template-columns: 1fr auto; } .order-meta { grid-column: 1; } .order-total { grid-column: 2; grid-row: 1 / span 2; } }
</style>
