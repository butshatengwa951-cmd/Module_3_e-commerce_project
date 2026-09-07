<template>
  <div class="space-y-5">
    <!-- GOOGLE SAVED CARDS BANNER -->
    <div
      v-if="method === 'card'"
      class="rounded-[14px] border border-dashed border-[var(--sw-input-border)] bg-[var(--sw-input-background)] p-4 flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-white/15 backdrop-blur grid place-items-center text-[10px] font-medium"
        >
          G
        </div>
        <div>
          <div class="text-[12px] font-medium">Use saved card from Google</div>
          <div class="text-[10px] opacity-60 leading-[1.4]">
            Chrome autofills from chrome://settings/payments. Luhn + expiry
            verification runs instantly.
          </div>
        </div>
      </div>
      <button
        v-if="canUsePaymentRequest"
        @click="useBrowserPayment"
        class="btn-pill btn-ghost text-[11px] px-3 py-2"
      >
        Use Browser Card
      </button>
    </div>

    <!-- VOUCHER -->
    <div v-if="method === 'voucher'" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">Voucher Code</label>
          <input
            v-model="voucher.code"
            class="sw-input"
            placeholder="STOCK10 or WELCOME50"
            @keyup.enter="applyVoucher"
          />
        </div>
        <div>
          <label class="input-label">PIN (if required)</label>
          <input
            v-model="voucher.pin"
            class="sw-input"
            type="password"
            placeholder="••••"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <button
          @click="applyVoucher"
          :disabled="!voucher.code"
          class="btn-pill btn-primary h-[46px] px-6"
        >
          Apply Voucher
        </button>
        <span
          v-if="voucherError"
          class="text-[11px] px-3 py-2 rounded-[10px] bg-[#fdecea] text-[#7a2a1f] border border-[#f5c2b8]"
          >{{ voucherError }}</span
        >
        <span
          v-if="voucherSuccess"
          class="text-[11px] px-3 py-2 rounded-[10px] bg-[#e6f4ea] text-[#1a5c2a] border border-[#b7e1c0]"
          >{{ voucherSuccess }}</span
        >
      </div>
      <div v-if="paymentStore.vouchers.length" class="flex flex-wrap gap-2">
        <span
          v-for="v in paymentStore.vouchers"
          :key="v.code"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] bg-[var(--sw-input-background)] border border-[var(--sw-input-border)]"
          >{{ v.code }} ✓
          <button
            @click="removeVoucher(v.code)"
            class="w-5 h-5 rounded-full bg-black/10 grid place-items-center"
          >
            ×
          </button></span
        >
      </div>
    </div>

    <!-- BANK -->
    <div v-if="method === 'bank'" class="space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">Bank Name *</label>
          <select v-model="bank.bankName" class="sw-input">
            <option>Standard Bank</option>
            <option>FNB</option>
            <option>Absa</option>
            <option>Capitec</option>
            <option>Nedbank</option>
            <option>TymeBank</option>
          </select>
        </div>
        <div>
          <label class="input-label">Account Type *</label>
          <select v-model="bank.accountType" class="sw-input">
            <option value="savings">Savings</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="input-label">Account Holder *</label>
          <input
            v-model="bank.holder"
            class="sw-input"
            placeholder="Full name as per bank"
            autocomplete="name"
          />
        </div>
        <div>
          <label class="input-label">Account Number *</label>
          <input
            v-model="bank.accountNumber"
            class="sw-input"
            placeholder="10 0000 0000"
            inputmode="numeric"
          />
        </div>
        <div>
          <label class="input-label">Branch Code *</label>
          <input
            v-model="bank.branchCode"
            class="sw-input"
            placeholder="051001"
            inputmode="numeric"
          />
        </div>
      </div>
    </div>

    <!-- CARD -->
    <div v-if="method === 'card'" class="space-y-5">
      <div>
        <label class="input-label">Cardholder Name *</label>
        <div class="relative">
          <input
            v-model="card.holder"
            class="sw-input pr-[60px]"
            placeholder="e.g. N. Dlamini"
            autocomplete="cc-name"
            name="cc-name"
            id="cc-name"
            @blur="validateHolder"
          />
          <span
            v-if="validation.holder"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full grid place-items-center text-[10px] font-medium text-white"
            :class="
              validation.holder === 'valid' ? 'bg-[#1d7a33]' : 'bg-[#a33c2d]'
            "
            >{{ validation.holder === "valid" ? "✓" : "✗" }}</span
          >
        </div>
      </div>

      <div>
        <label class="input-label"
          >Card Number • 0000 0000 0000 0000 — pulls from Google</label
        >
        <div class="relative">
          <input
            v-model="card.number"
            class="sw-input pr-[110px]"
            placeholder="4242 4242 4242 4242"
            autocomplete="cc-number"
            name="cc-number"
            id="cc-number"
            inputmode="numeric"
            @input="formatAndVerifyCard"
            maxlength="19"
          />
          <span
            v-if="cardType"
            class="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.12em] opacity-50 font-medium"
            >{{ cardType }}</span
          >
          <span
            v-if="validation.number"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full grid place-items-center text-[10px] text-white"
            :class="
              validation.number === 'valid' ? 'bg-[#1d7a33]' : 'bg-[#a33c2d]'
            "
            >{{ validation.number === "valid" ? "✓" : "✗" }}</span
          >
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">Expiry MM/YY *</label>
          <div class="relative">
            <input
              v-model="card.expiry"
              class="sw-input pr-[40px]"
              placeholder="08/28"
              autocomplete="cc-exp"
              name="cc-exp"
              id="cc-exp"
              inputmode="numeric"
              @input="formatExpiry"
              @blur="validateExpiry"
              maxlength="5"
            />
            <span
              v-if="validation.expiry"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full grid place-items-center text-[10px] text-white"
              :class="
                validation.expiry === 'valid' ? 'bg-[#1d7a33]' : 'bg-[#a33c2d]'
              "
              >{{ validation.expiry === "valid" ? "✓" : "✗" }}</span
            >
          </div>
        </div>
        <div>
          <label class="input-label">CVV *</label>
          <div class="relative">
            <input
              v-model="card.cvv"
              class="sw-input pr-[40px]"
              type="password"
              placeholder="123"
              autocomplete="cc-csc"
              name="cc-csc"
              id="cc-csc"
              inputmode="numeric"
              @blur="validateCvv"
              maxlength="4"
            />
            <span
              v-if="validation.cvv"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full grid place-items-center text-[10px] text-white"
              :class="
                validation.cvv === 'valid' ? 'bg-[#1d7a33]' : 'bg-[#a33c2d]'
              "
              >{{ validation.cvv === "valid" ? "✓" : "✗" }}</span
            >
          </div>
        </div>
      </div>

      <div
        class="rounded-[14px] border border-[var(--sw-input-border)] bg-[var(--sw-input-background)] p-4 space-y-1"
      >
        <div class="text-[10px] tracking-[0.14em] uppercase opacity-50 mb-2">
          Verification — same as first version
        </div>
        <div class="flex justify-between text-[11px]">
          <span>Card number (Luhn)</span
          ><span class="font-medium">{{ validation.number || "—" }}</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span>Expiry</span
          ><span class="font-medium">{{ validation.expiry || "—" }}</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span>CVV</span
          ><span class="font-medium">{{ validation.cvv || "—" }}</span>
        </div>
        <div class="flex justify-between text-[11px]">
          <span>Holder</span
          ><span class="font-medium">{{ validation.holder || "—" }}</span>
        </div>
        <div class="text-[10px] opacity-50 mt-2">
          Test: 4242 4242 4242 4242 • any future expiry • any 3-digit CVV.
          Google autofill triggers checks automatically.
        </div>
      </div>
    </div>

    <!-- Common -->
    <div
      class="space-y-4 pt-2 border-t border-[var(--sw-input-border)] border-dashed"
    >
      <div>
        <label class="input-label">Email for Paystack Receipt *</label>
        <input
          v-model="common.email"
          type="email"
          class="sw-input"
          placeholder="you@email.com"
          autocomplete="email"
          required
        />
      </div>
      <div>
        <label class="input-label">Member Name *</label>
        <input
          v-model="common.memberName"
          class="sw-input"
          placeholder="Your stokvel member name"
        />
      </div>
    </div>

    <div
      v-if="paystack.reference"
      class="rounded-[14px] border border-dashed border-[var(--sw-input-border)] bg-[rgba(255,255,255,0.18)] p-4 space-y-3"
    >
      <div class="text-[11px] tracking-[0.14em] uppercase opacity-60">
        Paystack Checkout — Verification
      </div>
      <div class="text-[12px]">
        <span class="opacity-60">Reference:</span>
        <span class="font-medium">{{ paystack.reference }}</span>
      </div>
      <div class="flex gap-2">
        <a
          :href="paystack.authorization_url"
          target="_blank"
          class="btn-pill btn-primary h-[46px] px-6 flex-1"
          >Open Paystack</a
        >
        <button
          @click="verifyPaystack"
          :disabled="verifying"
          class="btn-pill btn-ghost h-[46px] px-6 flex-1"
        >
          {{ verifying ? "Verifying…" : "I've Paid — Verify" }}
        </button>
      </div>
    </div>

    <button
      @click="pay"
      :disabled="
        loading ||
        total <= 0 ||
        !canPay ||
        (method === 'card' && !isCardVerified)
      "
      class="btn-pill btn-primary w-full py-[15px] text-[13px] tracking-[0.08em]"
    >
      <span
        v-if="loading"
        class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2"
      ></span>
      {{
        loading
          ? "Initializing Paystack…"
          : `Pay R${total.toLocaleString()} — Secure →`
      }}
    </button>
    <p
      v-if="error"
      class="text-[11px] px-3 py-2 rounded-[10px] bg-[#fdecea] text-[#7a2a1f] border border-[#f5c2b8]"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { usePaymentStore } from "../../stores/payment.js";
