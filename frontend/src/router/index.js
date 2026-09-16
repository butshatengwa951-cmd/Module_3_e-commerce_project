import { createRouter, createWebHistory } from "vue-router";

import AuthSelector from "../components/AuthSelector.vue";
import HomeView from "../views/HomeView.vue";
import CatalogueView from "../views/CatalogueView.vue";
import CartView from "../views/CartView.vue";
import PaymentView from "../views/PaymentView.vue";
import ProfileView from "../views/ProfileView.vue";
import Login from "../views/Login.vue";
import Signup from "../views/Signup.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";

const routes = [
  { path: "/", name: "Home", component: HomeView },
  { path: "/catalogue", name: "Catalogue", component: CatalogueView },
  { path: "/cart", name: "Cart", component: CartView },
  { path: "/payment", name: "Payment", component: PaymentView },
  { path: "/profile", name: "Profile", component: ProfileView },
  { path: "/login-signup", name: "AuthSelector", component: AuthSelector },
  { path: "/login", name: "Login", component: Login },
  { path: "/signup", name: "Signup", component: Signup },
  { path: "/forgot-password", name: "ForgotPassword", component: ForgotPassword },
  { path: "/reset-password", name: "ResetPassword", component: ResetPassword },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
