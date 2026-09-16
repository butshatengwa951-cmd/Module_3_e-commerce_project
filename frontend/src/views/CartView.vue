<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  confirmCurrentOrder,
} from "../services/api.js";

const router = useRouter();
const items = ref([]);
const stokvel = ref(null);
const loading = ref(true);
const error = ref("");
const busyItemId = ref(null);
const confirmingOrder = ref(false);
const confirmedOrder = ref(null);

const total = computed(() =>
  items.value.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
);

const itemCount = computed(() =>
  items.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
);

onMounted(loadCart);

async function loadCart() {
  loading.value = true;
  error.value = "";

  try {
    const response = await getCart();
    items.value = response.items || [];
    stokvel.value = response.stokvel || null;
    notifyCartChange();
  } catch (err) {
    console.error("Failed to load group basket:", err);
    items.value = [];
    error.value = err.response?.data?.message || "Unable to load your group basket.";
  } finally {
    loading.value = false;
  }
}

async function changeQuantity(item, amount) {
  const nextQuantity = Number(item.quantity) + amount;

  if (nextQuantity <= 0) {
    await removeItem(item);
    return;
  }

  await setQuantity(item, nextQuantity);
}

async function setQuantity(item, quantity) {
  busyItemId.value = item.order_item_id;
  error.value = "";

  try {
    const response = await updateCartItem(item.order_item_id, quantity);
    const updated = response.item;

    item.quantity = Number(updated.quantity);
    item.subtotal = Number(updated.subtotal);
    notifyCartChange();
  } catch (err) {
    console.error("Failed to update basket item:", err);
    error.value = err.response?.data?.message || "Unable to update that item.";
  } finally {
    busyItemId.value = null;
  }
}

async function removeItem(item) {
  busyItemId.value = item.order_item_id;
  error.value = "";

  try {
    await removeCartItem(item.order_item_id);
    items.value = items.value.filter(
      (row) => row.order_item_id !== item.order_item_id,
    );
    notifyCartChange();
  } catch (err) {
    console.error("Failed to remove basket item:", err);
    error.value = err.response?.data?.message || "Unable to remove that item.";
  } finally {
    busyItemId.value = null;
  }
}

async function confirmOrder() {
  if (!items.value.length || confirmingOrder.value) {
    return;
  }

  confirmingOrder.value = true;
  error.value = "";

  try {
    const response = await confirmCurrentOrder();

    if (!response.success) {
      throw new Error(response.message || "Unable to confirm the order.");
    }

    confirmedOrder.value = response.order;
    notifyCartChange();
  } catch (err) {
    console.error("Failed to confirm order:", err);
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Unable to confirm the order.";
  } finally {
    confirmingOrder.value = false;
  }
}

function notifyCartChange() {
  window.dispatchEvent(
    new CustomEvent("cart-change", { detail: itemCount.value }),
  );
}

function formatMoney(value) {
  return `R ${Number(value || 0).toFixed(2)}`;
}

function continueShopping() {
  router.push("/catalogue");
}
</script>

<template>
  <main class="cart-page">
    <section class="cart-container">
      <div class="cart-heading">
        <div>
          <p class="eyebrow">GROUP BASKET</p>
          <h1>Your shared basket</h1>
          <p class="intro" v-if="stokvel">
            Shopping together with <strong>{{ stokvel.stokvel_name }}</strong>.
          </p>
          <p class="intro" v-else>Review the products your Stokvel is collecting.</p>
        </div>
        <button class="secondary-button" type="button" @click="continueShopping">
          Continue shopping
        </button>
      </div>

      <div v-if="error" class="message error-message">{{ error }}</div>
      <div v-if="confirmedOrder" class="message success-message">
        <strong>Order #{{ confirmedOrder.order_id }} confirmed.</strong>
        Your shared order is ready for the next checkout stage.
      </div>
      <div v-if="loading" class="state-card">Loading your group basket…</div>

      <div v-else-if="!items.length" class="empty-card">
        <div class="empty-icon">🛒</div>
        <h2>Your basket is empty</h2>
        <p>Add products from the catalogue and they will be shared with your Stokvel.</p>
        <button class="primary-button" type="button" @click="continueShopping">
          Browse catalogue
        </button>
      </div>

      <div v-else class="cart-layout">
        <section class="items-card">
          <div class="card-header">
            <div>
              <h2>Basket items</h2>
              <p>{{ itemCount }} item{{ itemCount === 1 ? "" : "s" }} in the shared basket</p>
            </div>
          </div>

          <article v-for="item in items" :key="item.order_item_id" class="cart-item">
            <div class="product-mark">✦</div>
            <div class="item-details">
              <h3>{{ item.product_name }}</h3>
              <p>{{ item.supplier_name || "Supplier selected" }}</p>
              <span>{{ formatMoney(item.unit_price) }} each</span>
            </div>

            <div class="quantity-control">
              <button
                type="button"
                :disabled="busyItemId === item.order_item_id || confirmedOrder"
                @click="changeQuantity(item, -1)"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <strong>{{ item.quantity }}</strong>
              <button
                type="button"
                :disabled="busyItemId === item.order_item_id || confirmedOrder"
                @click="changeQuantity(item, 1)"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <div class="item-total">{{ formatMoney(item.subtotal) }}</div>

            <button
              class="remove-button"
              type="button"
              :disabled="busyItemId === item.order_item_id || confirmedOrder"
              @click="removeItem(item)"
            >
              Remove
            </button>
          </article>
        </section>

        <aside class="summary-card">
          <p class="eyebrow">ORDER SUMMARY</p>
          <h2>Shared basket total</h2>
          <div class="summary-row">
            <span>Items</span>
            <span>{{ itemCount }}</span>
          </div>
          <div class="summary-row total-row">
            <span>Total</span>
            <strong>{{ formatMoney(total) }}</strong>
          </div>
          <p class="summary-note">
            Review your shared basket before continuing to the next checkout stage.
          </p>
          <button
            class="primary-button confirm-button"
            type="button"
            :disabled="confirmingOrder || !items.length || confirmedOrder"
            @click="confirmOrder"
          >
            {{
              confirmingOrder
                ? "Confirming order…"
                : confirmedOrder
                  ? "Order confirmed"
                  : "Confirm order"
            }}
          </button>
        </aside>
      </div>
    </section>
  </main>
