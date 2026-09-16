<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getPaymentOptions, payCurrentOrder } from "../services/api.js";

const router = useRouter();
const loading = ref(true);
const paying = ref(false);
const error = ref("");
const order = ref(null);
const cards = ref([]);
const selectedCardId = ref(null);
const deliveryAddress = ref("");
const paymentComplete = ref(false);

const selectedCard = computed(() =>
  cards.value.find((card) => Number(card.card_id) === Number(selectedCardId.value)) || null,
);

onMounted(loadPayment);

async function loadPayment() {
  loading.value = true;
  error.value = "";

  try {
    const response = await getPaymentOptions();
    order.value = response.order;
    cards.value = response.cards || [];
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      "Unable to load the payment stage. Please return to your basket.";
  } finally {
    loading.value = false;
  }
}

async function pay() {
  if (!selectedCardId.value || !deliveryAddress.value.trim() || paying.value) return;

  paying.value = true;
  error.value = "";

  try {
    await payCurrentOrder({
      card_id: selectedCardId.value,
      delivery_address: deliveryAddress.value.trim(),
    });

    paymentComplete.value = true;
  } catch (err) {
    error.value = err.response?.data?.message || "Payment could not be completed.";
  } finally {
    paying.value = false;
  }
}

function continueToDelivery() {
  if (order.value?.delivery_id) {
    router.push({ path: "/delivery", query: { delivery_id: order.value.delivery_id } });
  }
}

function backToCart() {
  router.push("/cart");
}

function formatMoney(value) {
  return `R ${Number(value || 0).toFixed(2)}`;
}
</script>

<template>
  <main class="payment-page">
    <section class="payment-container">
      <div class="heading-row">
        <div>
          <p class="eyebrow">CHECKOUT · STEP 6</p>
          <h1>Payment</h1>
          <p class="intro">Pay for your confirmed Stokvel order securely.</p>
        </div>
        <button class="secondary-button" type="button" @click="backToCart">Back to cart</button>
      </div>

      <div v-if="error" class="message error-message">{{ error }}</div>
      <div v-if="loading" class="state-card">Loading payment details…</div>

      <div v-else-if="paymentComplete" class="success-card">
        <div class="success-icon">✓</div>
        <p class="eyebrow">PAYMENT COMPLETE</p>
        <h2>Payment successful</h2>
        <p>Your order is now processing and your delivery details have been recorded.</p>
        <button class="primary-button" type="button" @click="continueToDelivery">
          Continue to delivery
        </button>
      </div>

      <div v-else-if="order" class="payment-layout">
        <section class="summary-card">
          <p class="eyebrow">ORDER SUMMARY</p>
          <h2>Order #{{ order.order_id }}</h2>
          <div class="summary-line"><span>Status</span><strong>{{ order.order_status }}</strong></div>
          <div class="summary-line total"><span>Total</span><strong>{{ formatMoney(order.total_amount) }}</strong></div>
        </section>

        <section class="payment-card">
          <p class="eyebrow">PAYMENT METHOD</p>
          <h2>Select a saved payment card</h2>
          <p class="helper">This demo uses the payment cards already stored in the StockWell database. Card numbers are masked.</p>

          <div class="cards-list">
            <label v-for="card in cards" :key="card.card_id" class="card-option" :class="{ selected: Number(selectedCardId) === Number(card.card_id) }">
              <input v-model="selectedCardId" type="radio" :value="card.card_id" />
              <span>
                <strong>{{ card.card_type || "Payment card" }}</strong>
                <small>•••• {{ card.last_four_digits }} · Available {{ formatMoney(card.available_amount) }}</small>
              </span>
            </label>
          </div>

          <div v-if="selectedCard" class="selected-info">
            Selected: {{ selectedCard.card_type }} ending in {{ selectedCard.last_four_digits }}
          </div>

          <label class="field-label" for="delivery-address">DELIVERY ADDRESS</label>
          <textarea id="delivery-address" v-model="deliveryAddress" rows="4" placeholder="Enter the address where your Stokvel order should be delivered"></textarea>

          <button class="pay-button" type="button" :disabled="paying || !selectedCardId || !deliveryAddress.trim()" @click="pay">
            {{ paying ? "Processing payment…" : `Pay ${formatMoney(order.total_amount)}` }}
          </button>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.payment-page { min-height: calc(100vh - 68px); padding: 36px 24px 60px; }
