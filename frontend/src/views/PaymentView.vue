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
const method = ref("payfast");
const memberName = ref("");
const email = ref("");
const voucherCode = ref("");
const voucherMessage = ref("");

const selectedCard = computed(() =>
  cards.value.find((card) => Number(card.card_id) === Number(selectedCardId.value)) || null,
);

const total = computed(() => Number(order.value?.total_amount || 0));

onMounted(loadPayment);

async function loadPayment() {
  loading.value = true;
  error.value = "";
  try {
    const response = await getPaymentOptions();
    order.value = response.order;
    cards.value = response.cards || [];
    const user = JSON.parse(localStorage.getItem("user") || "null");
    memberName.value = user?.full_name || "";
    email.value = user?.email || "";
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load the payment stage. Please return to your basket.";
  } finally {
    loading.value = false;
  }
}

async function pay() {
  if (!selectedCardId.value || !deliveryAddress.value.trim() || paying.value) return;
  paying.value = true;
  error.value = "";
  try {
    const response = await payCurrentOrder({
      card_id: selectedCardId.value,
      delivery_address: deliveryAddress.value.trim(),
    });
    order.value = response.order;
    paymentComplete.value = true;
  } catch (err) {
    error.value = err.response?.data?.message || "Payment could not be completed.";
  } finally {
    paying.value = false;
  }
}

function selectMethod(value) {
  method.value = value;
  voucherMessage.value = "";
  if (value === "bank" && !selectedCardId.value && cards.value.length) {
    selectedCardId.value = cards.value[0].card_id;
  }
}

function verifyVoucher() {
  if (!voucherCode.value.trim()) return;
  voucherMessage.value = `Voucher ${voucherCode.value.trim().toUpperCase()} entered. Voucher validation is handled by the payment service when this method is enabled.`;
}

function backToCart() {
  router.push("/cart");
}

function continueShopping() {
  router.push("/catalogue");
}

function formatMoney(value) {
  return `R ${Number(value || 0).toFixed(2)}`;
}
</script>

