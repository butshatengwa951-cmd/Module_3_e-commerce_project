<template>
  <div class="payment-page">
    <div v-if="auth.isLoggedIn" class="member-badge">👤 {{ auth.fullName }} ({{ auth.email }})</div>
    <div class="payment-grid">
      <div class="glass summary-card">
        <div class="summary-head"><div class="eyebrow">ORDER SUMMARY</div><div class="pill">{{ items.length }} ITEMS • LIVE</div></div>
        <div v-if="!items.length" class="empty-cart"><div>🛒</div><strong>Your cart is empty</strong></div>
        <div v-else>
          <div v-for="it in items" :key="it.id || it.product_id" class="cart-line"><span>{{ it.product_name }} x{{ it.qty }}</span><span>R{{ (Number(it.price)*Number(it.qty)).toFixed(2) }}</span></div>
          <div class="total-line"><span>Total</span><span>R{{ total.toFixed(2) }}</span></div>
          <div v-if="voucherDiscount>0" class="discount-line"><span>Voucher -{{ voucherCode }}</span><span>-R{{ voucherDiscount.toFixed(2) }}</span></div>
          <div v-if="voucherDiscount>0" class="total-line"><span>PayFast total</span><span>R{{ (total-voucherDiscount).toFixed(2) }}</span></div>
        </div>
      </div>

      <div class="glass payment-card">
        <div class="payment-head"><div class="eyebrow">PAYMENT</div><div class="secure">PAYFAST • SECURE CHECKOUT</div></div>
        <div v-if="payfastMessage" class="notice">{{ payfastMessage }}</div>
        <div class="method-row">
          <button :class="{selected:method==='payfast'}" @click="method='payfast'">● PAYFAST</button>
          <button :class="{selected:method==='bank'}" @click="method='bank';loadBankCards()">≈ BANK DEMO</button>
          <button :class="{selected:method==='voucher'}" @click="method='voucher';loadVouchers()">✦ VOUCHER</button>
        </div>

        <div v-if="method==='payfast'">
          <div class="payfast-card"><div class="payfast-logo">PAYFAST</div><div>You'll be redirected to PayFast's hosted checkout to choose an available payment method. StockWell never receives or stores your card number or CVV.</div></div>
          <div class="details-card">
            <div class="details-heading">PAYMENT & DELIVERY DETAILS</div><div class="details-subheading">Please enter your details manually.</div>
            <label class="lbl">FULL NAME *</label><input class="inp" v-model="form.member" type="text" placeholder="Enter your full name" autocomplete="off" required />
            <label class="lbl gap">EMAIL FOR RECEIPT *</label><input class="inp" v-model="form.email" type="email" placeholder="Enter your email address" autocomplete="off" required />
            <label class="lbl gap">DELIVERY ADDRESS *</label><input class="inp" v-model="address" type="text" placeholder="Enter your delivery address" autocomplete="off" required />
          </div>
          <button @click="startPayfast" :disabled="loading||!items.length||!form.member.trim()||!form.email.trim()||!address.trim()" class="paybtn">{{ loading?'Opening PayFast...':'Continue to PayFast • R'+(total-voucherDiscount).toFixed(2) }}</button>
        </div>

        <div v-if="method==='bank'">
          <div class="details-card">
            <div class="details-heading">PAYMENT DETAILS</div><div class="details-subheading">Please enter your details manually.</div>
            <label class="lbl">CARD OR VOUCHER NUMBER *</label><input class="inp" v-model="manualCardInput" placeholder="Enter your saved card or voucher number" autocomplete="off" />
            <div v-if="manualCardInput&&recognizedCard" class="recognized">{{ recognizedCard.card_type }} • **** {{ recognizedCard.last_four_digits }} — R{{ Number(recognizedCard.available_amount).toFixed(2) }}</div>
            <div v-else-if="manualCardInput" class="error-box">We couldn't recognise that card.</div>
            <label class="lbl gap">EMAIL *</label><input class="inp" v-model="form.email" type="email" placeholder="Enter your email address" autocomplete="off" />
            <label class="lbl gap">MEMBER NAME *</label><input class="inp" v-model="form.member" type="text" placeholder="Enter your full name" autocomplete="off" />
            <label class="lbl gap">DELIVERY ADDRESS *</label><input class="inp" v-model="address" type="text" placeholder="Enter your delivery address" autocomplete="off" />
          </div>
          <button @click="payLegacy" :disabled="loading||!selectedCard||!form.email.trim()||!form.member.trim()||!address.trim()" class="paybtn">Pay with Bank • R{{ (total-voucherDiscount).toFixed(2) }}</button>
        </div>

        <div v-if="method==='voucher'" class="voucher-panel">
          <div class="voucher-header"><div class="voucher-icon">✦</div><div><div class="voucher-title">APPLY A VOUCHER</div><div class="voucher-subtitle">Enter your promo code to unlock your discount.</div></div></div>
          <div class="voucher-entry"><label class="lbl">PROMO CODE</label><div class="voucher-input-row"><input class="inp voucher-input" v-model="voucherCode" placeholder="e.g. SAVE10" autocomplete="off" @keyup.enter="verifyVoucher" /><button @click="verifyVoucher" :disabled="verifying||!voucherCode.trim()" class="verify">{{ verifying?'Checking…':'Verify' }}</button></div></div>
          <div v-if="voucherMsg" :class="voucherValid?'valid voucher-result':'error-box voucher-result'"><span>{{ voucherValid?'✓':'!' }}</span><span>{{ voucherMsg }}</span></div>
          <div v-else class="voucher-hint">ⓘ <span>The voucher will be checked again by the server before PayFast checkout.</span></div>
          <div v-if="voucherValid" class="details-card voucher-details">
            <div class="details-heading">PAYMENT & DELIVERY DETAILS</div><div class="details-subheading">Please enter your details manually.</div>
            <label class="lbl">FULL NAME *</label><input class="inp" v-model="form.member" type="text" placeholder="Enter your full name" autocomplete="off" required />
            <label class="lbl gap">EMAIL FOR RECEIPT *</label><input class="inp" v-model="form.email" type="email" placeholder="Enter your email address" autocomplete="off" required />
            <label class="lbl gap">DELIVERY ADDRESS *</label><input class="inp" v-model="address" type="text" placeholder="Enter your delivery address" autocomplete="off" required />
          </div>
          <button @click="startPayfast" :disabled="loading||!items.length||!voucherValid||!form.member.trim()||!form.email.trim()||!address.trim()" class="paybtn">{{ loading?'Opening PayFast...':'Continue to PayFast • R'+(total-voucherDiscount).toFixed(2) }}</button>
        </div>
        <div v-if="err" class="error-box">{{ err }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,computed,watch,onMounted,inject } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
