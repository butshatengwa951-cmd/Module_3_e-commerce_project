<template>
  <div>
    <h1>StockWell - IT WORKS!</h1>
    <p>API: {{ api }}</p>
    <PaymentView />
  </div>
</template>

<script>
import PaymentView from "./views/PaymentView.vue";

export default {
  components: { PaymentView },
  data() {
    return {
      api: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
    };
  },
};
</script>
