import { createRouter, createWebHistory } from 'vue-router';
import CartView from '../views/CartView.vue';
import CatalogueView from '../views/CatalogueView.vue';
import DeliveryView from '../views/DeliveryView.vue';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import OrderHistoryView from '../views/OrderHistoryView.vue';
import PaymentView from '../views/PaymentView.vue';
import SignUpView from '../views/SignUpView.vue';

const routes = [
  {
    path: '/cart',
    name: 'Cart',
    component: CartView
  },
  {
    path: '/catalogue',
    name: 'Catalogue',
    component: CatalogueView
  },
  {
    path: '/delivery',
    name: 'Delivery',
    component: DeliveryView
  },
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/order-history',
    name: 'OrderHistory',
    component: OrderHistoryView
  },
  {
    path: '/payment',
    name: 'Payment',
    component: PaymentView
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: SignUpView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;