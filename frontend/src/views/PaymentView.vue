<template>
  <div
    class="mx-auto max-w-[1240px] px-5 sm:px-8 py-8 sm:py-10 animate-[fadeIn_0.5s_ease]"
  >
    <div class="flex items-center gap-3 mb-6">
      <div class="text-[11px] tracking-[0.18em] uppercase opacity-50">
        Secure checkout • Encrypted • ZAR • Paystack
      </div>
      <div class="ml-auto text-[11px] tracking-[0.08em] opacity-50">
        {{ store.cart.length }} item{{ store.cart.length !== 1 ? "s" : "" }}
        from cart
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      <!-- LEFT: Order Summary - REAL CART ONLY -->
      <div class="glass p-5 sm:p-6 lg:sticky lg:top-[84px]">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-[13px] tracking-[0.16em] uppercase font-medium">
            Order Summary
          </h2>
          <span
            class="text-[10px] tracking-[0.16em] uppercase px-2 py-1 rounded-full bg-[var(--sw-input-background)] border border-[var(--sw-input-border)] opacity-70"
            >{{ store.cart.length }} ITEMS • LIVE</span
          >
        </div>

        <div v-if="loadingCart" class="space-y-3">
          <div
            class="h-5 w-full bg-[var(--sw-input-background)] rounded animate-pulse"
          ></div>
          <div
            class="h-5 w-[68%] bg-[var(--sw-input-background)] rounded animate-pulse"
          ></div>
          <p class="text-[12px] opacity-60 mt-2">Loading your cart…</p>
        </div>

        <div v-else-if="store.cart.length === 0" class="text-center py-8">
          <div
            class="w-[64px] h-[64px] mx-auto rounded-full bg-[var(--sw-input-background)] border border-[var(--sw-input-border)] grid place-items-center text-[22px] mb-3"
          >
            🛒
          </div>
          <p class="text-[12px] font-medium">Your cart is empty</p>
          <p
            class="text-[11px] opacity-60 leading-[1.5] mt-1 max-w-[280px] mx-auto"
          >
            Items you add on the cart page will appear here automatically. This
            panel is 100% driven by
            <code
              class="px-1 py-0.5 rounded bg-[var(--sw-input-background)] border border-[var(--sw-input-border)] text-[10px]"
              >/api/cart</code
            >
            — no dummy data.
          </p>
          <div
            class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(200,176,25,0.12)] border border-[rgba(200,176,25,0.2)] text-[10px] tracking-[0.08em] uppercase"
          >
            <span
              class="w-2 h-2 rounded-full bg-[var(--sw-gold-500)] animate-pulse"
            ></span>
            Live from MySQL cart
          </div>
        </div>

        <div v-else class="space-y-3 mb-6">
          <div
            v-for="item in store.cart"
            :key="item.id"
            class="flex gap-3 p-3 rounded-[14px] border border-[var(--sw-input-border)] bg-[var(--sw-input-background)]"
          >
            <div
              class="w-[54px] h-[54px] rounded-[12px] shrink-0"
              :style="{
                background:
                  item.gradient || 'linear-gradient(135deg,#312b50,#795d89)',
              }"
            ></div>
            <div class="flex-1 min-w-0">
              <div class="text-[12px] font-medium leading-[1.2] truncate">
                {{ item.name }}
              </div>
              <div
                class="text-[10px] tracking-[0.12em] uppercase opacity-50 mt-1"
              >
                QTY {{ item.qty }}
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[12px] font-medium"
                  >R{{ (item.price * item.qty).toLocaleString() }}</span
                >
                <span class="ml-auto text-[10px] opacity-50"
                  >R{{ item.price }} ea</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="store.cart.length > 0"
          class="space-y-2 text-[12px] py-4 border-y border-[var(--sw-input-border)] border-dashed"
        >
          <div class="flex justify-between opacity-70">
            <span>Subtotal</span
            ><span>R{{ store.cartTotal.toLocaleString() }}</span>
          </div>
          <div
            v-if="store.discount > 0"
            class="flex justify-between text-[var(--sw-gold-500)]"
          >
            <span>Voucher Discount</span
            ><span>-R{{ store.discount.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between opacity-70">
            <span>Platform fee (1.7%)</span
            ><span
              >R{{ Math.round(store.cartTotal * 0.017).toLocaleString() }}</span
            >
          </div>
        </div>

        <div
          v-if="store.cart.length > 0"
          class="flex justify-between items-baseline mt-4"
        >
          <span class="text-[11px] tracking-[0.18em] uppercase opacity-60"
            >Total to pay</span
          >
          <span class="text-[26px] tracking-[-0.02em] font-medium"
            >R{{ store.finalTotal.toLocaleString() }}</span
          >
        </div>

        <div v-if="pots.length" class="mt-6">
          <label class="input-label">Stokvel Pot (optional)</label>
          <select v-model="store.selectedPotId" class="sw-input">
            <option :value="null">Direct payment — no pot</option>
            <option v-for="pot in pots" :key="pot.id" :value="pot.id">
              {{ pot.pot_name || pot.name }} — R{{
                pot.available_amount || pot.balance
              }}
            </option>
          </select>
        </div>
      </div>

      <!-- RIGHT: Payment Method with your button styling -->
      <div class="glass p-5 sm:p-7">
        <div class="flex items-center justify-between gap-4 mb-6">
          <h2 class="text-[13px] tracking-[0.16em] uppercase font-medium">
            Payment Method
          </h2>
          <div class="text-[10px] tracking-[0.12em] uppercase opacity-50">
            PCI • 3D Secure • POPiA
          </div>
        </div>

        <div class="flex gap-2 mb-7">
          <button
            @click="store.paymentMethod = 'card'"
            :class="[
              'method-pill',
              store.paymentMethod === 'card' ? 'active' : '',
            ]"
          >
            ◍ Card
          </button>
          <button
            @click="store.paymentMethod = 'bank'"
            :class="[
              'method-pill',
              store.paymentMethod === 'bank' ? 'active' : '',
            ]"
          >
            ⌁ Bank Transfer
          </button>
          <button
            @click="store.paymentMethod = 'voucher'"
            :class="[
              'method-pill',
              store.paymentMethod === 'voucher' ? 'active' : '',
            ]"
          >
            ✦ Voucher
          </button>
        </div>

        <PaymentComponent
          :method="store.paymentMethod"
          :total="store.finalTotal"
          :card-id="store.selectedPotId"
          :has-cart="store.cart.length > 0"
          @paid="onPaid"
          @failed="onFailed"
        />

        <div
          v-if="lastResult"
          class="mt-6 p-3 rounded-[12px] bg-[var(--sw-input-background)] border border-[var(--sw-input-border)] text-[10px] overflow-auto"
        >
          <pre>{{ lastResult }}</pre>
        </div>

        <div
          class="mt-6 flex flex-wrap gap-2 text-[10px] tracking-[0.08em] uppercase opacity-50"
        >
          <span
            class="px-2 py-1 rounded-full border border-[var(--sw-input-border)] bg-[var(--sw-input-background)]"
            >Visa</span
          >
          <span
            class="px-2 py-1 rounded-full border border-[var(--sw-input-border)] bg-[var(--sw-input-background)]"
            >Mastercard</span
          >
          <span
            class="px-2 py-1 rounded-full border border-[var(--sw-input-border)] bg-[var(--sw-input-background)]"
            >Google Pay</span
          >
          <span
            class="px-2 py-1 rounded-full border border-[var(--sw-input-border)] bg-[var(--sw-input-background)]"
            >Paystack Secured</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { usePaymentStore } from "../../src/stores/payment.js";
import PaymentComponent from "../components/cart/PaymentComponent.vue";

const store = usePaymentStore();
const router = useRouter();
const pots = ref([]);
const lastResult = ref("");
const loadingCart = ref(false);
const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

onMounted(async () => {
  loadingCart.value = true;
  try {
    const r = await fetch(`${API}/cart`, { credentials: "include" });
    const data = await r.json();
    const items = Array.isArray(data) ? data : data.items || [];
    store.setCart(items);
  } catch {
    store.setCart([]);
  } finally {
    loadingCart.value = false;
  }

  try {
    const r = await fetch(`${API}/payments/pots`, { credentials: "include" });
    const data = await r.json();
    pots.value = Array.isArray(data) ? data : data.pots || [];
  } catch {}
});

function onPaid(data) {
  lastResult.value = JSON.stringify(data, null, 2);
  router.push("/success");
}
function onFailed(data) {
  lastResult.value = "FAILED: " + JSON.stringify(data, null, 2);
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
