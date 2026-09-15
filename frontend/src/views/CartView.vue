<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import api, { cartApi, cartStep } from "../services/api.js";

const router = useRouter();

const cart = ref([]);
const loading = ref(true);
const orderId = ref(null);
const stokvelId = ref(1);
const error = ref("");
const theme = ref("light");

const total = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + Number(item.subtotal || item.unit_price * item.quantity || 0);
  }, 0);
});

onMounted(async () => {
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  syncCartTheme(savedTheme || systemTheme);
  window.addEventListener("theme-change", syncCartTheme);

  await fetchCart();
});

function syncCartTheme(eventOrTheme) {
  const nextTheme =
    typeof eventOrTheme === "string" ? eventOrTheme : eventOrTheme?.detail;

  if (nextTheme === "light" || nextTheme === "dark") {
    theme.value = nextTheme;
  }
}

async function fetchCart() {
  try {
    loading.value = true;
    const { data } = await cartApi.getCart(stokvelId.value);
    cart.value = data.items || [];
    orderId.value = data.order_id || null;
    error.value = "";
  } catch (err) {
    console.error("Cart fetch failed:", err);
    cart.value = [];
    error.value = "Unable to load cart";
  } finally {
    loading.value = false;
    notifyCartChange();
  }
}

function notifyCartChange() {
  const itemCount = cart.value.length;
  window.dispatchEvent(new CustomEvent("cart-change", { detail: itemCount }));
}

async function increment(item) {
  const nextQty = Number(item.quantity) + cartStep;

  try {
    await cartApi.updateQty(item.order_item_id, nextQty);
    item.quantity = nextQty;
    item.subtotal = Number(item.unit_price) * nextQty;
    notifyCartChange();
  } catch (err) {
    console.error("updateQty failed:", err.response?.data || err.message);
    alert("Update failed: " + (err.response?.data?.error || err.message));
  }
}

async function decrement(item) {
  if (Number(item.quantity) <= cartStep) {
    await removeItem(item);
    return;
  }

  const nextQty = Number(item.quantity) - cartStep;

  try {
    await cartApi.updateQty(item.order_item_id, nextQty);
    item.quantity = nextQty;
    item.subtotal = Number(item.unit_price) * nextQty;
    notifyCartChange();
  } catch (err) {
    console.error("updateQty failed:", err.response?.data || err.message);
    alert("Update failed: " + (err.response?.data?.error || err.message));
  }
}

async function removeItem(item) {
  try {
    await cartApi.removeItem(item.order_item_id);
    cart.value = cart.value.filter(
      (row) => row.order_item_id !== item.order_item_id,
    );
    notifyCartChange();
  } catch (err) {
    console.error("remove failed:", err.response?.data || err.message);
    alert("Remove failed: " + (err.response?.data?.error || err.message));
  }
}

async function confirmOrder() {
  try {
    if (!orderId.value) {
      error.value = "No order found";
      return;
    }

    await api.put(`/api/orders/${orderId.value}/confirm`);
    error.value = "";
    await fetchCart();
  } catch (err) {
    console.error("Unable to confirm order", err);
    error.value = "Unable to confirm order";
  }
}

function formatMoney(value) {
  return "R " + Number(value || 0).toFixed(2);
}

function getSupplierName(item) {
  return item?.supplier_name || item?.supplier || "Supplier unavailable";
}

function goToCatalogue() {
  router.push("/catalogue");
}
</script>

<template>
  <div class="cart-page" :class="theme">
    <main class="cart-shell">
      <section class="cart-title-row">
        <div>
          <h1>Shopping Cart</h1>
          <p class="subtitle"></p>
        </div>
        <div class="header-actions">
          <div class="order-badge">
            <span>In cart</span>
            <span class="item-count"
              >{{ cart.length }} item{{ cart.length === 1 ? "" : "s" }}</span
            >
          </div>
        </div>
      </section>

      <section class="layout">
        <section class="cart-panel">
          <div class="table-head">
            <span>Cart Items — Order Items — Products — Supplier Prices</span>
          </div>

          <div v-if="loading" class="loader">Loading cart…</div>

          <div v-else-if="error" class="loader">{{ error }}</div>

          <div class="cart-table-wrapper" v-else>
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cart" :key="item.order_item_id">
                  <td class="product-cell">
                    <div class="product-content">
                      <span class="product-icon">✦</span>
                      <div class="product-info">
                        <strong>{{ item.product_name }}</strong>
                      </div>
                    </div>
                  </td>
                  <td class="supplier-cell">
                    <span class="supplier-name">{{
                      getSupplierName(item)
                    }}</span>
                  </td>
                  <td class="price-cell">
                    <span class="unit-price">{{
                      formatMoney(item.unit_price)
                    }}</span>
                  </td>
                  <td class="qty-cell">
                    <span class="qty-step">
                      <button class="step-btn" @click="decrement(item)">
                        −
                      </button>
                      <span class="qty-value">{{ item.quantity }}</span>
                      <button class="step-btn" @click="increment(item)">
                        +
                      </button>
                    </span>
                  </td>
                  <td class="subtotal-cell">
                    <span class="subtotal-value">{{
                      formatMoney(item.subtotal)
                    }}</span>
                  </td>
                  <td class="delete-cell">
                    <button
                      class="delete-btn"
                      aria-label="Delete item"
                      @click="removeItem(item)"
                    >
                      <span class="bin-icon" aria-hidden="true">🗑</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="summary-panel">
          <div class="summary-card">
            <div class="summary-title">Order Summary</div>
            <div class="summary-row">
              <span
                >Subtotal ({{ cart.length }} item{{
                  cart.length === 1 ? "" : "s"
                }})</span
              >
              <span class="total-money">{{ formatMoney(total) }}</span>
            </div>
            <div class="summary-total">
              <span>Total</span>
              <span>{{ formatMoney(total) }}</span>
            </div>

            <button class="confirm-button" @click="confirmOrder">
              Confirm Order
            </button>

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

