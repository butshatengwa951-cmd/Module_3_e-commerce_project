import { createRouter, createWebHistory } from "vue-router";

import AuthSelector from "../components/AuthSelector.vue";
import HomeView from "../views/HomeView.vue";
import CatalogueView from "../views/CatalogueView.vue";
import CartView from "../views/CartView.vue";
import PaymentView from "../views/PaymentView.vue";
import ProfileView from "../views/ProfileView.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import Login from "../views/Login.vue";
import Signup from "../views/Signup.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";

const routes = [
  { path: "/", name: "Home", component: HomeView },
  { path: "/catalogue", name: "Catalogue", component: CatalogueView },
  { path: "/cart", name: "Cart", component: CartView, meta: { requiresAuth: true } },
  { path: "/payment", name: "Payment", component: PaymentView, meta: { requiresAuth: true } },
  { path: "/profile", name: "Profile", component: ProfileView, meta: { requiresAuth: true } },
  { path: "/admin", name: "AdminDashboard", component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: "/login-signup", name: "AuthSelector", component: AuthSelector },
  { path: "/login", name: "Login", component: Login },
  { path: "/signup", name: "Signup", component: Signup },
  { path: "/forgot-password", name: "ForgotPassword", component: ForgotPassword },
  { path: "/reset-password", name: "ResetPassword", component: ResetPassword },
];

const router = createRouter({ history: createWebHistory(), routes });

function hasAuthToken() {
  return Boolean(localStorage.getItem("token") || localStorage.getItem("sw_token"));
}

function isAdmin() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.role === "admin";
  } catch {
    return false;
  }
}

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !hasAuthToken()) {
    return { path: "/login-signup", query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAdmin && !isAdmin()) {
    return { path: "/", query: { admin: "forbidden" } };
  }

  return true;
});

export default router;
