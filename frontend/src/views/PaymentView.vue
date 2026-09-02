<template>
  <div>
    <h2>Cart Checkout - StockWell</h2>

    <h3>Your Cart</h3>
    <div v-for="(item, idx) in cart" :key="idx">
      <span
        >{{ item.name }} x{{ item.qty }} - R{{ item.price * item.qty }}</span
      >
    </div>
    <p>
      <strong>Total: R{{ cartTotal }}</strong>
    </p>

    <h3>Select Stokvel Pot</h3>
    <label
      >Pot / Card ID: <input v-model.number="selectedCardId" type="number"
    /></label>
    <button @click="loadPot">Load Pot</button>
    <pre>{{ potInfo }}</pre>

    <!-- USE THE PAYMENT COMPONENT -->
    <PaymentComponent
      :card-id="selectedCardId"
      :cart-total="cartTotal"
      @paid="onPaymentSuccess"
      @failed="onPaymentFailed"
    />

    <div v-if="lastPayment">
      <h3>Last Payment Result</h3>
      <pre>{{ lastPayment }}</pre>
    </div>
  </div>
</template>

<script>
import PaymentComponent from "../components/cart/PaymentComponent.vue";

export default {
  name: "PaymentView",
  components: { PaymentComponent },
  data() {
    return {
      API: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
      selectedCardId: 1,
      cart: [
        { name: "10kg Rice", price: 120, qty: 2 },
        { name: "Cooking Oil 5L", price: 200, qty: 1 },
        { name: "Sugar 5kg", price: 80, qty: 3 },
      ],
      potInfo: "",
      lastPayment: "",
    };
  },
  computed: {
    cartTotal() {
      return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    },
  },
  mounted() {
    this.loadPot();
  },
  methods: {
    async loadPot() {
      try {
        const res = await fetch(
          `${this.API}/payments/balance/${this.selectedCardId}`,
        );
        this.potInfo = JSON.stringify(await res.json(), null, 2);
      } catch (e) {
        this.potInfo = e.message;
      }
    },
    onPaymentSuccess(data) {
      this.lastPayment = JSON.stringify(data, null, 2);
      alert("Payment successful! Cart will be cleared.");
      // Here you would clear cart, create order_details, etc.
      // Example: this.cart = []
    },
    onPaymentFailed(data) {
      this.lastPayment = "FAILED: " + JSON.stringify(data, null, 2);
    },
  },
};
</script>