.cart-page {
  min-height: 100vh;
  font-family: "Trebuchet MS", Arial, sans-serif;
  font-size: 16px;
  line-height: 1.45;
  transition:
    background 0.25s ease,
    color 0.25s ease;
}

.cart-page.light {
  background: #f4efe9;
  color: #1f2435;
}

.cart-page.dark {
  background: linear-gradient(180deg, #1b0f2d 0%, #1a1231 100%);
  color: #f3eef9;
}

.cart-shell {
  max-width: 100%;
  margin: 0 auto;
  padding: 30px 20px 80px;
  overflow: hidden;
  position: relative;
  font-family: "Courier New", monospace;
}

.cart-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(255, 255, 255, 0.22);
  color: inherit;
  cursor: pointer;
  font-size: 18px;
}

.cart-title-row h1 {
  max-width: 900px;
  font-family: "Trebuchet MS", Arial, sans-serif;
  font-size: clamp(50px, 6.2vw, 80px);
  font-weight: 900;
  line-height: 0.98;
  letter-spacing: 0;
  margin: 0 0 10px;
  color: #211b37;
}

.cart-page.dark .cart-title-row h1 {
  color: #f7f2ff;
}

.subtitle {
  max-width: 650px;
  color: #667085;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.5;
  margin: 0;
}

.order-badge {
  background: #1d2233;
  color: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(17, 24, 39, 0.08);
}

.item-count {
  border-radius: 20px;
  background: #f2df7d;
  color: #1d2233;
  padding: 4px 10px;
  font-weight: 700;
}

.cart-page.dark .order-badge {
  background: #f5f0ff;
  color: #1e1230;
}

.cart-page.dark .item-count {
  background: #f4d774;
  color: #1e1230;
}

.layout {
  display: grid;
  grid-template-columns: minmax(630px, 3fr) minmax(260px, 1fr);
  gap: 18px;
  align-items: flex-start;
}

.cart-panel {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid #dfe5df;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.04);
  padding: 0;
  overflow: hidden;
}

.cart-panel,
.summary-panel,
.cart-panel button,
.summary-panel button {
  font-family: "Courier New", monospace;
}

.cart-page.dark .cart-panel {
  background: rgba(56, 42, 77, 0.72);
  border-color: rgba(174, 151, 223, 0.2);
  box-shadow: 0 0 0 1px rgba(190, 171, 230, 0.08);
}

.table-head {
  background: #f0efe9;
  color: #5f6474;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 14px 20px;
  border-bottom: 1px solid #dfe5df;
}

.cart-page.dark .table-head {
  background: rgba(24, 17, 38, 0.95);
  color: #d8d0ee;
  border-color: rgba(174, 151, 223, 0.16);
}

.cart-table-wrapper {
  padding: 0 16px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.cart-table-wrapper::-webkit-scrollbar {
  display: none;
}

.cart-table {
  width: 100%;
  min-width: 860px;
  table-layout: fixed;
  border-collapse: collapse;
}

.cart-table th,
.cart-table td {
  padding: 16px 12px;
  vertical-align: middle;
  text-align: left;
}

.cart-table th {
  color: #211b37;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cart-page.dark .cart-table th {
  color: #f7f2ff;
}

.cart-table th:nth-child(1),
.cart-table td:nth-child(1) {
  width: 28%;
}

.cart-table th:nth-child(2),
.cart-table td:nth-child(2) {
  width: 20%;
}

.cart-table th:nth-child(3),
.cart-table td:nth-child(3) {
  width: 12%;
}

.cart-table th:nth-child(4),
.cart-table td:nth-child(4) {
  width: 15%;
}

.cart-table th:nth-child(5),
.cart-table td:nth-child(5) {
  width: 15%;
}

.cart-table th:nth-child(6),
.cart-table td:nth-child(6) {
  width: 10%;
  text-align: center;
}

.cart-table td {
  padding: 18px 10px;
  font-size: 12px;
}

.cart-table tbody tr {
  border-top: 1px solid #e8e8e8;
}

.cart-page.dark .cart-table tbody tr {
  border-color: rgba(220, 210, 238, 0.28);
}

.product-cell {
  vertical-align: middle;
}

.product-content {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 94px;
}

.product-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #eaf7ed;
  align-items: center;
  justify-content: center;
  color: #f2df7d;
  font-size: 18px;
  flex-shrink: 0;
}

