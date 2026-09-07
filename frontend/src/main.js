import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import PaymentView from "./views/PaymentView.vue";

// Simple Home view inline
const HomeView = {
  template: `
    <div>
      <h2>Welcome to StockWell</h2>
      <p>Khayelitsha | Delft | Cape Town Stokvels</p>
      <p>Go to <router-link to="/payments">Payments Test</router-link> to test your payment system.</p>
      <h3>Quick Backend Check</h3>
      <button @click="testBackend">Test Backend Connection</button>
      <pre>{{ result }}</pre>
    </div>
  `,
  data() {
    return { result: "" };
  },
  methods: {
    async testBackend() {
      try {
        const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
        const res = await fetch(`${API}/payments/balance/1`);
        this.result = JSON.stringify(await res.json(), null, 2);
      } catch (e) {
        this.result =
          "Backend not running or wrong VITE_API_URL - " + e.message;
      }
    },
  },
};

const routes = [
  { path: "/", component: HomeView },
  { path: "/payments", component: PaymentView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount("#app");
