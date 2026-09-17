import { createRouter, createWebHistory } from "vue-router";
import AuthSelector from "../components/AuthSelector.vue";
import HomeView from "../views/HomeView.vue";
import CatalogueView from "../views/CatalogueView.vue";
import CartView from "../views/CartView.vue";
import PaymentView from "../views/PaymentView.vue";
import ProfileView from "../views/ProfileViewFixed.vue";
import MemberAddressesView from "../views/MemberAddressesView.vue";
import MemberDashboard from "../views/MemberDashboard.vue";
import StokvelProposalsView from "../views/StokvelProposalsView.vue";
import OrderHistoryView from "../views/OrderHistoryView.vue";
import OrderTrackingView from "../views/OrderTrackingView.vue";
import AdminProfileView from "../views/AdminProfileView.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import AdminSuggestionsView from "../views/AdminSuggestionsView.vue";
import AdminManagementView from "../views/AdminManagementView.vue";
import SuggestionsView from "../views/SuggestionsView.vue";
import Login from "../views/Login.vue";
import Signup from "../views/Signup.vue";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";

const routes=[
  {path:"/",name:"Home",component:HomeView},
  {path:"/catalogue",name:"Catalogue",component:CatalogueView},
  {path:"/cart",name:"Cart",component:CartView,meta:{requiresAuth:true}},
  {path:"/payment",name:"ContributionPayment",component:PaymentView,meta:{requiresAuth:true}},
  {path:"/proposals",name:"StokvelProposals",component:StokvelProposalsView,meta:{requiresAuth:true}},
  {path:"/member-dashboard",name:"GroupHub",component:MemberDashboard,meta:{requiresAuth:true}},
  {path:"/group-hub",redirect:"/member-dashboard"},
  {path:"/addresses",name:"MemberAddresses",component:MemberAddressesView,meta:{requiresAuth:true}},
  {path:"/order-history",name:"OrderHistory",component:OrderHistoryView,meta:{requiresAuth:true}},
  {path:"/order-history/:orderId",name:"OrderTracking",component:OrderTrackingView,meta:{requiresAuth:true}},
  {path:"/profile",name:"Profile",component:ProfileView,meta:{requiresAuth:true}},
  {path:"/admin/profile",name:"AdminProfile",component:AdminProfileView,meta:{requiresAuth:true,requiresAdmin:true}},
  {path:"/suggestions",name:"Suggestions",component:SuggestionsView,meta:{requiresAuth:true}},
  {path:"/admin",name:"AdminDashboard",component:AdminDashboard,meta:{requiresAuth:true,requiresAdmin:true}},
  {path:"/admin/suggestions",name:"AdminSuggestions",component:AdminSuggestionsView,meta:{requiresAuth:true,requiresAdmin:true}},
  {path:"/admin/management",name:"AdminManagement",component:AdminManagementView,meta:{requiresAuth:true,requiresAdmin:true}},
  {path:"/login-signup",name:"AuthSelector",component:AuthSelector},
  {path:"/login",name:"Login",component:Login},
  {path:"/signup",name:"Signup",component:Signup},
  {path:"/forgot-password",name:"ForgotPassword",component:ForgotPassword},
  {path:"/reset-password",name:"ResetPassword",component:ResetPassword}
];

const router=createRouter({history:createWebHistory(),routes});
function hasAuthToken(){return Boolean(localStorage.getItem("token")||localStorage.getItem("sw_token"))}
function isAdmin(){try{return JSON.parse(localStorage.getItem("user")||"null")?.role==="admin"}catch{return false}}
router.beforeEach((to)=>{
  const authenticated=hasAuthToken();

  if(to.path==="/" && authenticated){
    return isAdmin()?{path:"/admin"}:{path:"/member-dashboard"};
  }

  if(to.meta.requiresAuth&&!authenticated)return{path:"/login-signup",query:{redirect:to.fullPath}};
  if(to.meta.requiresAdmin&&!isAdmin())return{path:"/",query:{admin:"forbidden"}};
  return true;
});
export default router;
