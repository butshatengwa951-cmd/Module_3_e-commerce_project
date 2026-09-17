import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import "./assets/styles/theme.css";
import "./assets/styles/catalogue-overrides.css";
import "./assets/styles/light-mode-contrast.css";

createApp(App)
  .use(router)
  .mount("#app");