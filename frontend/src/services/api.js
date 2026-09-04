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

export default api;
