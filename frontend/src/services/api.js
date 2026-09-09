import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4040/api",
});
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("sw_token") || localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export default api;
