import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { attachOrderHistoryNavigation } from "./services/orderHistoryNavigation.js";

import "./assets/styles/theme.css";
import "./assets/styles/consistency.css";
import "./assets/styles/catalogue-overrides.css";
import "./assets/styles/light-mode-contrast.css";
import "./assets/styles/mobile-responsive.css";

attachOrderHistoryNavigation();

createApp(App)
  .use(router)
  .mount("#app");