const props = defineProps({
  method: String,
  total: Number,
  cardId: Number,
  hasCart: Boolean,
});
const emit = defineEmits(["paid", "failed"]);
const paymentStore = usePaymentStore();
const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const voucher = ref({ code: "", pin: "" });
const voucherError = ref("");
const voucherSuccess = ref("");
const bank = ref({
  bankName: "Standard Bank",
  holder: "",
  accountNumber: "",
  branchCode: "",
  accountType: "savings",
});
const card = ref({ holder: "", number: "", expiry: "", cvv: "", save: false });
const common = ref({ email: "", memberName: "" });
const validation = ref({ number: "", expiry: "", cvv: "", holder: "" });
const cardType = ref("");
const canUsePaymentRequest = ref(false);
const loading = ref(false);
const verifying = ref(false);
const error = ref("");
const paystack = ref({ reference: "", authorization_url: "" });
const isCardVerified = computed(() => {
  if (props.method !== "card") return true;
  return (
    validation.value.number === "valid" &&
    validation.value.expiry === "valid" &&
    validation.value.cvv === "valid" &&
    validation.value.holder === "valid"
  );
});
const canPay = computed(() => {
  if (!common.value.email || !common.value.memberName) return false;
  if (
    props.method === "bank" &&
    (!bank.value.holder || !bank.value.accountNumber || !bank.value.branchCode)
  )
    return false;
  if (props.method === "voucher" && paymentStore.vouchers.length === 0)
    return false;
  if (props.total <= 0) return false;
  return true;
});
onMounted(async () => {
  try {
    const r = await fetch(`${API}/auth/me`, { credentials: "include" });
    if (r.ok) {
      const u = await r.json();
      common.value.email = u.email || "";
      common.value.memberName = u.name || u.member_name || "";
      bank.value.holder = u.name || "";
    }
  } catch {}
  if (window.PaymentRequest) {
    try {
      const pr = new PaymentRequest([{ supportedMethods: "basic-card" }], {
        total: { label: "Total", amount: { currency: "ZAR", value: "1" } },
      });
      canUsePaymentRequest.value = await pr.canMakePayment();
    } catch {
      canUsePaymentRequest.value = false;
    }
  }
  const params = new URLSearchParams(window.location.search);
  const ref =
    params.get("reference") ||
    params.get("trxref") ||
    localStorage.getItem("sw_last_reference");
  if (ref) paystack.value.reference = ref;
});
function formatAndVerifyCard() {
  let raw = card.value.number.replace(/\D/g, "");
  if (/^4/.test(raw)) cardType.value = "VISA";
  else if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw))
    cardType.value = "MASTERCARD";
  else if (/^3[47]/.test(raw)) cardType.value = "AMEX";
  else if (/^6/.test(raw)) cardType.value = "DISCOVER";
  else cardType.value = raw ? "CARD" : "";
  card.value.number = raw.replace(/(.{4})/g, "$1 ").trim();
  if (raw.length < 13) {
    validation.value.number = "";
    return;
  }
  validation.value.number = luhnCheck(raw) ? "valid" : "invalid";
}
function luhnCheck(num) {
  let sum = 0,
    alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function formatExpiry() {
  let v = card.value.expiry.replace(/\D/g, "").slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
  card.value.expiry = v;
}
function validateExpiry() {
  const m = card.value.expiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
  if (!m) {
    validation.value.expiry = card.value.expiry ? "invalid" : "";
    return;
  }
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  const now = new Date();
  const exp = new Date(year, month - 1, 1);
  exp.setMonth(exp.getMonth() + 1);
  validation.value.expiry = exp > now ? "valid" : "invalid";
}
function validateCvv() {
  const v = card.value.cvv;
  if (!v) {
    validation.value.cvv = "";
    return;
  }
  validation.value.cvv = /^[0-9]{3,4}$/.test(v) ? "valid" : "invalid";
}
function validateHolder() {
  const v = card.value.holder.trim();
  if (!v) {
    validation.value.holder = "";
    return;
  }
  validation.value.holder = v.length >= 2 ? "valid" : "invalid";
}
async function useBrowserPayment() {
  try {
    const supported = [
      {
        supportedMethods: "basic-card",
        data: { supportedNetworks: ["visa", "mastercard", "amex"] },
      },
    ];
    const details = {
      total: {
        label: "StockWell",
        amount: { currency: "ZAR", value: String(props.total) },
      },
    };
    const pr = new PaymentRequest(supported, details);
    const response = await pr.show();
    card.value.holder =
      response.details.cardholderName || response.payerName || "";
    card.value.number = response.details.cardNumber || "";
    card.value.expiry =
      response.details.expiryMonth && response.details.expiryYear
        ? `${String(response.details.expiryMonth).padStart(2, "0")}/${String(response.details.expiryYear).slice(-2)}`
        : "";
    card.value.cvv = response.details.cardSecurityCode || "";
    common.value.email = response.payerEmail || common.value.email;
    formatAndVerifyCard();
    validateExpiry();
    validateCvv();
    validateHolder();
    await response.complete("success");
  } catch (e) {
    error.value = e.message;
  }
}
function applyVoucher() {
  voucherError.value = "";
  voucherSuccess.value = "";
  const ok = paymentStore.applyVoucher(voucher.value.code);
  if (!ok) {
    voucherError.value =
      "Invalid or already applied — try STOCK10, WELCOME50, GLOBAL20";
    return;
  }
  voucherSuccess.value = `${voucher.value.code.toUpperCase()} applied`;
  voucher.value.code = "";
  voucher.value.pin = "";
}
function removeVoucher(code) {
  paymentStore.vouchers = paymentStore.vouchers.filter((v) => v.code !== code);
}
async function pay() {
  loading.value = true;
  error.value = "";
  try {
    if (props.method === "voucher") {
      if (props.cardId) {
        const potRes = await fetch(`${API}/payments/orders/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            card_id: props.cardId,
            total_amount: props.total,
            vouchers: paymentStore.vouchers,
            member_name: common.value.memberName,
            email: common.value.email,
          }),
        });
        const potData = await potRes.json();
        if (potData.success) {
          paymentStore.clearCart();
          emit("paid", potData);
          return;
        } else throw new Error(potData.message || "Pot payment failed");
      } else throw new Error("Select a stokvel pot to use voucher");
    }
    const payload = {
      amount: Math.round(props.total * 100),
      amount_display: props.total,
      email: common.value.email,
      member_name: common.value.memberName,
      method: props.method.toUpperCase(),
      card_id: props.cardId,
      banking_details: props.method === "bank" ? bank.value : null,
      card_details:
        props.method === "card"
          ? {
              holder: card.value.holder,
              last4: card.value.number.slice(-4),
              type: cardType.value,
            }
          : null,
      vouchers: paymentStore.vouchers,
      callback_url: window.location.origin + "/success",
    };
    const res = await fetch(`${API}/payments/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        data.message || data.error || "Failed to initialize Paystack",
      );
    if (data.authorization_url && data.reference) {
      paystack.value = {
        authorization_url: data.authorization_url,
        reference: data.reference,
      };
      localStorage.setItem("sw_last_reference", data.reference);
      window.location.href = data.authorization_url;
    } else if (data.success) {
      paymentStore.clearCart();
      emit("paid", data);
    } else throw new Error(data.message || "Unable to start Paystack");
  } catch (e) {
    error.value = e.message;
    emit("failed", e);
  } finally {
    loading.value = false;
  }
}
async function verifyPaystack() {
  if (!paystack.value.reference) return;
  verifying.value = true;
  error.value = "";
  try {
    const res = await fetch(
      `${API}/payments/verify/${paystack.value.reference}`,
      { credentials: "include" },
    );
    const data = await res.json();
    if (
      data.success ||
      data.status === "success" ||
      data.payment_status === "Paid"
    ) {
      paymentStore.clearCart();
      localStorage.removeItem("sw_last_reference");
      emit("paid", data);
    } else throw new Error(data.message || "Not verified yet");
  } catch (e) {
    error.value = e.message;
  } finally {
    verifying.value = false;
  }
}
</script>
