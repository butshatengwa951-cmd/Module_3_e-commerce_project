import { defineStore } from "pinia";
import api from "../services/api.js";
const KEYS = ["sw_user", "user", "stockwell_user", "currentUser", "auth_user"];
function readUser() {
  for (const k of KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      const u = p.user || p;
      if (u && (u.email || u.full_name || u.user_id))
        return { user: u, key: k, raw: p };
    } catch {}
  }
  return null;
}
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token:
      localStorage.getItem("sw_token") || localStorage.getItem("token") || null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.user,
    email: (s) => s.user?.email || "guest@stockwell.global",
    fullName: (s) => s.user?.full_name || s.user?.name || "",
    userId: (s) => s.user?.user_id || s.user?.id || null,
  },
  actions: {
    syncFromStorage() {
      const f = readUser();
      if (f) {
        this.user = f.user;
        const t = f.raw.token || localStorage.getItem("sw_token");
        if (t) this.token = t;
      }
    },
    async login(email, password) {
      const { data } = await api.post("/auth/login", { email, password });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem("sw_token", data.token);
      localStorage.setItem("sw_user", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    },
    logout() {
      this.user = null;
      this.token = null;
      for (const k of [...KEYS, "sw_token", "token"])
        localStorage.removeItem(k);
    },
  },
});
