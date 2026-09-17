<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getCart, updateCartItem, removeCartItem, confirmCurrentOrder } from "../services/api.js";
import { readCheckoutState, saveCartState, saveCheckoutState, clearCartState } from "../composables/useCartState.js";

const router = useRouter();
const items = ref([]);
const stokvel = ref(null);
const order = ref(null);
const loading = ref(true);
const error = ref("");
const busyItemId = ref(null);
const confirmingOrder = ref(false);

const total = computed(() => items.value.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
const itemCount = computed(() => items.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0));

function syncState() { saveCartState({ items: items.value, order: order.value, stokvel: stokvel.value }); }

async function loadCart() {
  loading.value = true; error.value = "";
  try {
    const response = await getCart();
    items.value = response.items || [];
    stokvel.value = response.stokvel || null;
    order.value = response.order || null;

    // A confirmed order is no longer returned by /api/cart, but it is still
    // the user's active checkout until payment succeeds. Restore that snapshot
    // when returning from Payment instead of showing an empty basket.
    if (!items.value.length) {
      const checkout = readCheckoutState();
      if (checkout?.items?.length && checkout?.order?.order_status === "Confirmed") {
        items.value = checkout.items;
        stokvel.value = checkout.stokvel || null;
        order.value = checkout.order;
        syncState();
      } else {
        clearCartState();
      }
    } else {
      syncState();
    }
  } catch (err) {
    console.error("Failed to load group basket:", err);

    // If the backend is temporarily unavailable, retain the last checkout
    // snapshot so navigating back does not destroy the user's visible cart.
    const checkout = readCheckoutState();
    if (checkout?.items?.length && checkout?.order?.order_status === "Confirmed") {
      items.value = checkout.items;
      stokvel.value = checkout.stokvel || null;
      order.value = checkout.order;
      syncState();
    } else {
      error.value = err.response?.data?.message || "Unable to load your group basket.";
    }
  } finally { loading.value = false; }
}

async function changeQuantity(item, amount) { const next = Number(item.quantity) + amount; if (next <= 0) return removeItem(item); await setQuantity(item, next); }
async function setQuantity(item, quantity) {
  busyItemId.value = item.order_item_id; error.value = "";
  try { const response = await updateCartItem(item.order_item_id, quantity); const updated = response.item; item.quantity = Number(updated.quantity); item.subtotal = Number(updated.subtotal); syncState(); }
  catch (err) { error.value = err.response?.data?.message || "Unable to update that item."; }
  finally { busyItemId.value = null; }
}
async function removeItem(item) {
  busyItemId.value = item.order_item_id; error.value = "";
  try { await removeCartItem(item.order_item_id); items.value = items.value.filter((row) => row.order_item_id !== item.order_item_id); if (items.value.length) syncState(); else clearCartState(); }
  catch (err) { error.value = err.response?.data?.message || "Unable to remove that item."; }
  finally { busyItemId.value = null; }
}
async function confirmOrder() {
  if (!items.value.length || confirmingOrder.value) return;
  confirmingOrder.value = true; error.value = "";
  try {
    const response = await confirmCurrentOrder();
    if (!response.success) throw new Error(response.message || "Unable to confirm the order.");
    order.value = response.order;
    saveCheckoutState({ order: response.order, items: items.value, stokvel: stokvel.value });
    syncState();
    router.push({ path: "/payment", query: { order_id: response.order.order_id } });
  } catch (err) { error.value = err.response?.data?.message || err.message || "Unable to confirm the order."; }
  finally { confirmingOrder.value = false; }
}
function continueShopping() { router.push("/catalogue"); }
function formatMoney(value) { return `R ${Number(value || 0).toFixed(2)}`; }

onMounted(loadCart);
</script>

<template>
  <main class="cart-page"><section class="cart-container">
    <div class="cart-heading"><div><p class="eyebrow">GROUP BASKET</p><h1>Your shared basket</h1><p class="intro" v-if="stokvel">Shopping together with <strong>{{ stokvel.stokvel_name }}</strong>.</p><p class="intro" v-else>Review the products your Stokvel is collecting.</p></div><button class="secondary-button" type="button" @click="continueShopping">Continue shopping</button></div>
    <div v-if="error" class="message error-message">{{ error }}</div><div v-if="loading" class="state-card">Loading your group basket…</div>
    <div v-else-if="!items.length" class="empty-card"><div class="empty-icon">🛒</div><h2>Your basket is empty</h2><p>Add products from the catalogue and they will be shared with your Stokvel.</p><button class="primary-button" type="button" @click="continueShopping">Browse catalogue</button></div>
    <div v-else class="cart-layout"><section class="items-card"><div class="card-header"><div><h2>Basket items</h2><p>{{ itemCount }} item{{ itemCount === 1 ? "" : "s" }} in the shared basket</p></div></div>
      <article v-for="item in items" :key="item.order_item_id" class="cart-item"><div class="product-image-wrap"><img v-if="item.image_url" :src="item.image_url" :alt="item.product_name" class="product-image" /><div v-else class="product-placeholder">🛒</div></div><div class="item-details"><h3>{{ item.product_name }}</h3><p>{{ item.supplier_name }}</p><strong>{{ formatMoney(item.unit_price) }} each</strong></div><div class="quantity-control"><button type="button" :disabled="busyItemId === item.order_item_id" @click="changeQuantity(item,-1)">−</button><span>{{ item.quantity }}</span><button type="button" :disabled="busyItemId === item.order_item_id" @click="changeQuantity(item,1)">+</button></div><div class="item-total">{{ formatMoney(item.subtotal) }}</div><button class="remove-button" type="button" :disabled="busyItemId === item.order_item_id" @click="removeItem(item)">Remove</button></article>
    </section><aside class="summary-card"><p class="eyebrow">ORDER SUMMARY</p><h2>Shared order</h2><div class="summary-line"><span>Items</span><strong>{{ itemCount }}</strong></div><div class="summary-line total-line"><span>Total</span><strong>{{ formatMoney(total) }}</strong></div><button class="primary-button confirm-button" type="button" :disabled="confirmingOrder || !items.length" @click="confirmOrder">{{ confirmingOrder ? "Confirming order…" : "Confirm order" }}</button><p class="summary-note">Confirming your basket moves it to the Payment stage.</p></aside></div>
  </section></main>
