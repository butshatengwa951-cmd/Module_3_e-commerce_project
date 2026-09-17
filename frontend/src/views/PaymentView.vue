<template>
  <main class="contribution-page">
    <section class="contribution-wrap">
      <header class="hero glass">
        <div>
          <span class="eyebrow">GROUP FUNDING · PAYFAST</span>
          <h1>Build the <em>Group Wallet.</em></h1>
          <p>Your contribution is processed securely by PayFast. StockWell does not store your card details. The money is added to your Stokvel wallet only after PayFast confirms the payment.</p>
        </div>
        <div class="wallet-orb"><span>AVAILABLE</span><strong>{{ money(walletBalance) }}</strong></div>
      </header>
      <div v-if="error" class="message error">{{ error }}</div>
      <div v-if="success" class="message success">{{ success }}</div>
      <div v-if="loading" class="state glass">Loading your contribution account...</div>
      <div v-else class="layout">
        <section class="card glass">
          <span class="section-label">CONTRIBUTE TO {{ stokvelName || 'YOUR STOKVEL' }}</span>
          <h2>Add money to the group.</h2>
          <p class="muted">Enter the amount you want to contribute, then continue to PayFast to complete the payment.</p>
          <label class="label">AMOUNT</label>
          <div class="amount-input"><span>R</span><input v-model.number="amount" type="number" min="1" step="0.01" placeholder="0.00" /></div>
          <button class="primary-btn" type="button" :disabled="saving || !amount || Number(amount) <= 0" @click="payWithPayFast">
            {{ saving ? 'Opening PayFast…' : `Continue to PayFast · ${money(amount)}` }}
          </button>
          <p class="note">You will leave StockWell and complete payment on PayFast.</p>
        </section>
        <aside class="side card glass">
          <span class="section-label">HOW STOCKWELL WORKS</span>
          <div class="step"><b>01</b><span><strong>Contribute</strong><small>Pay your chosen amount through PayFast.</small></span></div>
          <div class="step"><b>02</b><span><strong>Wallet</strong><small>PayFast confirms the contribution before the balance changes.</small></span></div>
          <div class="step"><b>03</b><span><strong>Decide</strong><small>Members propose and vote on group purchases.</small></span></div>
          <div class="step"><b>04</b><span><strong>Authorise</strong><small>Stokvel leadership authorises approved purchases.</small></span></div>
          <div class="step"><b>05</b><span><strong>Track</strong><small>Follow authorised orders through delivery.</small></span></div>
          <button class="secondary-btn" type="button" @click="router.push('/member-dashboard')">Back to Group Hub</button>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getPaymentOptions, createPayfastCheckout } from '../services/api.js';

const router = useRouter();
const loading = ref(true), saving = ref(false), error = ref(''), success = ref('');
const walletBalance = ref(0), stokvelName = ref(''), amount = ref(null);

