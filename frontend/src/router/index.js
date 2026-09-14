
import { createRouter, createWebHistory } from "vue-router";
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path:"/", name:"home", component:()=>import("../views/HomeView.vue") },
    { path:"/catalogue", name:"catalogue", component:()=>import("../views/CatalogueView.vue") },
    { path:"/member/:id", name:"MemberDashboard", component:()=>import("../views/MemberDashboard.vue") },
    { path:"/member", redirect:"/member/1" },
    { path:"/admin", name:"AdminDashboard", component:()=>import("../views/AdminDashboard.vue") },
    { path:"/admin-dashboard", redirect:"/admin" },
    { path:"/cart", redirect:"/catalogue" },
  ],
});
export default router;

