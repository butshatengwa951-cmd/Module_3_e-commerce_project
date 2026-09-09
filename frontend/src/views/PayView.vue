<template>
  <div
    style="
      max-width: 1320px;
      margin: 0 auto;
      padding: 32px 24px;
      position: relative;
      z-index: 2;
    "
  >
    <div
      v-if="auth.isLoggedIn"
      style="
        margin-bottom: 16px;
        padding: 10px 16px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 11px;
        color: white;
        font-family: ui-monospace;
      "
    >
      👤 {{ auth.fullName }} ({{ auth.email }})
    </div>
    <div style="display: grid; grid-template-columns: 380px 1fr; gap: 28px">
      <div
        class="glass"
        style="padding: 28px 26px; max-height: 450px; border-radius: 28px"
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 36px;
          "
        >
          <div
            style="
              font-size: 12px;
              letter-spacing: 0.14em;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.9);
              font-family: ui-monospace;
            "
          >
            ORDER SUMMARY
          </div>
          <div
            style="
              font-size: 11px;
              padding: 7px 14px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.14);
              color: white;
              font-family: ui-monospace;
            "
          >
            {{ items.length }} ITEMS • LIVE
          </div>
        </div>
        <div
          v-if="!items.length"
          style="text-align: center; padding: 90px 20px"
        >
          <div
            style="
              width: 72px;
              height: 72px;
              border-radius: 18px;
              background: rgba(255, 255, 255, 0.07);
              border: 1px solid rgba(255, 255, 255, 0.12);
              display: grid;
              place-items: center;
              margin: 0 auto 28px;
            "
          >
            🛒
          </div>
          <div style="font-size: 14px; font-weight: 600; color: white">
            Your cart is empty
          </div>
          <button
            @click="addDemo"
            :disabled="addingDemo"
            style="
              margin-top: 22px;
              padding: 11px 18px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.14);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: white;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
              font-family: ui-monospace;
            "
          >
            {{ addingDemo ? "ADDING..." : "+ ADD DEMO PRODUCT" }}
          </button>
          <div
            style="
              margin-top: 32px;
              display: inline-flex;
              gap: 8px;
              padding: 9px 16px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 255, 255, 0.1);
              font-size: 11px;
              color: rgba(255, 255, 255, 0.6);
              font-family: ui-monospace;
            "
          >
            <span
              style="
                width: 6px;
                height: 6px;
                border-radius: 999px;
                background: #2dd4bf;
              "
            ></span
            >LISTENING /API/CART • {{ items.length }} ITEMS
          </div>
        </div>
        <div v-else>
          <div
            v-for="it in items"
            :key="it.id"
            style="
              display: flex;
              justify-content: space-between;
              padding: 14px 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
              color: white;
            "
          >
            <span>{{ it.product_name }} x{{ it.qty }}</span
            ><span>R{{ (it.price * it.qty).toFixed(2) }}</span>
          </div>
          <div
            style="
              display: flex;
              justify-content: space-between;
              margin-top: 16px;
              font-weight: 700;
              color: white;
            "
          >
            <span>Total</span><span>R{{ total.toFixed(2) }}</span>
          </div>
          <div
            v-if="voucherDiscount > 0"
            style="
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
              color: #7cffb2;
              font-size: 12px;
            "
          >
            <span>Voucher -{{ voucherCode }}</span
            ><span>-R{{ voucherDiscount.toFixed(2) }}</span>
          </div>
          <div
            v-if="voucherDiscount > 0"
            style="
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
              font-weight: 700;
              color: white;
            "
          >
            <span>Final</span
            ><span>R{{ (total - voucherDiscount).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="glass" style="padding: 28px 30px; border-radius: 28px">
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
          "
        >
          <div
            style="
              font-size: 12px;
              letter-spacing: 0.14em;
              font-weight: 700;
              color: white;
              font-family: ui-monospace;
            "
          >
            PAYMENT METHOD
          </div>
          <div
            style="
              font-size: 10px;
              color: rgba(255, 255, 255, 0.45);
              font-family: ui-monospace;
            "
          >
            PCI • 3D SECURE • POPIA
          </div>
        </div>
        <div
          style="
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 24px;
          "
        >
          <button
            @click="method = 'card'"
            :style="method === 'card' ? active : inactive"
          >
            ● CARD
          </button>
          <button
            @click="
              method = 'bank';
              loadBankCards();
            "
            :style="method === 'bank' ? active : inactive"
          >
            ≈ BANK
          </button>
          <button
            @click="
              method = 'voucher';
              loadVouchers();
            "
            :style="method === 'voucher' ? active : inactive"
          >
            ✦ VOUCHER
          </button>
        </div>

        <!-- CARD TAB -->
        <div v-if="method === 'card'">
          <div
            style="
              padding: 14px 16px;
              border-radius: 14px;
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 255, 255, 0.1);
              display: flex;
              gap: 12px;
              margin-bottom: 22px;
            "
          >
            <div
              style="
                width: 36px;
                height: 36px;
                border-radius: 999px;
                background: white;
                display: grid;
                place-items: center;
                font-weight: 800;
              "
            >
              G
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 600; color: white">
                Auto-fill from browser • Google Pay
              </div>
              <div style="font-size: 10px; color: rgba(255, 255, 255, 0.45)">
                Uses standard autocomplete: cc-name, cc-number, cc-exp, cc-csc
              </div>
            </div>
          </div>
          <form @submit.prevent="pay" autocomplete="on">
            <label class="lbl">CARDHOLDER NAME *</label
            ><input
              class="inp"
              v-model="form.name"
              name="cc-name"
              autocomplete="cc-name"
              required
            />
            <div style="margin-top: 18px">
              <label class="lbl">CARD NUMBER *</label
              ><input
                class="inp"
                v-model="form.number"
                name="cc-number"
                autocomplete="cc-number"
                placeholder="4242 4242 4242 4242"
                required
              />
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 14px;
                margin-top: 18px;
              "
            >
              <div>
                <label class="lbl">EXPIRY MM/YY *</label
                ><input
                  class="inp"
                  v-model="form.exp"
                  name="cc-exp"
                  autocomplete="cc-exp"
                  placeholder="08/28"
                  required
                />
              </div>
              <div>
                <label class="lbl">CVV *</label
                ><input
                  class="inp"
                  v-model="form.cvv"
                  name="cc-csc"
                  autocomplete="cc-csc"
                  placeholder="123"
                  required
                />
              </div>
            </div>
            <div
              style="
                margin-top: 18px;
                border-top: 1px dashed rgba(255, 255, 255, 0.12);
                padding-top: 18px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 14px;
              "
            >
              <div>
                <label class="lbl">EMAIL FOR RECEIPT *</label
                ><input
                  class="inp"
                  v-model="form.email"
                  name="email"
                  autocomplete="email"
                />
              </div>
              <div>
                <label class="lbl">MEMBER NAME *</label
                ><input
                  class="inp"
                  v-model="form.member"
                  name="name"
                  autocomplete="name"
                />
              </div>
            </div>
            <button type="submit" :disabled="loading" class="paybtn">
              {{
                loading
                  ? "Processing..."
                  : "Pay R" + (total - voucherDiscount).toFixed(2) + " • Secure"
              }}
            </button>
          </form>
        </div>

        <!-- BANK TAB - REAL DB card_details -->
        <div v-if="method === 'bank'">
          <div
            style="
              font-size: 11px;
              color: rgba(255, 255, 255, 0.7);
              margin-bottom: 12px;
            "
          >
            Select from card_details table (real balances):
          </div>
          <div
            v-if="!bankCards.length"
            style="
              padding: 20px;
              text-align: center;
              color: rgba(255, 255, 255, 0.5);
              font-size: 11px;
            "
          >
            Loading bank cards from DB...
          </div>
          <div
            v-for="c in bankCards"
            :key="c.card_id"
            @click="selectedCard = c.card_id"
            :style="
              selectedCard === c.card_id
                ? 'padding:14px; border-radius:12px; background:linear-gradient(90deg,#4a3e72,#c26b56); border:1px solid transparent; color:white; margin-bottom:10px; cursor:pointer'
                : 'padding:14px; border-radius:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:white; margin-bottom:10px; cursor:pointer'
            "
          >
            <div style="display: flex; justify-content: space-between">
              <span>{{ c.card_type }} • **** {{ c.last_four_digits }}</span
              ><span>R{{ Number(c.available_amount).toFixed(2) }}</span>
            </div>
            <div style="font-size: 10px; opacity: 0.7; margin-top: 4px">
              Voucher: {{ c.voucher_number }} • Exp:
              {{ c.expiry_date?.slice(0, 10) }} • Balance: R{{
                Number(c.available_amount).toFixed(2)
              }}
            </div>
          </div>
          <div
            style="
              margin-top: 18px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
            "
          >
            <div>
              <label class="lbl">EMAIL *</label
              ><input class="inp" v-model="form.email" />
            </div>
            <div>
              <label class="lbl">MEMBER NAME *</label
              ><input class="inp" v-model="form.member" />
            </div>
          </div>
          <button
            @click="pay"
            :disabled="loading || !selectedCard"
            class="paybtn"
          >
            Pay with Bank • R{{ (total - voucherDiscount).toFixed(2) }}
          </button>
          <div
            v-if="bankError"
            style="color: #ffb4b4; font-size: 11px; margin-top: 10px"
          >
            {{ bankError }}
          </div>
        </div>

        <!-- VOUCHER TAB - REAL DB vouchers -->
        <div v-if="method === 'voucher'">
          <div
            style="
              font-size: 11px;
              color: rgba(255, 255, 255, 0.7);
              margin-bottom: 12px;
            "
          >
            Real vouchers from DB: STOCK10 (10% off), WELCOME50 (R50 off),
            GLOBAL20 (20% off)
          </div>
          <div style="display: flex; gap: 10px">
            <input
              class="inp"
              v-model="voucherCode"
              placeholder="Enter code e.g. STOCK10"
              style="flex: 1"
            /><button
              @click="verifyVoucher"
              :disabled="verifying"
              style="
                padding: 12px 18px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                cursor: pointer;
              "
            >
              {{ verifying ? "..." : "Verify" }}
            </button>
          </div>
          <div
            v-if="voucherMsg"
            :style="
              voucherValid
                ? 'margin-top:12px; padding:12px; border-radius:10px; background:rgba(124,255,178,0.12); border:1px solid rgba(124,255,178,0.3); color:#7CFFB2; font-size:11px'
                : 'margin-top:12px; padding:12px; border-radius:10px; background:rgba(255,100,100,0.1); border:1px solid rgba(255,100,100,0.3); color:#ffb4b4; font-size:11px'
            "
          >
            {{ voucherMsg }}
          </div>
          <div
            style="
              margin-top: 18px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
            "
          >
            <div>
              <label class="lbl">EMAIL *</label
              ><input class="inp" v-model="form.email" />
            </div>
            <div>
              <label class="lbl">MEMBER NAME *</label
              ><input class="inp" v-model="form.member" />
            </div>
          </div>
          <button @click="pay" :disabled="loading" class="paybtn">
            Pay R{{ (total - voucherDiscount).toFixed(2) }} with Voucher{{
              voucherCode ? ` ${voucherCode}` : ""
            }}
          </button>
        </div>

        <div
          v-if="err"
          style="color: #ffb4b4; font-size: 11px; margin-top: 10px"
        >
          {{ err }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api.js";
import { useAuthStore } from "../stores/auth.js";
const auth = useAuthStore();
const router = useRouter();
const method = ref("card");
const items = ref([]);
const addingDemo = ref(false);
const form = ref({
  name: "",
  number: "4242 4242 4242 4242",
  exp: "08/28",
  cvv: "123",
  email: "guest@stockwell.global",
  member: "N. Dlamini",
});
const loading = ref(false);
const err = ref("");
const total = computed(() =>
  items.value.reduce((a, b) => a + Number(b.price) * (b.qty || 1), 0),
);
const active =
  "padding:14px; border-radius:999px; background:linear-gradient(90deg,#4a3e72,#c26b56); color:white; border:none; font-weight:600";
const inactive =
  "padding:14px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); color:rgba(255,255,255,0.6)";
const bankCards = ref([]);
const selectedCard = ref(null);
const bankError = ref("");
const voucherCode = ref("");
const voucherDiscount = ref(0);
const voucherMsg = ref("");
const voucherValid = ref(false);
const verifying = ref(false);

async function load() {
  if (auth.isLoggedIn) {
    form.value.email = auth.email;
    form.value.member = auth.fullName || form.value.member;
  }
  const p = new URLSearchParams({ email: form.value.email });
  if (auth.userId) p.set("user_id", auth.userId);
  const { data } = await api.get("/cart?" + p);
  items.value = data;
}
async function addDemo() {
  addingDemo.value = true;
  try {
    const { data: prods } = await api.get("/products");
    const p = prods[0];
    await api.post("/cart", {
      email: form.value.email,
      user_id: auth.userId,
      product_id: p.id || p.product_id,
      price: p.price,
      qty: 1,
    });
    await load();
  } catch (e) {}
  addingDemo.value = false;
}
async function loadBankCards() {
  try {
    const { data } = await api.get("/cards");
    bankCards.value = data;
    if (data.length && !selectedCard.value)
      selectedCard.value = data[0].card_id;
  } catch (e) {
    bankError.value = e.message;
  }
}
async function loadVouchers() {
  try {
    await api.get("/vouchers");
  } catch {}
}
async function verifyVoucher() {
  verifying.value = true;
  voucherMsg.value = "";
  voucherValid.value = false;
  voucherDiscount.value = 0;
  try {
    const { data } = await api.post("/vouchers/verify", {
      code: voucherCode.value,
      total: total.value,
    });
    voucherValid.value = true;
    voucherDiscount.value = data.discount;
    voucherMsg.value = `✅ Valid! ${data.voucher.code} gives R${data.discount.toFixed(2)} off. New total: R${data.newTotal.toFixed(2)} (${data.voucher.discount_type === "percent" ? data.voucher.discount_value + "%" : "R" + data.voucher.discount_value} off)`;
  } catch (e) {
    voucherMsg.value = e.response?.data?.error || "Invalid voucher";
    voucherValid.value = false;
    voucherDiscount.value = 0;
  }
  verifying.value = false;
}
async function pay() {
  if (!items.value.length) return;
  loading.value = true;
  err.value = "";
  bankError.value = "";
  try {
    const payload = {
      email: form.value.email,
      user_id: auth.userId,
      member_name: form.value.member,
      total: total.value,
      items: items.value.map((i) => ({
        product_id: i.product_id,
        name: i.product_name,
        price: i.price,
        qty: i.qty,
      })),
      address: "12 Loop St",
      method: method.value,
      voucher_code: method.value === "voucher" ? voucherCode.value : null,
      card_id: method.value === "bank" ? selectedCard.value : null,
    };
    const { data } = await api.post("/pay", payload);
    router.push("/delivery/" + data.tracking_number);
  } catch (e) {
    err.value = e.response?.data?.error || e.message;
    bankError.value = err.value;
  }
  loading.value = false;
}
onMounted(() => {
  auth.syncFromStorage();
  load();
});
</script>
<style scoped>
.lbl {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.55);
  display: block;
  margin-bottom: 8px;
  font-family: ui-monospace;
}
.inp {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.07);
  color: white;
}
.paybtn {
  width: 100%;
  margin-top: 22px;
  padding: 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #6a5da0, #c47a6a);
  color: white;
  font-weight: 700;
  cursor: pointer;
}
</style>
