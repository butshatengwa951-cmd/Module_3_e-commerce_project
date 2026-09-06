import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4040",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getStokvels = async () => {
  const response = await api.get("/api/stokvels");
  return response.data;
};

export const signup = async (userData) => {
  const response = await api.post("/api/auth/signup", userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await api.post("/api/auth/login", userData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post(
    "/api/auth/forgot-password",
    { email }
  );

  return response.data;
};

export const resetPassword = async (resetData) => {
  const response = await api.post(
    "/api/auth/reset-password",
    resetData
  );

  return response.data;
};

export const verifyResetToken = async (token) => {
  const response = await api.get(
    "/api/auth/verify-reset-token",
    {
      params: { token },
    }
  );

  return response.data;
};

export default api;
