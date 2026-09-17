import axios from "axios";
import { saveCartState, saveCheckoutState, clearCartState, clearCheckoutState } from "../composables/useCartState.js";

const api = axios.create({ baseURL: "http://localhost:4040", headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("sw_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function refreshCartStorage() {
  try {
    const response = await api.get("/api/cart");
    saveCartState({ items: response.data.items || [], order: response.data.order || null, stokvel: response.data.stokvel || null });
    return response.data;
  } catch (error) {
    if (error.response?.status !== 403 && error.response?.status !== 401) console.error("Cart storage sync failed:", error);
    throw error;
  }
}

export const getStokvels = async () => (await api.get("/api/stokvels")).data;
export const getProducts = async () => (await api.get("/api/products")).data;
export const getProduct = async (productId) => (await api.get(`/api/products/${productId}`)).data;

export const getCart = async () => refreshCartStorage();

export const addCartItem = async ({ product_id, supplier_price_id, quantity = 1 }) => {
  const response = await api.post("/api/cart/items", { product_id, supplier_price_id, quantity });
  await refreshCartStorage();
  return response.data;
};

export const updateCartItem = async (itemId, quantity) => {
  const response = await api.patch(`/api/cart/items/${itemId}`, { quantity });
  await refreshCartStorage();
  return response.data;
};

export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/api/cart/items/${itemId}`);
  await refreshCartStorage();
  return response.data;
};

export const getCurrentOrder = async () => {
  const response = await api.get("/api/orders/current");
  if (response.data?.order) saveCheckoutState({ order: response.data.order, items: response.data.items || [] });
  return response.data;
};

export const confirmCurrentOrder = async () => {
  const response = await api.post("/api/orders/current/confirm");
  if (response.data?.order) {
    const current = JSON.parse(localStorage.getItem("stockwellCartState") || "null");
    saveCheckoutState({ order: response.data.order, items: current?.items || [], stokvel: current?.stokvel || null });
    saveCartState({ items: [], order: response.data.order, stokvel: current?.stokvel || null });
  }
  return response.data;
};

export const getPaymentOptions = async () => {
  const response = await api.get("/api/payment/current");
  if (response.data?.order) {
    const checkout = JSON.parse(localStorage.getItem("stockwellCheckoutState") || "null");
    saveCheckoutState({ order: response.data.order, items: checkout?.items || [], stokvel: checkout?.stokvel || null });
  }
  return response.data;
};

export const payCurrentOrder = async ({ card_id, delivery_address }) => {
  const response = await api.post("/api/payment/current/pay", { card_id, delivery_address });
  clearCartState();
  clearCheckoutState();
  return response.data;
};

export const signup = async (userData) => {
  const response = await api.post("/api/auth/signup", userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await api.post("/api/auth/login", userData);
  if (response.data?.success) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    localStorage.setItem("stokvel", JSON.stringify(response.data.stokvel));
    saveCartState();
    window.dispatchEvent(new Event("login-completed"));
    window.dispatchEvent(new Event("auth-updated"));
  }
  return response.data;
};

export const forgotPassword = async (email) => (await api.post("/api/auth/forgot-password", { email })).data;
export const resetPassword = async (resetData) => (await api.post("/api/auth/reset-password", resetData)).data;
export const verifyResetToken = async (token) => (await api.get("/api/auth/verify-reset-token", { params: { token } })).data;

export default api;
