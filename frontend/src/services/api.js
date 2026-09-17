import axios from "axios";
import { saveCartState } from "../composables/useCartState.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4040",
  headers: { "Content-Type": "application/json" },
});

const clearAuthStorage = () => {
  ["token", "sw_token", "refresh_token", "session_id", "user", "stokvel"].forEach((key) => localStorage.removeItem(key));
};

const saveAuthResponse = (data) => {
  localStorage.setItem("token", data.access_token || data.token);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem("session_id", data.session_id);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("stokvel", JSON.stringify(data.stokvel));
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("sw_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

// Access tokens are deliberately short-lived. A failed authenticated request gets
// one refresh attempt; the original request is retried only after the session rotates.
api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  const status = error.response?.status;
  const isGet = String(config?.method || "get").toLowerCase() === "get";
  const transient = !status || status === 408 || status === 429 || status >= 500;

  if (config && isGet && transient && !config.__swRetried) {
    config.__swRetried = true;
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    return api(config);
  }

  const canRefresh = status === 401 && !config?.__swRefreshAttempted;
  const refreshToken = localStorage.getItem("refresh_token");
  const sessionId = localStorage.getItem("session_id");
  const isAuthEndpoint = String(config?.url || "").includes("/api/auth/");

  if (canRefresh && refreshToken && sessionId && !isAuthEndpoint) {
    config.__swRefreshAttempted = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          { refresh_token: refreshToken, session_id: sessionId },
          { headers: { "Content-Type": "application/json" } }
        ).finally(() => { refreshPromise = null; });
      }
      const refreshed = await refreshPromise;
      saveAuthResponse(refreshed.data);
      window.dispatchEvent(new Event("auth-updated"));
      return api(config);
    } catch (refreshError) {
      clearAuthStorage();
      window.dispatchEvent(new Event("auth-updated"));
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
});

async function refreshCartStorage() {
  const response = await api.get("/api/cart");
  saveCartState({ items: response.data.items || [], order: response.data.order || null, stokvel: response.data.stokvel || null });
  return response.data;
}

export const getStokvels = async () => (await api.get("/api/stokvels")).data;
export const getProducts = async () => {
  const token = localStorage.getItem("token") || localStorage.getItem("sw_token");
  try { return (await api.get(token ? "/api/products/group" : "/api/products")).data; }
  catch (error) { if (token && [401,403,500].includes(error.response?.status)) return (await api.get("/api/products")).data; throw error; }
};
export const getProduct = async (id) => (await api.get(`/api/products/${id}`)).data;
export const getCart = async () => refreshCartStorage();
export const addCartItem = async (data) => { const r = await api.post("/api/cart/items", data); await refreshCartStorage(); return r.data; };
export const updateCartItem = async (id, quantity) => { const r = await api.patch(`/api/cart/items/${id}`, { quantity }); await refreshCartStorage(); return r.data; };
export const removeCartItem = async (id) => { const r = await api.delete(`/api/cart/items/${id}`); await refreshCartStorage(); return r.data; };

export const getCurrentOrder = async () => (await api.get("/api/orders/current")).data;
export const getOrderHistory = async () => (await api.get("/api/orders/history")).data;
export const getOrderDetails = async (id) => (await api.get(`/api/orders/history/${id}`)).data;
export const reorderOrder = async (id) => { const r = await api.post(`/api/reorder/${id}`); await refreshCartStorage(); return r.data; };

export const getMemberDashboard = async () => (await api.get("/api/users/member-dashboard")).data;
export const getStokvelFeatures = async () => (await api.get("/api/stokvel-features")).data;
export const saveStokvelGoal = async (data) => (await api.put("/api/stokvel-features/goal", data)).data;

export const getMemberAddresses = async () => (await api.get("/api/stokvel-addresses")).data;
export const createMemberAddress = async (data) => (await api.post("/api/stokvel-addresses", data)).data;
export const updateMemberAddress = async (id, data) => (await api.put(`/api/stokvel-addresses/${id}`, data)).data;
export const deleteMemberAddress = async (id) => (await api.delete(`/api/stokvel-addresses/${id}`)).data;
export const setDefaultMemberAddress = async (id) => (await api.post(`/api/stokvel-addresses/${id}/default`)).data;

export const getStokvelProposals = async () => (await api.get("/api/stokvel-proposals")).data;
export const createPurchaseProposal = async (data) => (await api.post("/api/stokvel-proposals", data)).data;
export const createProposalFromCart = async (data) => (await api.post("/api/stokvel-proposals/from-cart", data)).data;
export const voteOnProposal = async (id, vote) => (await api.post(`/api/stokvel-proposals/${id}/vote`, { vote })).data;
export const approvePurchaseProposal = async (id) => (await api.post(`/api/stokvel-proposals/${id}/approve`)).data;
export const authorisePurchaseProposal = async (id) => (await api.post(`/api/stokvel-proposals/${id}/authorise`)).data;