const auth=useAuthStore(); const showConfirm=inject('showConfirm'); const route=useRoute(); const router=useRouter();
const orderId=ref(route.query.order_id?Number(route.query.order_id):null),method=ref('payfast'),items=ref([]),form=ref({email:'',member:''}),address=ref(''),loading=ref(false),err=ref(''),payfastMessage=ref('');
const total=computed(()=>items.value.reduce((a,b)=>a+Number(b.price)*(b.qty||1),0));
const bankCards=ref([]),selectedCard=ref(null),manualCardInput=ref('');
const recognizedCard=computed(()=>{const q=manualCardInput.value.trim().toLowerCase();if(!q)return null;return bankCards.value.find(c=>(c.voucher_number||'').toLowerCase()===q||(c.last_four_digits||'').toLowerCase()===q)||null});
watch(recognizedCard,c=>selectedCard.value=c?c.card_id:null);
const voucherCode=ref(''),voucherDiscount=ref(0),voucherMsg=ref(''),voucherValid=ref(false),verifying=ref(false);
async function load(){const p=new URLSearchParams({email:form.value.email});if(orderId.value)p.set('order_id',orderId.value);else if(auth.userId)p.set('user_id',auth.userId);try{const{data}=await api.get('/cart?'+p);items.value=data;if(!orderId.value&&data.length&&data[0].order_id)orderId.value=data[0].order_id}catch(e){err.value=e.response?.data?.error||e.message}}
async function loadBankCards(){try{const{data}=await api.get('/cards');bankCards.value=data}catch{}}
async function loadVouchers(){try{await api.get('/vouchers')}catch{}}
async function verifyVoucher(){verifying.value=true;voucherMsg.value='';voucherValid.value=false;voucherDiscount.value=0;try{const{data}=await api.post('/vouchers/verify',{code:voucherCode.value,total:total.value});voucherValid.value=true;voucherDiscount.value=data.discount;voucherMsg.value=`Valid! ${data.voucher.code} gives R${data.discount.toFixed(2)} off. New total: R${data.newTotal.toFixed(2)}`}catch(e){voucherMsg.value=e.response?.data?.error||'Invalid voucher'}finally{verifying.value=false}}
async function startPayfast(){if(!items.value.length||!form.value.member.trim()||!form.value.email.trim()||!address.value.trim())return;loading.value=true;err.value='';try{const{data}=await api.post('/pay/payfast',{order_id:orderId.value,email:form.value.email,user_id:auth.userId,member_name:form.value.member,total:total.value,items:items.value.map(i=>({product_id:i.product_id,name:i.product_name,price:i.price,qty:i.qty})),address:address.value,voucher_code:voucherValid.value?voucherCode.value:null});window.location.href=data.checkout_url}catch(e){err.value=e.response?.data?.error||e.message;loading.value=false}}
async function payLegacy(){loading.value=true;err.value='';try{const{data}=await api.post('/pay',{order_id:orderId.value,email:form.value.email,user_id:auth.userId,member_name:form.value.member,total:total.value,items:items.value.map(i=>({product_id:i.product_id,name:i.product_name,price:i.price,qty:i.qty})),address:address.value,method:'bank',card_id:selectedCard.value});showConfirm.value=true;setTimeout(()=>router.push('/delivery/'+data.tracking_number),1200)}catch(e){err.value=e.response?.data?.error||e.message}finally{loading.value=false}}
onMounted(async()=>{auth.syncFromStorage();await load();if(route.query.payfast==='success')payfastMessage.value="Payment returned from PayFast. Your order is confirmed after PayFast's server notification is received.";if(route.query.payfast==='cancelled')payfastMessage.value='PayFast checkout was cancelled. Your order remains unpaid.'});
</script>