</template>

<style scoped>
.cart-page{min-height:calc(100vh - 68px);padding:36px 24px 60px;background:var(--sw-bg,#f7f5ef);color:var(--sw-text,#17211b)}.cart-container{max-width:1180px;margin:0 auto}.cart-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:28px}.eyebrow{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--sw-primary,#5b3a82)}h1{margin:0;font-size:42px;color:var(--sw-text,#17211b)}h2{margin:8px 0 10px;color:var(--sw-text,#17211b)}.intro,.summary-note,.card-header p,.item-details p{color:var(--sw-muted,#68736d);line-height:1.6}.secondary-button,.primary-button,.remove-button,.quantity-control button{cursor:pointer}.secondary-button{padding:13px 20px;border-radius:999px;border:1px solid var(--sw-border,#d9ddd8);background:transparent;color:var(--sw-text,#17211b);font-weight:800}.message{padding:14px 16px;border-radius:14px;margin-bottom:20px}.error-message{background:rgba(220,70,70,.1);color:#b42318}.state-card,.empty-card,.items-card,.summary-card{border:1px solid var(--sw-border,#d9ddd8);background:var(--sw-surface,#fff);border-radius:24px;box-shadow:var(--sw-card-shadow,0 10px 30px rgba(0,0,0,.06))}.state-card,.empty-card{padding:50px 28px;text-align:center}.empty-icon{font-size:42px}.primary-button{border:0;border-radius:999px;padding:14px 22px;background:var(--sw-primary,#5b3a82);color:#fff;font-weight:800}.cart-layout{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:24px;align-items:start}.items-card{overflow:hidden}.card-header{padding:24px 26px;border-bottom:1px solid var(--sw-border,#d9ddd8)}.card-header h2{margin:0 0 4px}.card-header p{margin:0;font-size:13px}.cart-item{display:grid;grid-template-columns:72px minmax(0,1fr) auto auto auto;align-items:center;gap:18px;padding:20px 24px;border-bottom:1px solid var(--sw-border,#d9ddd8)}.cart-item:last-child{border-bottom:0}.product-image-wrap,.product-placeholder{width:72px;height:72px;border-radius:14px;overflow:hidden;background:var(--sw-accent-soft,#f2f0f5);display:grid;place-items:center}.product-image{width:100%;height:100%;object-fit:cover}.product-placeholder{font-size:28px}.item-details h3{margin:0 0 5px;color:var(--sw-text,#17211b)}.item-details p{margin:0 0 5px;font-size:12px}.item-details strong,.item-total{color:var(--sw-text,#17211b)}.quantity-control{display:flex;align-items:center;gap:10px;border:1px solid var(--sw-border,#d9ddd8);border-radius:999px;padding:4px}.quantity-control button{width:30px;height:30px;border:0;border-radius:50%;background:var(--sw-accent-soft,#f2f0f5);color:var(--sw-text,#17211b);font-size:18px}.quantity-control button:disabled{opacity:.5;cursor:not-allowed}.quantity-control span{min-width:20px;text-align:center;font-weight:800}.remove-button{border:0;background:transparent;color:#b42318;font-size:12px;font-weight:700}.remove-button:disabled{opacity:.5;cursor:not-allowed}.summary-card{padding:26px;position:sticky;top:90px}.summary-line{display:flex;justify-content:space-between;padding:15px 0;border-bottom:1px solid var(--sw-border,#d9ddd8);color:var(--sw-muted,#68736d)}.summary-line strong{color:var(--sw-text,#17211b)}.total-line{border-bottom:0;font-size:18px}.confirm-button{width:100%;margin-top:10px}.confirm-button:disabled{opacity:.5;cursor:not-allowed}.summary-note{font-size:12px;margin:12px 0 0;text-align:center}@media(max-width:900px){.cart-layout{grid-template-columns:1fr}.summary-card{position:static}}@media(max-width:700px){.cart-heading{flex-direction:column}h1{font-size:34px}.cart-item{grid-template-columns:56px 1fr}.product-image-wrap,.product-placeholder{width:56px;height:56px}.quantity-control,.item-total,.remove-button{grid-column:2;justify-self:start}}
</style>
