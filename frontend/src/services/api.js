import axios from "axios";
import {
  saveCartState,
  saveCheckoutState,
  clearCartState,
  clearCheckoutState,
} from "../composables/useCartState.js";

const api = axios.create({
  baseURL: "http://localhost:4040",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("sw_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function refreshCartStorage({ preserveSavedCart = false } = {}) {
  try {
    const response = await api.get("/api/cart");
    const backendItems = response.data.items || [];

    // When navigating from Cart back to Catalogue, keep the last valid cart
    // snapshot if the backend temporarily returns an empty pending cart.
    // Explicit remove operations clear that snapshot first, so real removals
    // are still respected.
    if (preserveSavedCart && !backendItems.length) {
      try {
        const saved = JSON.parse(localStorage.getItem("stockwellCartState") || "null");
        if (Array.isArray(saved?.items) && saved.items.length) {
          return {
            ...response.data,
            items: saved.items,
            order: saved.order || response.data.order || null,
            stokvel: saved.stokvel || response.data.stokvel || null,
          };
        }
      } catch {
        // Fall through to the backend response if saved cart data is invalid.
      }
    }

    saveCartState({
      items: backendItems,
      order: response.data.order || null,
      stokvel: response.data.stokvel || null,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status !== 403 && error.response?.status !== 401) {
      console.error("Cart storage sync failed:", error);
    }
    throw error;
  }
}

export const getStokvels = async () => (await api.get("/api/stokvels")).data;
export const getProducts = async () => (await api.get("/api/products")).data;
export const getProduct = async (productId) => (await api.get(`/api/products/${productId}`)).data;

// Navigation reads can safely preserve the current cart snapshot so the
// Catalogue does not briefly show an empty basket after returning from Cart.
export const getCart = async () => refreshCartStorage({ preserveSavedCart: true });

export const addCartItem = async ({ product_id, supplier_price_id, quantity = 1 }) => {
  const response = await api.post("/api/cart/items", {
    product_id,
    supplier_price_id,
    quantity,
  });
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

  // Remove the deleted row from the shared snapshot before syncing so
  // getCart() cannot resurrect an item that the user intentionally removed.
  try {
    const saved = JSON.parse(localStorage.getItem("stockwellCartState") || "null");
    const remainingItems = Array.isArray(saved?.items)
      ? saved.items.filter((item) => Number(item.order_item_id) !== Number(itemId))
      : [];

    if (remainingItems.length) {
      saveCartState({
        items: remainingItems,
        order: saved.order || null,
        stokvel: saved.stokvel || null,
      });
    } else {
      clearCartState();
    }
  } catch {
    clearCartState();
  }

  await refreshCartStorage();
  return response.data;
};

export const getCurrentOrder = async () => {
  const response = await api.get("/api/orders/current");
  if (response.data?.order) {
    saveCheckoutState({ order: response.data.order, items: response.data.items || [] });
  }
  return response.data;
};

export const confirmCurrentOrder = async () => {
  const response = await api.post("/api/orders/current/confirm");
  if (response.data?.order) {
    const current = JSON.parse(localStorage.getItem("stockwellCartState") || "null");
    const items = Array.isArray(current?.items) ? current.items : [];
    const stokvel = current?.stokvel || null;

    // Keep the cart snapshot intact while the order is in the Payment stage.
    // It is cleared only after payment succeeds.
    saveCheckoutState({ order: response.data.order, items, stokvel });
    saveCartState({ items, order: response.data.order, stokvel });
  }
  return response.data;
};

export const getPaymentOptions = async () => {
  const response = await api.get("/api/payment/current");
  if (response.data?.order) {
    const checkout = JSON.parse(localStorage.getItem("stockwellCheckoutState") || "null");
    saveCheckoutState({
      order: response.data.order,
      items: checkout?.items || [],
      stokvel: checkout?.stokvel || null,
    });
    if (checkout?.items?.length) {
      saveCartState({
        items: checkout.items,
        order: response.data.order,
        stokvel: checkout.stokvel || null,
      });
    }
  }
  return response.data;
};

export const payCurrentOrder = async ({ card_id, delivery_address }) => {
  const response = await api.post("/api/payment/current/pay", {
    card_id,
    delivery_address,
  });
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

export const forgotPassword = async (email) =>
  (await api.post("/api/auth/forgot-password", { email })).data;
export const resetPassword = async (resetData) =>
  (await api.post("/api/auth/reset-password", resetData)).data;
export const verifyResetToken = async (token) =>
  (await api.get("/api/auth/verify-reset-token", { params: { token } })).data;

export default api;