function money(value) { return `R ${Number(value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

async function load() {
  loading.value = true; error.value = '';
  try {
    const response = await getPaymentOptions();
    walletBalance.value = Number(response.wallet?.available_balance || 0);
    stokvelName.value = response.stokvel?.stokvel_name || '';
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to load your contribution account.';
  } finally { loading.value = false; }
}

async function payWithPayFast() {
  if (saving.value || !amount.value || Number(amount.value) <= 0) return;
  saving.value = true; error.value = ''; success.value = '';
  try {
    const checkout = await createPayfastCheckout({ amount: Number(amount.value) });
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkout.action;
    form.style.display = 'none';
    Object.entries(checkout.fields || {}).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = name; input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to start the PayFast payment.';
    saving.value = false;
  }
}

onMounted(() => {
  const status = new URLSearchParams(window.location.search).get('status');
  if (status === 'success') success.value = 'PayFast returned successfully. Your wallet will update after PayFast confirmation.';
  if (status === 'cancelled') error.value = 'The PayFast payment was cancelled.';
  load();
});
</script>

<style scoped>
.contribution-page{min-height:100vh;background:var(--sw-page-background);color:var(--sw-page-text)}.contribution-wrap{width:min(1120px,calc(100% - 32px));margin:auto;padding:40px 0 80px}.glass{background:var(--sw-glass-light);border:1px solid var(--sw-glass-light-border);box-shadow:var(--sw-glass-shadow-light);backdrop-filter:blur(var(--sw-glass-blur));border-radius:24px}.hero{min-height:280px;padding:42px;display:flex;align-items:center;justify-content:space-between;gap:30px;background:var(--sw-page-gradient)}.eyebrow,.section-label{color:var(--sw-gold-500);font:800 10px var(--sw-font-body);letter-spacing:.14em}.hero h1{margin:18px 0 14px;font:800 clamp(44px,7vw,72px)/.9 var(--sw-font-heading);letter-spacing:-.06em}.hero h1 em{font-style:normal;color:var(--sw-gold-500)}.hero p{max-width:650px;color:var(--sw-page-text-soft);line-height:1.7}.wallet-orb{width:190px;height:190px;flex:0 0 190px;border:1px solid var(--sw-gold-500);border-radius:50%;display:grid;place-items:center;align-content:center;gap:8px;text-align:center}.wallet-orb span{font:800 9px var(--sw-font-body);letter-spacing:.12em;color:var(--sw-page-text-soft)}.wallet-orb strong{font:800 23px var(--sw-font-heading);color:var(--sw-gold-500)}.message{margin-top:16px;padding:14px 17px;border-radius:14px;font:11px var(--sw-font-body)}.message.error{border:1px solid rgba(210,75,55,.35);color:#b42318;background:rgba(210,75,55,.08)}.message.success{border:1px solid rgba(55,170,105,.35);color:#247747;background:rgba(55,170,105,.08)}.state{margin-top:18px;padding:50px;text-align:center}.layout{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;margin-top:18px}.card{padding:28px}.card h2{margin:10px 0 7px;font:800 28px var(--sw-font-heading)}.muted,.note{color:var(--sw-page-text-soft);font:11px/1.6 var(--sw-font-body)}.label{display:block;margin-top:24px;margin-bottom:8px;color:var(--sw-page-text-soft);font:800 9px var(--sw-font-body);letter-spacing:.12em}.amount-input{display:flex;align-items:center;gap:8px;padding:4px 15px;border:1px solid var(--sw-input-border);border-radius:14px;background:var(--sw-page-background)}.amount-input span{font-weight:800;color:var(--sw-gold-500)}.amount-input input{width:100%;border:0;outline:0;padding:12px 4px;background:transparent;color:var(--sw-page-text);font-size:18px}.primary-btn,.secondary-btn{margin-top:22px;width:100%;padding:14px 17px;border-radius:12px;font:800 10px var(--sw-font-body);cursor:pointer}.primary-btn{border:0;background:var(--sw-gold-500);color:var(--sw-purple-900)}.primary-btn:disabled{opacity:.5;cursor:not-allowed}.secondary-btn{border:1px solid var(--sw-input-border);background:transparent;color:var(--sw-page-text)}.step{display:flex;gap:13px;padding:17px 0;border-bottom:1px solid var(--sw-input-border)}.step>b{color:var(--sw-gold-500);font:800 10px var(--sw-font-body)}.step span{display:grid;gap:4px}.step small{color:var(--sw-page-text-soft);font:10px/1.5 var(--sw-font-body)}.note{margin:12px 0 0;text-align:center}@media(max-width:800px){.hero{padding:30px;flex-direction:column;align-items:flex-start}.wallet-orb{align-self:center}.layout{grid-template-columns:1fr}}@media(max-width:520px){.contribution-wrap{width:min(100% - 22px,1120px)}.hero,.card{padding:23px}}
</style>
