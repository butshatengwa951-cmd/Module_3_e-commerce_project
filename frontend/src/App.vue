<template>
  <div>
    <h1>StockWell - IT WORKS!</h1>
    <p>If you see this, Vue is running.</p>
    <p>API: {{ api }}</p>
    <button @click="testBackend">Test Backend - Click Me</button>
    <pre>{{ result }}</pre>
    <hr />
    <h2>Payment Tester</h2>
    <label>Card ID: <input v-model.number="cardId" type="number" /></label>
    <button @click="checkBalance">Check Pot Balance</button>
    <pre>{{ balance }}</pre>
  </div>
</template>

<script>
export default {
  data() {
    return {
      api: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
      cardId: 1,
      result: "",
      balance: "",
    };
  },
  methods: {
    async testBackend() {
      try {
        const res = await fetch(`${this.api}/payments/balance/${this.cardId}`);
        this.result = JSON.stringify(await res.json(), null, 2);
      } catch (e) {
        this.result =
          "BACKEND ERROR: " +
          e.message +
          " - Is your backend on port 5000 running?";
      }
    },
    async checkBalance() {
      this.testBackend();
    },
  },
  mounted() {
    this.testBackend();
  },
};
</script>