<template>
  <main class="payment-page">
    <section class="payment-container">
      <div class="member-badge" v-if="memberName || email">👤 {{ memberName || "Member" }}<span v-if="email"> · {{ email }}</span></div>

      <div class="payment-layout">
        <section class="summary-card">
          <div class="summary-head">
            <p class="eyebrow">ORDER SUMMARY</p>
            <span class="pill">{{ order?.items?.length || 0 }} ITEMS · LIVE</span>
          </div>
          <div v-if="loading" class="empty-cart">Loading order…</div>
          <div v-else-if="!order" class="empty-cart">Your confirmed order could not be loaded.</div>
          <div v-else>
            <div v-for="item in order.items || []" :key="item.order_item_id || item.product_id" class="cart-line">
              <span>{{ item.product_name || item.name }} ×{{ item.quantity || item.qty }}</span>
              <span>{{ formatMoney(item.subtotal ?? Number(item.unit_price || item.price) * Number(item.quantity || item.qty || 1)) }}</span>
            </div>
            <div class="total-line"><span>Total</span><strong>{{ formatMoney(total) }}</strong></div>
          </div>
        </section>

        <section class="payment-card">
          <div class="payment-head">
            <p class="eyebrow">PAYMENT</p>
            <span class="secure">PAYFAST · SECURE CHECKOUT</span>
          </div>

          <div v-if="error" class="error-box">{{ error }}</div>

          <div v-if="paymentComplete" class="success-card">
            <div class="success-icon">✓</div>
            <p class="eyebrow">PAYMENT COMPLETE</p>
            <h2>Payment successful</h2>
            <p>Your order is now processing and your delivery details have been recorded.</p>
            <button class="paybtn" type="button" @click="continueShopping">Continue shopping</button>
          </div>

          <template v-else>
            <div class="method-row">
              <button :class="{ selected: method === 'payfast' }" type="button" @click="selectMethod('payfast')">● PAYFAST</button>
              <button :class="{ selected: method === 'bank' }" type="button" @click="selectMethod('bank')">≈ BANK DEMO</button>
              <button :class="{ selected: method === 'voucher' }" type="button" @click="selectMethod('voucher')">✦ VOUCHER</button>
            </div>

            <div v-if="method === 'payfast'">
              <div class="payfast-card">
                <div class="payfast-logo">PAYFAST</div>
                <p>You'll be redirected to PayFast's hosted checkout to choose an available payment method. StockWell never receives or stores your card number or CVV.</p>
              </div>
              <div class="details-card">
                <div class="details-heading">PAYMENT & DELIVERY DETAILS</div>
                <div class="details-subheading">Please enter your details manually.</div>
                <label class="lbl">FULL NAME *</label>
                <input v-model="memberName" class="inp" type="text" placeholder="Enter your full name" />
                <label class="lbl gap">EMAIL FOR RECEIPT *</label>
                <input v-model="email" class="inp" type="email" placeholder="Enter your email address" />
                <label class="lbl gap">DELIVERY ADDRESS *</label>
                <input v-model="deliveryAddress" class="inp" type="text" placeholder="Enter your delivery address" />
              </div>
              <div class="method-note">PayFast checkout uses the same payment-method presentation as Butsha-dev. The shared integration keeps its existing authenticated payment API.</div>
              <button class="paybtn" type="button" :disabled="!selectedCardId || !deliveryAddress.trim() || paying" @click="pay">
                {{ paying ? 'Processing payment…' : `Continue to PayFast · ${formatMoney(total)}` }}
              </button>
              <p v-if="!selectedCardId && cards.length" class="hint">Select a saved card under BANK DEMO before completing payment.</p>
            </div>

            <div v-else-if="method === 'bank'">
              <div class="details-card">
                <div class="details-heading">PAYMENT DETAILS</div>
                <div class="details-subheading">Select one of your saved payment cards.</div>
                <div class="cards-list">
                  <label v-for="card in cards" :key="card.card_id" class="card-option" :class="{ selected: Number(selectedCardId) === Number(card.card_id) }">
                    <input v-model="selectedCardId" type="radio" :value="card.card_id" />
                    <span><strong>{{ card.card_type || 'Payment card' }}</strong><small>•••• {{ card.last_four_digits }} · Available {{ formatMoney(card.available_amount) }}</small></span>
                  </label>
                </div>
                <label class="lbl gap">DELIVERY ADDRESS *</label>
                <input v-model="deliveryAddress" class="inp" type="text" placeholder="Enter your delivery address" />
              </div>
              <button class="paybtn" type="button" :disabled="paying || !selectedCardId || !deliveryAddress.trim()" @click="pay">
                {{ paying ? 'Processing payment…' : `Pay with Bank · ${formatMoney(total)}` }}
              </button>
            </div>

            <div v-else class="voucher-panel">
              <div class="voucher-header"><div class="voucher-icon">✦</div><div><div class="voucher-title">APPLY A VOUCHER</div><div class="voucher-subtitle">Enter your promo code to unlock your discount.</div></div></div>
              <div class="voucher-entry">
                <label class="lbl">PROMO CODE</label>
                <div class="voucher-input-row">
                  <input v-model="voucherCode" class="inp" placeholder="e.g. SAVE10" @keyup.enter="verifyVoucher" />
                  <button class="verify" type="button" @click="verifyVoucher">Verify</button>
                </div>
              </div>
              <div v-if="voucherMessage" class="notice">{{ voucherMessage }}</div>
              <div v-else class="voucher-hint">ⓘ The voucher method is shown consistently with Butsha-dev; shared-integration-work continues to use its existing payment service for the actual transaction.</div>
              <div class="details-card voucher-details">
                <div class="details-heading">PAYMENT & DELIVERY DETAILS</div>
                <label class="lbl gap">FULL NAME *</label>
                <input v-model="memberName" class="inp" type="text" placeholder="Enter your full name" />
                <label class="lbl gap">EMAIL *</label>
                <input v-model="email" class="inp" type="email" placeholder="Enter your email address" />
                <label class="lbl gap">DELIVERY ADDRESS *</label>
                <input v-model="deliveryAddress" class="inp" type="text" placeholder="Enter your delivery address" />
              </div>
            </div>
          </template>
        </section>
      </div>

      <button v-if="!paymentComplete" class="back-button" type="button" @click="backToCart">Back to cart</button>
    </section>
  </main>
</template>