.product-info strong {
  display: block;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}

.product-info small {
  display: block;
  color: #667085;
  margin-top: 4px;
  font-size: 11px;
}

.supplier-cell {
  white-space: nowrap;
  padding-left: 0;
}

.supplier-name {
  display: inline-block;
  background: #f2df7d;
  color: #1d4a3c;
  padding: 7px 14px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  min-width: 120px;
  text-align: center;
}

.cart-page.dark .supplier-name {
  border: 1px solid rgba(209, 195, 245, 0.24);
}

.cart-table th:nth-child(2),
.cart-table td:nth-child(2) {
  min-width: 110px;
}

.unit-price,
.subtotal-value {
  font-weight: 800;
}

.qty-cell {
  vertical-align: middle;
}

.qty-step {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.step-btn {
  border-radius: 50%;
  border: 1px solid #c3c9cc;
  background: #fff;
  min-width: 42px;
  width: 42px;
  height: 42px;
  padding: 0;
  font-size: 24px;
  line-height: 1;
  font-weight: 500;
  cursor: pointer;
}

.cart-page.dark .step-btn {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(211, 200, 233, 0.35);
  color: #f5f0ff;
}

.step-btn:hover {
  background: #eef3ee;
  border-color: #385a3f;
}

.cart-page.dark .step-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

.qty-value {
  font-size: 12px;
  font-weight: 700;
}

.delete-cell {
  text-align: center;
}

.delete-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #a11212;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 180ms ease,
    transform 180ms ease,
    border-color 180ms ease;
}

.cart-page.dark .delete-btn {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(208, 177, 233, 0.35);
  color: #ffd7df;
}

.delete-btn:hover {
  background: #ffecef;
  border-color: #cc2f45;
  transform: translateY(-2px);
}

.cart-page.dark .delete-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(208, 177, 233, 0.5);
}

.bin-icon {
  font-size: 22px;
  line-height: 1;
}

.sql-note {
  padding: 16px 20px;
  color: #667085;
  background: #f8f9f7;
  font-size: 12px;
  font-family: monospace;
  border-top: 1px solid #d7d8d2;
}

.loader {
  padding: 30px;
  color: #667085;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-card {
  background: rgba(255, 255, 255, 0.82);
  border-radius: 18px;
  border: 1px solid #d8d8d8;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.04);
}

.cart-page.dark .summary-card {
  background: rgba(44, 32, 66, 0.9);
  border-color: rgba(168, 150, 214, 0.2);
  color: #f2eef9;
}

.summary-title {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.2;
  text-transform: uppercase;
  color: #181d2c;
  padding-bottom: 14px;
  border-bottom: 1px solid #dde1dd;
}

.cart-page.dark .summary-title {
  color: #f7f2ff;
  border-color: rgba(174, 151, 223, 0.22);
}

.summary-row,
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #eff0ee;
  font-size: 12px;
}

.summary-row:last-of-type {
  border-bottom: none;
}

.summary-total {
  font-weight: 900;
  font-size: 12px;
  color: white;
}

.total-money {
  font-weight: 800;
}

.delivery-money {
  color: #111827;
}

.confirm-button {
  width: 100%;
  background: #e8c85c;
  color: #1d2233;
  font-size: 12px;
  font-weight: 800;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-top: 16px;
  box-shadow: 0 4px 12px rgba(232, 200, 92, 0.22);
}

.cart-page.dark .confirm-button {
  background: #f4d774;
  color: #1d1231;
}

.catalogue-button {
  width: 100%;
  background: #f4efe9;
  color: #1d2233;
  font-size: 12px;
  font-weight: 800;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(29, 34, 51, 0.2);
  cursor: pointer;
  margin-top: 12px;
}

.cart-page.dark .catalogue-button {
  background: rgba(164, 135, 219, 0.12);
  border-color: rgba(194, 175, 255, 0.35);
  color: #f2eef9;
}

.update-note {
  color: #667085;
  font-size: 11px;
  padding-top: 12px;
  border-top: 1px solid #eef1ea;
  margin-top: 14px;
}

@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .cart-title-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
