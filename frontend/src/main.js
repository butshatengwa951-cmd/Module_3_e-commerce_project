import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "./assets/main.css";

createApp(App).use(router).mount("#app");