<style scoped>
.payment-page{max-width:1320px;margin:0 auto;padding:32px 24px;position:relative;z-index:2}.member-badge{margin-bottom:16px;padding:10px 16px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font:11px 'DM Mono',monospace;color:white}.payment-grid{display:grid;grid-template-columns:380px 1fr;gap:28px}.summary-card,.payment-card{border-radius:28px}.summary-card{padding:28px 26px;max-height:560px}.payment-card{padding:28px 30px}.summary-head,.payment-head{display:flex;justify-content:space-between;margin-bottom:24px}.eyebrow{font:700 12px 'DM Mono',monospace;letter-spacing:.14em;color:white}.pill{font:11px 'DM Mono',monospace;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:white}.secure{font:10px 'DM Mono',monospace;color:rgba(255,255,255,.55)}.cart-line,.total-line,.discount-line{display:flex;justify-content:space-between;color:white;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.08)}.total-line{margin-top:4px;font-weight:700;border:0}.discount-line{color:#7cffb2;font-size:12px;border:0;padding:5px 0}.empty-cart{text-align:center;padding:90px 20px;color:white}.empty-cart div{font-size:40px;margin-bottom:20px}.method-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}.method-row button,.verify{padding:14px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.7);font-weight:700;cursor:pointer}.method-row button.selected{background:linear-gradient(90deg,#795d89,#c8b019);color:#211a2d}.payfast-card,.details-card{padding:20px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}.payfast-card{margin-bottom:20px;color:rgba(255,255,255,.75);font-size:12px;line-height:1.6}.payfast-logo{font-weight:900;letter-spacing:.12em;color:white;margin-bottom:8px}.details-heading{font:800 11px 'DM Mono',monospace;letter-spacing:.12em;color:white}.details-subheading{font-size:10px;color:rgba(255,255,255,.45);margin:5px 0 20px}.lbl{display:block;margin-bottom:8px;font:11px 'DM Mono',monospace;letter-spacing:.12em;color:rgba(255,255,255,.55)}.gap{margin-top:18px}.inp{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:white}.inp::placeholder{color:rgba(255,255,255,.32)}.paybtn{width:100%;margin-top:22px;padding:16px;border:0;border-radius:999px;background:linear-gradient(90deg,#795d89,#c8b019);color:white;font-weight:700;cursor:pointer}.paybtn:disabled{opacity:.5;cursor:not-allowed}.recognized,.valid,.notice{margin-top:12px;padding:12px;border-radius:10px;background:rgba(124,255,178,.12);border:1px solid rgba(124,255,178,.3);color:#7cffb2;font-size:11px}.error-box{margin-top:12px;padding:12px;border-radius:10px;background:rgba(255,100,100,.1);border:1px solid rgba(255,100,100,.3);color:#ffb4b4;font-size:11px}
.voucher-panel{padding:22px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(255,255,255,.035)}.voucher-header{display:flex;align-items:center;gap:14px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.08)}.voucher-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,rgba(121,93,137,.35),rgba(200,176,25,.25));border:1px solid rgba(200,176,25,.25);color:#e3cf55;font-size:19px}.voucher-title{font:800 12px 'DM Mono',monospace;letter-spacing:.12em;color:white}.voucher-subtitle{margin-top:5px;font-size:11px;color:rgba(255,255,255,.5)}.voucher-entry{padding-top:20px}.voucher-input-row{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:10px}.voucher-input{text-transform:uppercase;height:48px}.verify{height:48px;border-radius:14px}.verify:disabled{opacity:.45;cursor:not-allowed}.voucher-result{display:flex;gap:9px;line-height:1.5}.voucher-hint{display:flex;gap:9px;margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.5);font:10px/1.5 'DM Mono',monospace}.voucher-details{margin-top:18px}.voucher-paybtn{margin-top:18px}
@media(max-width:850px){.payment-grid{grid-template-columns:1fr}.method-row{grid-template-columns:1fr}.payment-card,.summary-card{padding:22px}.voucher-input-row{grid-template-columns:1fr}.verify{width:100%}}
</style>