<style scoped>
.payment-page{min-height:calc(100vh - 68px);padding:32px 24px 60px}.payment-container{max-width:1320px;margin:0 auto}.member-badge{display:inline-block;margin-bottom:16px;padding:10px 16px;border-radius:999px;background:var(--sw-page-surface);border:1px solid var(--sw-input-border);color:var(--sw-page-text);font-size:11px}.payment-layout{display:grid;grid-template-columns:380px minmax(0,1fr);gap:28px}.summary-card,.payment-card{border-radius:28px;background:var(--sw-page-surface);border:1px solid var(--sw-input-border);box-shadow:var(--sw-card-shadow)}.summary-card{padding:28px 26px;align-self:start}.payment-card{padding:28px 30px}.summary-head,.payment-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px}.eyebrow{margin:0;font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--sw-purple-700)}.pill{font-size:10px;padding:7px 12px;border-radius:999px;background:var(--sw-page-background);border:1px solid var(--sw-input-border);color:var(--sw-page-text-muted)}.secure{font-size:10px;color:var(--sw-page-text-muted)}.cart-line,.total-line{display:flex;justify-content:space-between;gap:18px;color:var(--sw-page-text);padding:14px 0;border-bottom:1px solid var(--sw-input-border)}.total-line{margin-top:4px;border:0;font-weight:800}.empty-cart{text-align:center;padding:70px 20px;color:var(--sw-page-text-muted)}.method-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}.method-row button,.verify{padding:14px;border-radius:999px;background:var(--sw-page-background);border:1px solid var(--sw-input-border);color:var(--sw-page-text-muted);font-weight:800;cursor:pointer}.method-row button.selected{background:var(--sw-purple-700);border-color:var(--sw-purple-700);color:#fff}.payfast-card,.details-card{padding:20px;border-radius:18px;background:var(--sw-page-background);border:1px solid var(--sw-input-border)}.payfast-card{margin-bottom:20px;color:var(--sw-page-text-muted);font-size:12px;line-height:1.6}.payfast-logo{font-weight:900;letter-spacing:.12em;color:var(--sw-page-text);margin-bottom:8px}.details-heading{font-size:11px;font-weight:800;letter-spacing:.12em;color:var(--sw-page-text)}.details-subheading{font-size:10px;color:var(--sw-page-text-muted);margin:5px 0 20px}.lbl{display:block;margin-bottom:8px;font-size:11px;font-weight:800;letter-spacing:.1em;color:var(--sw-page-text-muted)}.gap{margin-top:18px}.inp{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:1px solid var(--sw-input-border);background:var(--sw-page-surface);color:var(--sw-page-text);font:inherit}.inp::placeholder{color:var(--sw-page-text-muted)}.paybtn{width:100%;margin-top:22px;padding:16px;border:0;border-radius:999px;background:var(--sw-purple-700);color:#fff;font-weight:800;cursor:pointer}.paybtn:disabled{opacity:.5;cursor:not-allowed}.cards-list{display:grid;gap:12px}.card-option{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid var(--sw-input-border);border-radius:16px;cursor:pointer;background:var(--sw-page-surface)}.card-option.selected{border-color:var(--sw-purple-700);box-shadow:0 0 0 2px color-mix(in srgb,var(--sw-purple-700) 18%,transparent)}.card-option input{accent-color:var(--sw-purple-700)}.card-option span{display:grid;gap:5px;color:var(--sw-page-text)}.card-option small{color:var(--sw-page-text-muted)}.voucher-panel{padding:22px;border:1px solid var(--sw-input-border);border-radius:20px;background:var(--sw-page-background)}.voucher-header{display:flex;align-items:center;gap:14px;padding-bottom:20px;border-bottom:1px solid var(--sw-input-border)}.voucher-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--sw-purple-700) 16%,transparent);color:var(--sw-purple-700);font-size:19px}.voucher-title{font-weight:800;font-size:12px;letter-spacing:.12em;color:var(--sw-page-text)}.voucher-subtitle{margin-top:5px;font-size:11px;color:var(--sw-page-text-muted)}.voucher-entry{padding-top:20px}.voucher-input-row{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:10px}.verify{height:48px;border-radius:14px;background:var(--sw-purple-700);color:#fff}.notice,.method-note,.voucher-hint,.hint{margin-top:12px;padding:12px;border-radius:10px;font-size:11px;line-height:1.5}.notice{background:rgba(124,255,178,.12);border:1px solid rgba(124,255,178,.3);color:#2f7d52}.method-note,.voucher-hint,.hint{background:var(--sw-page-background);border:1px solid var(--sw-input-border);color:var(--sw-page-text-muted)}.error-box{margin-bottom:14px;padding:12px;border-radius:10px;background:rgba(255,100,100,.1);border:1px solid rgba(255,100,100,.3);color:#b42318;font-size:11px}.success-card{text-align:center;padding:34px 20px}.success-icon{width:56px;height:56px;margin:0 auto 18px;display:grid;place-items:center;border-radius:50%;background:var(--sw-purple-700);color:#fff;font-size:28px}.success-card h2{color:var(--sw-page-text)}.success-card p{color:var(--sw-page-text-muted)}.back-button{margin-top:18px;padding:12px 18px;border-radius:999px;border:1px solid var(--sw-input-border);background:transparent;color:var(--sw-page-text);cursor:pointer}@media(max-width:850px){.payment-layout{grid-template-columns:1fr}.method-row{grid-template-columns:1fr}.payment-card,.summary-card{padding:22px}.voucher-input-row{grid-template-columns:1fr}.verify{width:100%}}
</style>
