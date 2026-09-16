import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4040",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("sw_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getStokvels = async () => {
  const response = await api.get("/api/stokvels");
  return response.data;
};

export const getProducts = async () => {
  const response = await api.get("/api/products");
  return response.data;
};

export const getProduct = async (productId) => {
  const response = await api.get(`/api/products/${productId}`);
  return response.data;
};

export const getCart = async () => {
  const response = await api.get("/api/cart");
  return response.data;
};

export const addCartItem = async ({ product_id, supplier_price_id, quantity = 1 }) => {
  const response = await api.post("/api/cart/items", {
    product_id,
    supplier_price_id,
    quantity,
  });
  return response.data;
};

export const updateCartItem = async (itemId, quantity) => {
  const response = await api.patch(`/api/cart/items/${itemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/api/cart/items/${itemId}`);
  return response.data;
};

export const getCurrentOrder = async () => {
  const response = await api.get("/api/orders/current");
  return response.data;
};

export const confirmCurrentOrder = async () => {
  const response = await api.post("/api/orders/current/confirm");
  return response.data;
};

export const getPaymentOptions = async () => {
  const response = await api.get("/api/payment/current");
  return response.data;
};

export const payCurrentOrder = async ({ card_id, delivery_address }) => {
  const response = await api.post("/api/payment/current/pay", {
    card_id,
    delivery_address,
  });
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

    window.dispatchEvent(new Event("login-completed"));
  }

  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post(
    "/api/auth/forgot-password",
    { email },
  );
  return response.data;
};

export const resetPassword = async (resetData) => {
  const response = await api.post(
    "/api/auth/reset-password",
    resetData,
  );
  return response.data;
};

export const verifyResetToken = async (token) => {
  const response = await api.get(
    "/api/auth/verify-reset-token",
    { params: { token } },
  );
  return response.data;
};

export default api;
