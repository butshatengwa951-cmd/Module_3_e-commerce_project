<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { orderApi } from "../services/api.js";

const router = useRouter();
const orders = ref([]);
const loading = ref(true);
const error = ref("");
const theme = ref("light");
const stokvelId = 1;

const totalSpent = computed(() =>
  orders.value.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
);

onMounted(async () => {
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  syncTheme(savedTheme || systemTheme);
  window.addEventListener("theme-change", syncTheme);
  await fetchOrders();
});

function syncTheme(eventOrTheme) {
  const nextTheme =
    typeof eventOrTheme === "string" ? eventOrTheme : eventOrTheme?.detail;

  if (nextTheme === "light" || nextTheme === "dark") {
    theme.value = nextTheme;
  }
}

async function fetchOrders() {
  try {
    loading.value = true;
    const { data } = await orderApi.getOrders(stokvelId);
    orders.value = Array.isArray(data) ? data : data.data || [];
    orders.value.sort(
      (first, second) =>
        new Date(second.order_date || 0) - new Date(first.order_date || 0),
    );
    error.value = "";
  } catch (err) {
    console.error("Order history fetch failed:", err);
    orders.value = [];
    error.value = "Unable to load order history";
  } finally {
    loading.value = false;
  }
}

function formatMoney(value) {
  return "R " + Number(value || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status) {
  return String(status || "Pending")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function goToCatalogue() {
  router.push("/catalogue");
}
</script>

<template>
  <div class="history-page" :class="theme">
    <main class="history-shell">
      <section class="history-title-row">
        <div>
          <h1>Order History</h1>
          <p class="subtitle">A record of everything your group has ordered.</p>
        </div>
        <div class="order-badge">
          <span>Completed orders</span>
          <span class="item-count">{{ orders.length }}</span>
        </div>
      </section>

      <section class="layout">
        <section class="history-panel">
          <div class="table-head">Order Details - Status - Total</div>

          <div v-if="loading" class="loader">Loading order history...</div>
          <div v-else-if="error" class="loader">{{ error }}</div>
          <div v-else-if="!orders.length" class="empty-state">
            <span class="empty-icon">✦</span>
            <strong>No orders yet</strong>
            <p>Your confirmed orders will appear here.</p>
            <button class="catalogue-button" @click="goToCatalogue">
              Browse Catalogue
            </button>
          </div>

          <div v-else class="table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.order_id">
                  <td class="order-cell">
                    <span class="product-icon">✦</span>
                    <strong>#{{ order.order_id }}</strong>
                  </td>
                  <td>{{ formatDate(order.order_date) }}</td>
                  <td>
                    <span
                      class="status-pill"
                      :class="statusClass(order.order_status)"
                    >
                      {{ order.order_status || "Pending" }}
                    </span>
                  </td>
                  <td class="total-cell">
                    {{ formatMoney(order.total_amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="summary-panel">
          <div class="summary-card">
            <div class="summary-title">History Summary</div>
            <div class="summary-row">
              <span>Total orders</span>
              <span>{{ orders.length }}</span>
            </div>
            <div class="summary-total">
              <span>Total spent</span>
              <span>{{ formatMoney(totalSpent) }}</span>
            </div>
            <button class="catalogue-button" @click="goToCatalogue">
              Continue Shopping
            </button>
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html),
:global(body) {
  overflow-x: hidden;
  max-width: 100vw;
}

.history-page {
  min-height: 100vh;
  font-family: "Trebuchet MS", Arial, sans-serif;
  line-height: 1.45;
  transition:
    background 0.25s ease,
    color 0.25s ease;
}

.history-page.light {
  background: #f4efe9;
  color: #1f2435;
}

.history-page.dark {
  background: linear-gradient(180deg, #1b0f2d 0%, #1a1231 100%);
  color: #f3eef9;
}

.history-shell {
  padding: 30px 20px 80px;
  overflow: hidden;
  font-family: "Courier New", monospace;
}

.history-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.history-title-row h1 {
  margin: 0 0 10px;
  color: #211b37;
  font-family: "Trebuchet MS", Arial, sans-serif;
  font-size: clamp(50px, 6.2vw, 80px);
  font-weight: 900;
  line-height: 0.98;
}

.history-page.dark .history-title-row h1 {
  color: #f7f2ff;
}

.subtitle {
  margin: 0;
  color: #667085;
  font-family: "Trebuchet MS", Arial, sans-serif;
  font-size: 17px;
}

.order-badge {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  border-radius: 20px;
  background: #1d2233;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.history-page.dark .order-badge {
  background: #f5f0ff;
  color: #1e1230;
}

.item-count {
  padding: 4px 10px;
  border-radius: 20px;
  background: #f2df7d;
  color: #1d2233;
}

.layout {
  display: grid;
  grid-template-columns: minmax(630px, 3fr) minmax(260px, 1fr);
  gap: 18px;
  align-items: flex-start;
}

.history-panel,
.summary-card {
  overflow: hidden;
  border: 1px solid #dfe5df;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.04);
}

.history-page.dark .history-panel,
.history-page.dark .summary-card {
  border-color: rgba(174, 151, 223, 0.2);
  background: rgba(56, 42, 77, 0.72);
  color: #f2eef9;
}

.table-head {
  padding: 14px 20px;
  border-bottom: 1px solid #dfe5df;
  background: #f0efe9;
  color: #5f6474;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.history-page.dark .table-head {
  border-color: rgba(220, 210, 238, 0.28);
  background: rgba(39, 27, 57, 0.6);
  color: #e7def5;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.history-table th,
.history-table td {
  padding: 18px 16px;
}

.history-table th {
  color: #211b37;
  font-size: 12px;
  text-transform: uppercase;
}

.history-page.dark .history-table th {
  color: #f7f2ff;
}

.history-table tbody tr {
  border-top: 1px solid #e8e8e8;
}

.history-page.dark .history-table tbody tr {
  border-color: rgba(220, 210, 238, 0.28);
}

.order-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 62px;
}

.product-icon,
.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  background: #eaf7ed;
  color: #d2ae08;
  font-size: 18px;
}

.status-pill {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 9999px;
  background: #f2df7d;
  color: #1d4a3c;
  font-weight: 700;
  white-space: nowrap;
}

.status-pill.cancelled {
  background: #f5d4ce;
  color: #8f3324;
}

.status-pill.pending {
  background: #e4e1f7;
  color: #4c4077;
}

.total-cell {
  font-weight: 800;
}

.loader,
.empty-state {
  padding: 72px 24px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 14px;
}

.empty-state strong {
  display: block;
  font-size: 16px;
}

.empty-state p {
  margin: 8px 0 20px;
  color: #667085;
  font-size: 12px;
}

.summary-card {
  padding: 20px;
}

.summary-title {
  padding-bottom: 14px;
  border-bottom: 1px solid #dde1dd;
  color: #181d2c;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.history-page.dark .summary-title {
  border-color: rgba(174, 151, 223, 0.22);
  color: #f7f2ff;
}

.summary-row,
.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #eff0ee;
  font-size: 12px;
}

.summary-total {
  border-bottom: 0;
  color: #1d2233;
  font-weight: 900;
}

.history-page.dark .summary-total {
  color: #fff;
}

.catalogue-button {
  width: 100%;
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid rgba(29, 34, 51, 0.2);
  border-radius: 8px;
  background: #f4efe9;
  color: #1d2233;
  cursor: pointer;
  font:
    800 12px "Courier New",
    monospace;
}

.history-page.dark .catalogue-button {
  border-color: rgba(194, 175, 255, 0.35);
  background: rgba(164, 135, 219, 0.12);
  color: #f2eef9;
}

@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .history-title-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 680px) {
  .layout {
    overflow-x: auto;
  }

  .history-panel {
    min-width: 620px;
  }
}
</style>
