import {createRouter,createWebHistory} from "vue-router";
const routes=[
 {path:"/",redirect:"/pay"},
 {path:"/pay",component:()=>import("../views/PayView.vue")},
 {path:"/delivery",component:()=>import("../views/DeliveryView.vue")},
 {path:"/delivery/:id",component:()=>import("../views/DeliveryView.vue")},
 {path:"/profile",component:()=>import("../views/ProfileView.vue")},
 {path:"/member/profile",component:()=>import("../views/ProfileView.vue")},
 {path:"/admin",component:()=>import("../views/AdminDashboard.vue"),meta:{requiresAdmin:true}},
 {path:"/admin/management",component:()=>import("../views/AdminManagementView.vue"),meta:{requiresAdmin:true}},
 {path:"/admin/profile",component:()=>import("../views/AdminProfileView.vue"),meta:{requiresAdmin:true}},
 {path:"/admin/suggestions",component:()=>import("../views/AdminSuggestionsView.vue"),meta:{requiresAdmin:true}}
];
const router=createRouter({history:createWebHistory(),routes});
function isAdmin(){try{return JSON.parse(localStorage.getItem("user")||"null")?.role==="admin"}catch{return false}}
router.beforeEach(to=>to.meta.requiresAdmin&&!isAdmin()?{path:"/pay"}:true);
export default router;
