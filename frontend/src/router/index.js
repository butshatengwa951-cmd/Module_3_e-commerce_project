import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/pay" },
    { path: "/pay", component: () => import("../views/PayView.vue") },
    { path: "/delivery", component: () => import("../views/DeliveryView.vue") },
    { path: "/delivery/:id", component: () => import("../views/DeliveryView.vue") },
    {
      path: "/member/profile",
      component: () => import("../views/ProfileView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true;
  const auth = useAuthStore();
  auth.syncFromStorage();
  if (!auth.isLoggedIn || !auth.token) return "/pay";
  return true;
});

export default router;
