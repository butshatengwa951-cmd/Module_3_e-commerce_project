import { createRouter, createWebHistory } from "vue-router";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/pay" },
    { path: "/pay", component: () => import("../views/PayView.vue") },
    { path: "/delivery", component: () => import("../views/DeliveryView.vue") },
    { path: "/delivery/:id", component: () => import("../views/DeliveryView.vue") },
    { path: "/profile", component: () => import("../views/ProfileView.vue") },
    { path: "/member/profile", component: () => import("../views/ProfileView.vue") }
  ]
});
