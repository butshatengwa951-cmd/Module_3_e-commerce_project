<template>
  <div style="max-width:1320px;margin:0 auto;padding:32px 24px;position:relative;z-index:2">
    <div v-if="auth.isLoggedIn" style="margin-bottom:16px;padding:10px 16px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:11px;color:white;font-family:'DM Mono',monospace">
      👤 {{ auth.fullName }} ({{ auth.email }})
    </div>

    <div style="display:grid;grid-template-columns:380px 1fr;gap:28px">
      <div class="glass" style="padding:28px 26px;max-height:560px;border-radius:28px">
        <div style="display:flex;justify-content:space-between;margin-bottom:28px">
          <div class="eyebrow">ORDER SUMMARY</div>
          <div class="pill">{{ items.length }} ITEMS • LIVE</div>
        </div>
        <div v-if="!items.length" style="text-align:center;padding:90px 20px;color:white">
          <div style="font-size:40px;margin-bottom:20px">🛒</div>
          <div style="font-size:14px;font-weight:600">Your cart is empty</div>
        </div>
        <div v-else>
          <div v-for="it in items" :key="it.id || it.product_id" style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.08);color:white">
            <span>{{ it.product_name }} x{{ it.qty }}</span><span>R{{ (Number(it.price) * Number(it.qty)).toFixed(2) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:18px;font-weight:700;color:white"><span>Total</span><span>R{{ total.toFixed(2) }}</span></div>
          <div v-if="voucherDiscount > 0" style="display:flex;justify-content:space-between;margin-top:8px;color:#7cffb2;font-size:12px"><span>Voucher -{{ voucherCode }}</span><span>-R{{ voucherDiscount.toFixed(2) }}</span></div>
          <div v-if="voucherDiscount > 0" style="display:flex;justify-content:space-between;margin-top:8px;font-weight:700;color:white"><span>PayFast total</span><span>R{{ (total-voucherDiscount).toFixed(2) }}</span></div>
        </div>
      </div>

      <div class="glass" style="padding:28px 30px;border-radius:28px">
        <div style="display:flex;justify-content:space-between;margin-bottom:24px">
          <div class="eyebrow">PAYMENT</div>
          <div class="secure">PAYFAST • SECURE CHECKOUT</div>
        </div>

        <div v-if="payfastMessage" class="notice">{{ payfastMessage }}</div>

        <div class="method-row">
          <button :class="{selected: method==='payfast'}" @click="method='payfast'">● PAYFAST</button>
          <button :class="{selected: method==='bank'}" @click="method='bank';loadBankCards()">≈ BANK DEMO</button>
          <button :class="{selected: method==='voucher'}" @click="method='voucher';loadVouchers()">✦ VOUCHER</button>
        </div>

        <div v-if="method==='payfast'">
          <div class="payfast-card">
            <div class="payfast-logo">PAYFAST</div>
            <div>You'll be redirected to PayFast's hosted checkout to choose an available payment method. StockWell never receives or stores your card number or CVV.</div>
          </div>
          <label class="lbl">EMAIL FOR RECEIPT *</label>
          <input class="inp" v-model="form.email" type="email" required autocomplete="email" />
          <label class="lbl gap">MEMBER NAME *</label>
          <input class="inp" v-model="form.member" required autocomplete="name" />
          <label class="lbl gap">DELIVERY ADDRESS *</label>
          <input class="inp" v-model="address" required autocomplete="street-address" />
          <button @click="startPayfast" :disabled="loading || !items.length" class="paybtn">
            {{ loading ? 'Opening PayFast...' : 'Continue to PayFast • R' + (total-voucherDiscount).toFixed(2) }}
          </button>
        </div>

        <div v-if="method==='bank'">
          <label class="lbl">CARD OR VOUCHER NUMBER *</label>
          <input class="inp" v-model="manualCardInput" placeholder="Enter your saved card or voucher number" autocomplete="off" />
          <div v-if="manualCardInput && recognizedCard" class="recognized">{{ recognizedCard.card_type }} • **** {{ recognizedCard.last_four_digits }} — R{{ Number(recognizedCard.available_amount).toFixed(2) }}</div>
          <div v-else-if="manualCardInput" class="error-box">We couldn't recognise that card.</div>
          <label class="lbl gap">EMAIL *</label><input class="inp" v-model="form.email" type="email" />
          <label class="lbl gap">MEMBER NAME *</label><input class="inp" v-model="form.member" />
          <button @click="payLegacy" :disabled="loading || !selectedCard" class="paybtn">Pay with Bank • R{{ (total-voucherDiscount).toFixed(2) }}</button>
        </div>

        <div v-if="method==='voucher'">
          <div class="hint">Have a promo code? Verify it first, then continue to PayFast. The discount is revalidated by the backend.</div>
          <div style="display:flex;gap:10px"><input class="inp" v-model="voucherCode" placeholder="Enter promo code" style="flex:1" /><button @click="verifyVoucher" :disabled="verifying" class="verify">{{ verifying ? '...' : 'Verify' }}</button></div>
          <div v-if="voucherMsg" :class="voucherValid?'valid':'error-box'" style="margin-top:12px">{{ voucherMsg }}</div>
          <button @click="startPayfast" :disabled="loading || !items.length || !voucherValid" class="paybtn">Continue to PayFast • R{{ (total-voucherDiscount).toFixed(2) }}</button>
        </div>

        <div v-if="err" class="error-box">{{ err }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api.js";
import { useAuthStore } from "../stores/auth.js";

const auth = useAuthStore();
const showConfirm = inject("showConfirm");
const route = useRoute();
const router = useRouter();
const orderId = ref(route.query.order_id ? Number(route.query.order_id) : null);
const method = ref(route.query.payfast === "success" ? "payfast" : "payfast");
const items = ref([]);
const form = ref({ email:"guest@stockwell.global", member:"StockWell Member" });
const address = ref("12 Loop St, Cape Town");
const loading = ref(false);
const err = ref("");
const payfastMessage = ref("");
const total = computed(() => items.value.reduce((a,b)=>a+Number(b.price)*(b.qty||1),0));
const bankCards = ref([]);
const selectedCard = ref(null);
const bankError = ref("");
const manualCardInput = ref("");
const recognizedCard = computed(()=>{ const q=manualCardInput.value.trim().toLowerCase(); if(!q)return null; return bankCards.value.find(c=>(c.voucher_number||"").toLowerCase()===q || (c.last_four_digits||"").toLowerCase()===q)||null; });
watch(recognizedCard,c=>{selectedCard.value=c?c.card_id:null});
const voucherCode=ref(""); const voucherDiscount=ref(0); const voucherMsg=ref(""); const voucherValid=ref(false); const verifying=ref(false);

async function load(){
  if(auth.isLoggedIn){form.value.email=auth.email;form.value.member=auth.fullName||form.value.member;}
  const p=new URLSearchParams({email:form.value.email});
  if(orderId.value)p.set("order_id",orderId.value);else if(auth.userId)p.set("user_id",auth.userId);
  try{const {data}=await api.get("/cart?"+p);items.value=data;if(!orderId.value&&data.length&&data[0].order_id)orderId.value=data[0].order_id;}catch(e){err.value=e.response?.data?.error||e.message;}
}
async function loadBankCards(){try{const {data}=await api.get("/cards");bankCards.value=data;}catch(e){bankError.value=e.message;}}
async function loadVouchers(){try{await api.get("/vouchers");}catch{}}
async function verifyVoucher(){
  verifying.value=true;voucherMsg.value="";voucherValid.value=false;voucherDiscount.value=0;
  try{const {data}=await api.post("/vouchers/verify",{code:voucherCode.value,total:total.value});voucherValid.value=true;voucherDiscount.value=data.discount;voucherMsg.value=`Valid! ${data.voucher.code} gives R${data.discount.toFixed(2)} off. New total: R${data.newTotal.toFixed(2)}`;}
  catch(e){voucherMsg.value=e.response?.data?.error||"Invalid voucher";}
  finally{verifying.value=false;}
}
async function startPayfast(){
  if(!items.value.length)return;
  loading.value=true;err.value="";payfastMessage.value="";
  try{
    const {data}=await api.post("/pay/payfast",{order_id:orderId.value,email:form.value.email,user_id:auth.userId,member_name:form.value.member,total:total.value,items:items.value.map(i=>({product_id:i.product_id,name:i.product_name,price:i.price,qty:i.qty})),address:address.value,voucher_code:voucherValid.value?voucherCode.value:null});
    window.location.href=data.checkout_url;
  }catch(e){err.value=e.response?.data?.error||e.message;loading.value=false;}
}
async function payLegacy(){
  loading.value=true;err.value="";
  try{const {data}=await api.post("/pay",{order_id:orderId.value,email:form.value.email,user_id:auth.userId,member_name:form.value.member,total:total.value,items:items.value.map(i=>({product_id:i.product_id,name:i.product_name,price:i.price,qty:i.qty})),address:address.value,method:"bank",card_id:selectedCard.value});showConfirm.value=true;setTimeout(()=>router.push("/delivery/"+data.tracking_number),1200);}catch(e){err.value=e.response?.data?.error||e.message;}finally{loading.value=false;}
}
onMounted(async()=>{auth.syncFromStorage();await load();if(route.query.payfast==="success")payfastMessage.value="Payment returned from PayFast. Your order is confirmed after PayFast's server notification is received.";if(route.query.payfast==="cancelled")payfastMessage.value="PayFast checkout was cancelled. Your order remains unpaid.";});
</script>

<style scoped>
.eyebrow{font-size:12px;letter-spacing:.14em;font-weight:700;color:white;font-family:'DM Mono',monospace}.pill{font-size:11px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:white;font-family:'DM Mono',monospace}.secure,.hint{font-size:10px;color:rgba(255,255,255,.55);font-family:'DM Mono',monospace}.method-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}.method-row button,.verify{padding:14px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.7);font-weight:700;cursor:pointer}.method-row button.selected{background:linear-gradient(90deg,#795d89,#c8b019);color:#211a2d}.payfast-card{padding:18px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.75);font-size:12px;line-height:1.6;margin-bottom:20px}.payfast-logo{font-weight:900;letter-spacing:.12em;color:white;margin-bottom:8px}.lbl{font-size:11px;letter-spacing:.12em;color:rgba(255,255,255,.55);display:block;margin-bottom:8px;font-family:'DM Mono',monospace}.gap{margin-top:18px}.inp{width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:white;box-sizing:border-box}.paybtn{width:100%;margin-top:22px;padding:16px;border-radius:999px;border:none;background:linear-gradient(90deg,#795d89,#c8b019);color:white;font-weight:700;cursor:pointer}.paybtn:disabled{opacity:.5;cursor:not-allowed}.recognized,.valid,.notice{margin-top:12px;padding:12px;border-radius:10px;background:rgba(124,255,178,.12);border:1px solid rgba(124,255,178,.3);color:#7cffb2;font-size:11px}.error-box{margin-top:12px;padding:12px;border-radius:10px;background:rgba(255,100,100,.1);border:1px solid rgba(255,100,100,.3);color:#ffb4b4;font-size:11px}
@media(max-width:850px){.method-row{grid-template-columns:1fr}.glass{padding:22px!important} }
</style>