.payment-container { max-width: 1180px; margin: 0 auto; }
.heading-row { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; margin-bottom:28px; }
.eyebrow { margin:0 0 8px; font-size:11px; font-weight:800; letter-spacing:.14em; color:var(--sw-purple-700); }
h1 { margin:0; font-size:42px; color:var(--sw-page-text); }
h2 { margin:8px 0 10px; color:var(--sw-page-text); }
.intro,.helper { color:var(--sw-page-text-muted); line-height:1.6; }
.payment-layout { display:grid; grid-template-columns:340px minmax(0,1fr); gap:24px; }
.summary-card,.payment-card,.success-card,.state-card { background:var(--sw-page-surface); border:1px solid var(--sw-input-border); border-radius:24px; box-shadow:var(--sw-card-shadow); }
.summary-card,.payment-card { padding:28px; }
.summary-line { display:flex; justify-content:space-between; gap:20px; padding:16px 0; border-bottom:1px solid var(--sw-input-border); color:var(--sw-page-text-muted); }
.summary-line strong { color:var(--sw-page-text); }
.summary-line.total { border-bottom:0; font-size:18px; margin-top:8px; }
.cards-list { display:grid; gap:12px; margin:24px 0; }
.card-option { display:flex; align-items:center; gap:14px; padding:16px; border:1px solid var(--sw-input-border); border-radius:16px; cursor:pointer; background:var(--sw-page-background); }
.card-option.selected { border-color:var(--sw-purple-700); box-shadow:0 0 0 2px color-mix(in srgb, var(--sw-purple-700) 18%, transparent); }
.card-option input { accent-color:var(--sw-purple-700); }
.card-option span { display:grid; gap:5px; color:var(--sw-page-text); }
.card-option small { color:var(--sw-page-text-muted); }
.selected-info { padding:12px 14px; margin-bottom:22px; border-radius:12px; background:var(--sw-page-background); color:var(--sw-page-text-muted); font-size:13px; }
.field-label { display:block; margin:0 0 8px; font-size:11px; font-weight:800; letter-spacing:.1em; color:var(--sw-page-text-muted); }
textarea { width:100%; box-sizing:border-box; resize:vertical; padding:14px 16px; border:1px solid var(--sw-input-border); border-radius:14px; background:var(--sw-page-background); color:var(--sw-page-text); font:inherit; }
.pay-button,.primary-button,.secondary-button { border:0; border-radius:999px; padding:14px 22px; font-weight:800; cursor:pointer; }
.pay-button,.primary-button { width:100%; margin-top:22px; background:var(--sw-purple-700); color:white; }
.pay-button:disabled { opacity:.5; cursor:not-allowed; }
.secondary-button { background:transparent; border:1px solid var(--sw-input-border); color:var(--sw-page-text); }
.message { padding:14px 16px; border-radius:14px; margin-bottom:20px; }
.error-message { background:rgba(220,70,70,.1); color:#b42318; }
.success-card,.state-card { padding:50px 28px; text-align:center; }
.success-card { max-width:620px; margin:40px auto; }
.success-icon { width:56px; height:56px; margin:0 auto 18px; display:grid; place-items:center; border-radius:50%; background:var(--sw-purple-700); color:white; font-size:28px; }
.success-card .primary-button { max-width:300px; }
@media (max-width:800px) { .heading-row,.payment-layout { grid-template-columns:1fr; display:grid; } h1 { font-size:34px; } }
</style>
