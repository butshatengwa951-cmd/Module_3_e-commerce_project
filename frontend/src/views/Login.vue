<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api.js";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const auth = useAuthStore();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  error.value = "";
  if (!email.value || !password.value) {
    error.value = "Email and password are required.";
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.post("/auth/login", { email: email.value, password: password.value });
    auth.token = data.token;
    auth.user = data.user;
    localStorage.setItem("sw_token", data.token);
    localStorage.setItem("token", data.token);
    localStorage.setItem("sw_user", JSON.stringify(data.user));
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/pay");
  } catch (err) {
    error.value = err.response?.data?.message || err.response?.data?.error || "Unable to log in. Check your details.";
  } finally { loading.value = false; }
}
</script>

<template>
  <main class="auth-form-page">
    <form class="auth-card" @submit.prevent="handleLogin">
      <button type="button" class="back" @click="router.push('/')">← Back</button>
      <p class="eyebrow">WELCOME BACK</p>
      <h1>Login</h1>
      <p class="sub">Sign in to your StockWell account.</p>
      <label>Email<input v-model.trim="email" type="email" autocomplete="email" /></label>
      <label>Password<input v-model="password" type="password" autocomplete="current-password" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="submit" :disabled="loading">{{ loading ? "Signing in..." : "Login" }}</button>
      <p class="switch">New to StockWell? <button type="button" @click="router.push('/signup')">Create an account</button></p>
    </form>
  </main>
</template>

<style scoped>
.auth-form-page{min-height:100vh;display:grid;place-items:center;padding:30px;background:radial-gradient(circle at 15% 15%,rgba(216,180,106,.2),transparent 30%),#130e23;color:#fff;font-family:"Space Grotesk",sans-serif}.auth-card{width:min(460px,100%);padding:38px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:rgba(255,255,255,.06);backdrop-filter:blur(18px);box-shadow:0 25px 70px rgba(0,0,0,.3)}.back{border:0;background:transparent;color:rgba(255,255,255,.65);cursor:pointer;padding:0}.eyebrow{margin:35px 0 8px;color:#d8b46a;font:11px "DM Mono",monospace;letter-spacing:.15em}.auth-card h1{font-size:46px;margin:0}.sub{color:rgba(255,255,255,.6);margin-bottom:30px}.auth-card label{display:grid;gap:8px;margin:16px 0;font-size:13px;color:rgba(255,255,255,.7)}input{width:100%;padding:13px 14px;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:rgba(0,0,0,.18);color:#fff;outline:none}input:focus{border-color:#d8b46a}.submit{width:100%;margin-top:10px;padding:14px;border:0;border-radius:12px;background:#d8b46a;color:#130e23;font-weight:700;cursor:pointer}.submit:disabled{opacity:.6}.error{color:#ffabab;font-size:13px}.switch{text-align:center;color:rgba(255,255,255,.55);font-size:13px}.switch button{border:0;background:none;color:#d8b46a;cursor:pointer}
</style>
