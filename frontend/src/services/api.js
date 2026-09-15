import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:10000/api",
});

export const cartApi = {
  getCart: (stokvelId) => api.get(`/stokvels/${stokvelId}/cart`),
  updateQty: (orderItemId, quantity) =>
    api.put(`/order-items/${orderItemId}`, { quantity }),
  removeItem: (orderItemId) => api.delete(`/order-items/${orderItemId}`),
};

export const cartStep = 5;

export const productApi = {
  getProducts: () => api.get("/products"),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (payload) => api.post("/products", payload),
  updateProduct: (id, payload) => api.put(`/products/${id}`, payload),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  signup: (payload) => api.post("/auth/signup", payload),
  me: () => api.get("/auth/me"),
};

export const orderApi = {
  getOrders: (stokvelId) =>
    api.get(`/order_details${stokvelId ? `?stokvel_id=${stokvelId}` : ""}`),
  getOrder: (orderId) => api.get(`/order_details/${orderId}`),
  confirmOrder: (orderId) => api.put(`/orders/${orderId}/confirm`),
  createOrder: (payload) => api.post("/orders", payload),
};

export const paymentApi = {
  getPayments: (stokvelId) => api.get(`/payments?stokvel_id=${stokvelId}`),
  createPayment: (payload) => api.post("/payments", payload),
};

export const deliveryApi = {
  getDelivery: (stokvelId) => api.get(`/delivery?stokvel_id=${stokvelId}`),
  updateDelivery: (deliveryId, payload) =>
    api.put(`/delivery/${deliveryId}`, payload),
};

export default api;