</template>

<style scoped>
.cart-page {
  min-height: calc(100vh - 140px);
  background: var(--sw-bg, #f7f5ef);
  color: var(--sw-text, #17211b);
  padding: 48px 24px 80px;
}

.cart-container {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.cart-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--sw-primary, #2f6b45);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 10px;
  font-size: clamp(2.3rem, 5vw, 4.4rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.intro {
  margin-bottom: 0;
  color: var(--sw-muted, #66736a);
  font-size: 1rem;
}

.secondary-button,
.primary-button {
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.secondary-button {
  background: var(--sw-surface, #fff);
  color: var(--sw-text, #17211b);
  border: 1px solid var(--sw-border, #dce3dd);
}

.primary-button {
  background: var(--sw-primary, #2f6b45);
  color: #fff;
}

.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.message,
.state-card,
.empty-card,
.items-card,
.summary-card {
  border: 1px solid var(--sw-border, #dce3dd);
  border-radius: 22px;
  background: var(--sw-surface, #fff);
  box-shadow: 0 12px 35px rgba(31, 53, 39, 0.06);
}

.message {
  padding: 14px 18px;
  margin-bottom: 18px;
}

.error-message {
  color: #9b2c2c;
  background: #fff5f5;
}

.success-message {
  color: var(--sw-text, #17211b);
  background: var(--sw-accent-soft, #eef5ef);
}

.state-card,
.empty-card {
  padding: 56px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 2.6rem;
  margin-bottom: 12px;
}

.empty-card h2 {
  margin-bottom: 8px;
}

.empty-card p {
  max-width: 520px;
  margin: 0 auto 22px;
  color: var(--sw-muted, #66736a);
}

.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;
}

.items-card {
  overflow: hidden;
}

.card-header {
  padding: 24px;
  border-bottom: 1px solid var(--sw-border, #dce3dd);
}

.card-header h2 {
  margin-bottom: 5px;
}

.card-header p {
  margin-bottom: 0;
  color: var(--sw-muted, #66736a);
  font-size: 0.9rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--sw-border, #dce3dd);
}

.cart-item:last-child {
  border-bottom: 0;
}

.product-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: var(--sw-accent-soft, #eef5ef);
  color: var(--sw-primary, #2f6b45);
  font-size: 1.25rem;
}

.item-details h3 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.item-details p,
.item-details span {
  margin-bottom: 3px;
  color: var(--sw-muted, #66736a);
  font-size: 0.8rem;
}

.item-details span {
  display: block;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--sw-border, #dce3dd);
  border-radius: 999px;
  padding: 5px;
}

.quantity-control button {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: var(--sw-accent-soft, #eef5ef);
  color: var(--sw-primary, #2f6b45);
  font-size: 1.1rem;
  cursor: pointer;
}

.quantity-control button:disabled,
.remove-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-control strong {
  min-width: 18px;
  text-align: center;
}

.item-total {
  min-width: 90px;
  font-weight: 800;
  text-align: right;
}

.remove-button {
  border: 0;
  background: transparent;
  color: #9b4b4b;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}

.summary-card {
  padding: 26px;
  position: sticky;
  top: 24px;
}

.summary-card h2 {
  margin-bottom: 24px;
  font-size: 1.45rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  color: var(--sw-muted, #66736a);
  border-bottom: 1px solid var(--sw-border, #dce3dd);
}

.total-row {
  color: var(--sw-text, #17211b);
  border-bottom: 0;
  font-size: 1.15rem;
}

.summary-note {
  margin: 18px 0;
  color: var(--sw-muted, #66736a);
  font-size: 0.82rem;
  line-height: 1.55;
}

.confirm-button {
  width: 100%;
}

@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .summary-card {
    position: static;
  }
}

@media (max-width: 720px) {
  .cart-page {
    padding: 32px 16px 60px;
  }

  .cart-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .cart-item {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .quantity-control,
  .item-total,
  .remove-button {
    grid-column: 2;
  }

  .item-total {
    text-align: left;
  }
}
</style>