export const getPaymentOptions = async () => (await api.get("/api/payment/current")).data;
export const createPayfastCheckout = async (data) => (await api.post("/api/payment/payfast/checkout", data)).data;

export const signup = async (data) => (await api.post("/api/auth/signup", data)).data;
export const login = async (data) => {
  const r = await api.post("/api/auth/login", data);
  if (r.data?.success) {
    saveAuthResponse(r.data);
    window.dispatchEvent(new Event("login-completed"));
    window.dispatchEvent(new Event("auth-updated"));
  }
  return r.data;
};
export const refreshSession = async () => {
  const r = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
    refresh_token: localStorage.getItem("refresh_token"),
    session_id: localStorage.getItem("session_id"),
  });
  saveAuthResponse(r.data);
  window.dispatchEvent(new Event("auth-updated"));
  return r.data;
};
export const logout = async () => {
  const sessionId = localStorage.getItem("session_id");
  try {
    if (sessionId) await axios.post(`${api.defaults.baseURL}/api/auth/logout`, { session_id: sessionId });
  } finally {
    clearAuthStorage();
    window.dispatchEvent(new Event("auth-updated"));
  }
};
export const forgotPassword = async (email) => (await api.post("/api/auth/forgot-password", { email })).data;
export const resetPassword = async (data) => (await api.post("/api/auth/reset-password", data)).data;
export const verifyResetToken = async (token) => (await api.get("/api/auth/verify-reset-token", { params: { token } })).data;

export const getAdminDashboard = async () => (await api.get("/api/admin/dashboard")).data;
export const getAdminUsers = async () => (await api.get("/api/admin/users")).data;
export const getAdminStokvels = async () => (await api.get("/api/admin/stokvels")).data;
export const getAdminProducts = async () => (await api.get("/api/admin/products")).data;
export const createAdminProduct = async (data) => (await api.post("/api/admin/products", data)).data;
export const updateAdminProduct = async (id, data) => (await api.put(`/api/admin/products/${id}`, data)).data;
export const deleteAdminProduct = async (id) => (await api.delete(`/api/admin/products/${id}`)).data;
export const getAdminSupplierPrices = async () => (await api.get("/api/admin/supplier-prices")).data;
export const createAdminSupplierPrice = async (data) => (await api.post("/api/admin/supplier-prices", data)).data;
export const updateAdminSupplierPrice = async (id, data) => (await api.put(`/api/admin/supplier-prices/${id}`, data)).data;
export const deleteAdminSupplierPrice = async (id) => (await api.delete(`/api/admin/supplier-prices/${id}`)).data;
export const getAdminOrders = async () => (await api.get("/api/admin/orders")).data;
export const updateAdminOrderStatus = async (id, status) => (await api.patch(`/api/admin/orders/${id}/status`, { status })).data;
export const getAdminDeliveries = async () => (await api.get("/api/admin/deliveries")).data;
export const updateAdminDelivery = async (id, data) => (await api.patch(`/api/admin/deliveries/${id}`, data)).data;
export const getAdminManagedUsers = async () => (await api.get("/api/admin/management/users")).data;
export const updateAdminUserRole = async (id, role) => (await api.patch(`/api/admin/management/users/${id}/role`, { role })).data;
export const getAdminStokvelMembers = async (id) => (await api.get(`/api/admin/management/stokvels/${id}/members`)).data;
export const setAdminStokvelMemberRole = async (stokvelId, userId, role) => (await api.patch(`/api/admin/management/stokvels/${stokvelId}/members/${userId}/role`, { role })).data;
export const addAdminStokvelMember = async (id, user_id) => (await api.post(`/api/admin/management/stokvels/${id}/members`, { user_id })).data;
export const removeAdminStokvelMember = async (stokvelId, userId) => (await api.delete(`/api/admin/management/stokvels/${stokvelId}/members/${userId}`)).data;
export const getAdminAnalytics = async () => (await api.get("/api/admin/analytics")).data;
export const getAdminAuditLog = async () => (await api.get("/api/admin/audit-log")).data;
export const createSuggestion = async (data) => (await api.post("/api/suggestions", data)).data;
export const getMySuggestions = async () => (await api.get("/api/suggestions/mine")).data;
export const getAllSuggestions = async () => (await api.get("/api/suggestions/admin")).data;
export const updateSuggestion = async (id, status, admin_response) => (await api.patch(`/api/suggestions/admin/${id}`, { status, admin_response })).data;

export default api;
