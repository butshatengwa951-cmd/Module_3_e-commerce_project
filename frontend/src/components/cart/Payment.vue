<template>
  <div>
    <h3>StockWell Payment - Pot {{ cardId }}</h3>
    <p>Balance: R{{ balance }}</p>

    <div v-if="step === 'form'">
      <h4>1. Who is contributing?</h4>
      <label
        >Member Name:
        <input
          v-model="form.member_name"
          placeholder="e.g. Nosipho Makeleni" /></label
      ><br />
      <label>Email (for Paystack receipt): <input v-model="form.email" /></label
      ><br />
      <label
        >Amount ZAR: <input v-model.number="form.amount" type="number" /></label
      ><br />
      <label
        >Method:
        <select v-model="form.method">
          <option value="EFT">EFT</option>
          <option value="Card">Card</option>
          <option value="Voucher">Stokvel Pot</option>
          <option value="Cash">Cash</option>
        </select> </label
      ><br />
      <button @click="contribute" :disabled="loading">
        {{ loading ? "Processing..." : "Contribute to Pot" }}
      </button>
      <p v-if="error" style="color: red">{{ error }}</p>
    </div>

    <div v-if="step === 'paystack'">
      <h4>Redirect to Paystack</h4>
      <p>Reference: {{ reference }}</p>
      <a :href="authUrl" target="_blank"
        ><button>Pay R{{ form.amount }} Now</button></a
      ><br />
      <button @click="verify">I've Paid - Verify</button>
      <pre>{{ result }}</pre>
    </div>

    <div v-if="step === 'success'">
      <h4>Payment Successful!</h4>
      <pre>{{ result }}</pre>
      <p>New Balance: R{{ balance }}</p>
      <button @click="reset">Contribute Again</button>
      <button @click="$emit('paid', result)">Close & Update Cart</button>
    </div>

    <div v-if="step === 'failed'">
      <h4>Payment Failed / Pending</h4>
      <pre>{{ result }}</pre>
      <button @click="reset">Try Again</button>
    </div>

    <hr />
    <h4>Or Pay Order Directly From Pot</h4>
    <label
      >Order Total: <input v-model.number="orderAmount" type="number"
    /></label>
    <button @click="payFromPot">Pay From Pot Balance</button>
    <pre>{{ orderResult }}</pre>
  </div>
</template>

<script>
export default {
  name: "PaymentComponent",
  props: {
    cardId: { type: Number, default: 1 },
    cartTotal: { type: Number, default: 0 },
  },
  emits: ["paid", "failed"],
  data() {
    return {
      API: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
      balance: 0,
      step: "form",
      loading: false,
      error: "",
      authUrl: "",
      reference: "",
      result: "",
      orderAmount: 0,
      orderResult: "",
      form: {
        member_name: "Nosipho Makeleni",
        email: "nosipho@gmail.com",
        amount: 500,
        method: "EFT",
        card_id: this.cardId,
      },
    };
  },
  mounted() {
    this.form.card_id = this.cardId;
    this.orderAmount = this.cartTotal || 1200;
    this.fetchBalance();
  },
  watch: {
    cardId(newVal) {
      this.form.card_id = newVal;
      this.fetchBalance();
    },
    cartTotal(newVal) {
      this.orderAmount = newVal;
    },
  },
  methods: {
    async fetchBalance() {
      try {
        const res = await fetch(`${this.API}/payments/balance/${this.cardId}`);
        const data = await res.json();
        this.balance = data.available_amount || 0;
      } catch (e) {
        this.error = e.message;
      }
    },
    async contribute() {
      this.loading = true;
      this.error = "";
      try {
        if (!this.form.member_name || !this.form.amount)
          throw new Error("Name and amount required");
        const res = await fetch(`${this.API}/payments/contribute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form),
        });
        const data = await res.json();
        this.result = JSON.stringify(data, null, 2);

        if (data.authorization_url) {
          // REAL Paystack mode
          this.authUrl = data.authorization_url;
          this.reference = data.reference;
          this.step = "paystack";
        } else if (
          data.payment_status === "Paid" ||
          data.status === "Paid" ||
          data.credited
        ) {
          // Simulated success
          this.step = "success";
          await this.fetchBalance();
          this.$emit("paid", data);
        } else if (data.payment_status === "Pending") {
          this.step = "failed";
          this.result = "Pending - EFT clearance 2-3 days\n" + this.result;
        } else {
          this.step = "failed";
        }
      } catch (e) {
        this.error = e.message;
        this.result = e.message;
      }
      this.loading = false;
    },
    async verify() {
      try {
        const res = await fetch(
          `${this.API}/payments/verify/${this.reference}`,
        );
        const data = await res.json();
        this.result = JSON.stringify(data, null, 2);
        if (data.success) {
          this.step = "success";
          await this.fetchBalance();
          this.$emit("paid", data);
        } else {
          this.step = "failed";
          this.$emit("failed", data);
        }
      } catch (e) {
        this.result = e.message;
      }
    },
    async payFromPot() {
      try {
        const res = await fetch(`${this.API}/payments/orders/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: this.cardId,
            total_amount: this.orderAmount,
            order_id: null,
          }),
        });
        const data = await res.json();
        this.orderResult = JSON.stringify(data, null, 2);
        if (data.success) await this.fetchBalance();
      } catch (e) {
        this.orderResult = e.message;
      }
    },
    reset() {
      this.step = "form";
      this.result = "";
      this.authUrl = "";
      this.reference = "";
    },
  },
};
</script>
