<script setup>
import { ref, onMounted, computed } from "vue";
import api, { cartApi, cartStep } from "../services/api.js";

const cart = ref([]);
const loading = ref(true);
const orderId = ref(null);
const stokvelId = ref(1);
const error = ref("");

const total = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + Number(item.subtotal || item.unit_price * item.quantity || 0);
  }, 0);
});

onMounted(async () => {
  await fetchCart();
});

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
  }
}

async function increment(item) {
  try {
    await cartApi.updateQty(
      item.order_item_id,
      Number(item.quantity) + cartStep,
    );
    await fetchCart();
  } catch (err) {
    console.error("updateQty failed:", err.response?.data || err.message);
    alert("Update failed: " + (err.response?.data?.error || err.message));
  }
}

async function decrement(item) {
  if (Number(item.quantity) <= cartStep) return removeItem(item);

  try {
    await cartApi.updateQty(
      item.order_item_id,
      Number(item.quantity) - cartStep,
    );
    await fetchCart();
  } catch (err) {
    console.error("updateQty failed:", err.response?.data || err.message);
    alert("Update failed: " + (err.response?.data?.error || err.message));
  }
}

async function removeItem(item) {
  try {
    await cartApi.removeItem(item.order_item_id);
    await fetchCart();
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
</script>

<template>
  <div class="cart-page">
    <main class="cart-shell">
      <section class="cart-title-row">
        <div>
          <h1>Shopping Cart</h1>
          <p class="subtitle">
            Data loaded from MySQL via /api/1 → endpoints — no hardcoded prices
            in Vue
          </p>
        </div>
        <div class="order-badge">
          <span>Pending order · order_status='Pending'</span>
          <span class="item-count"
            >{{ cart.length }} item{{ cart.length === 1 ? "" : "s" }}</span
          >
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
                    <span class="product-icon">✦</span>
                    <div class="product-info">
                      <strong>{{ item.product_name }}</strong>
                      <small
                        >p.product_id={{ item.product_id }} ·
                        sp.supplier_price_id={{ item.supplier_price_id }}</small
                      >
                    </div>
                  </td>
                  <td class="supplier-cell">
                    <span class="supplier-name">{{ item.supplier_name }}</span>
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

          <div class="sql-note">
            <span
              >SQL: FROM order_items JOIN products JOIN supplier_prices WHERE
              od.stokvel_id={{ stokvelId }}</span
            >
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
            <div class="summary-row">
              Delivery (Van) <span class="delivery-money">R 0.00</span>
            </div>
            <div class="summary-total">
              <span>Total</span>
              <span>{{ formatMoney(total) }}</span>
            </div>

            <button class="confirm-button" @click="confirmOrder">
              Confirm Order → PUT /api/orders/{{ orderId }}/confirm
            </button>
            <div class="update-note">
              Updates order_details.order_status = 'Confirmed'
            </div>
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

.cart-page {
  min-height: 100vh;
  background: #eef1ea;
  font-family: Inter, Arial, sans-serif;
  color: #1f2937;
}

.cart-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px 80px;
}

.cart-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.cart-title-row h1 {
  font-size: clamp(36px, 4vw, 46px);
  font-weight: 800;
  color: #111827;
  margin: 0 0 10px;
}

.subtitle {
  color: #667085;
  font-size: 16px;
  margin: 0;
}

.order-badge {
  background: #111827;
  color: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
}

.item-count {
  border-radius: 20px;
  background: #e7e9eb;
  color: #111827;
  padding: 4px 10px;
  font-weight: 700;
}

.layout {
  display: grid;
  grid-template-columns: minmax(700px, 3fr) minmax(280px, 1fr);
  gap: 24px;
  align-items: flex-start;
}

.cart-panel {
  background: #fff;
  border: 1px solid #d8d8d8;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 0;
  overflow: hidden;
}

.table-head {
  background: #eef1eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 14px 20px;
  border-bottom: 1px solid #d7d8d2;
}

.cart-table-wrapper {
  padding: 0 16px;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
}

.cart-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 800;
  color: #667085;
  padding: 16px 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.cart-table th:nth-child(1),
.cart-table td:nth-child(1) {
  width: 34%;
}

.cart-table td {
  border-top: 1px solid #e8e8e8;
  padding: 16px 12px;
  font-size: 14px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #eaf7ed;
  align-items: center;
  justify-content: center;
  color: #57a25e;
  font-size: 22px;
}

.product-info strong {
  display: block;
  font-size: 16px;
  color: #111827;
}

.product-info small {
  display: block;
  color: #667085;
  margin-top: 4px;
  font-size: 11px;
}

.supplier-cell {
  white-space: nowrap;
}

.supplier-name {
  display: inline-block;
  background: #bbf7d0;
  color: #065f46;
  padding: 6px 12px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
}

.cart-table th:nth-child(2),
.cart-table td:nth-child(2) {
  min-width: 140px;
}

.unit-price,
.subtotal-value {
  color: #111827;
  font-weight: 800;
}

.qty-step {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-btn {
  border-radius: 50%;
  border: 1px solid #c3c9cc;
  background: #fff;
  min-width: 44px;
  height: 34px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.step-btn:hover {
  background: #eef3ee;
  border-color: #385a3f;
}

.qty-value {
  font-size: 16px;
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

.delete-btn:hover {
  background: #ffecef;
  border-color: #cc2f45;
  transform: translateY(-2px);
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
  background: #fff;
  border-radius: 16px;
  border: 1px solid #d8d8d8;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.summary-title {
  font-size: 16px;
  font-weight: 800;
  color: #111827;
  padding-bottom: 14px;
  border-bottom: 1px solid #dde1dd;
}

.summary-row,
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #eff0ee;
  font-size: 14px;
  color: #374151;
}

.summary-row:last-of-type {
  border-bottom: none;
}

.summary-total {
  font-weight: 900;
  font-size: 20px;
  color: #111827;
}

.total-money {
  font-weight: 800;
}

.delivery-money {
  color: #111827;
}

.confirm-button {
  width: 100%;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-top: 16px;
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
