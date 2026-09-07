import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const usePaymentStore = defineStore("payment", () => {
  const cart = ref([]); // REAL CART ONLY - populated from /api/cart
  const selectedPotId = ref(null);
  const paymentMethod = ref("card");
  const vouchers = ref([]);

  const cartTotal = computed(() =>
    cart.value.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0),
  );
  const discount = computed(() => {
    let d = 0;
    vouchers.value.forEach((v) => {
      if (v.code === "STOCK10") d += cartTotal.value * 0.1;
      if (v.code === "WELCOME50") d += 50;
      if (v.code === "GLOBAL20") d += cartTotal.value * 0.2;
    });
    return d;
  });
  const finalTotal = computed(() => {
    if (cart.value.length === 0) return 0;
    return Math.max(0, cartTotal.value - discount.value + 25);
  });

  function setCart(items) {
    cart.value = items;
  }
  function clearCart() {
    cart.value = [];
    vouchers.value = [];
  }
  function applyVoucher(code) {
    const up = code.toUpperCase();
    if (
      ["STOCK10", "WELCOME50", "GLOBAL20"].includes(up) &&
      !vouchers.value.find((v) => v.code === up)
    ) {
      vouchers.value.push({ code: up, appliedAt: new Date() });
      return true;
    }
    return false;
  }

  return {
    cart,
    cartTotal,
    discount,
    finalTotal,
    selectedPotId,
    paymentMethod,
    vouchers,
    setCart,
    clearCart,
    applyVoucher,
  };
});
