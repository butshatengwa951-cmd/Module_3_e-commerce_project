<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api.js";

const router = useRouter();
const full_name = ref("");
const email = ref("");
const phone_number = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleSignup() {
  error.value = "";
  if (!full_name.value || !email.value || !password.value) {
    error.value = "Name, email and password are required.";
    return;
  }
  loading.value = true;
  try {
    await api.post("/auth/register", { full_name: full_name.value, email: email.value, phone_number: phone_number.value, password: password.value });
    router.push("/login");
  } catch (err) {
    error.value = err.response?.data?.message || err.response?.data?.error || "Unable to create your account.";
  } finally { loading.value = false; }
}
</script>

<template>
  <main class="auth-form-page">
    <form class="auth-card" @submit.prevent="handleSignup">
      <button type="button" class="back" @click="router.push('/')">← Back</button>
      <p class="eyebrow">START TODAY</p>
      <h1>Sign up</h1>
      <p class="sub">Create your StockWell member account.</p>
      <label>Full name<input v-model.trim="full_name" type="text" autocomplete="name" /></label>
      <label>Email<input v-model.trim="email" type="email" autocomplete="email" /></label>
      <label>Phone number<input v-model.trim="phone_number" type="tel" autocomplete="tel" /></label>
      <label>Password<input v-model="password" type="password" autocomplete="new-password" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="submit" :disabled="loading">{{ loading ? "Creating account..." : "Create account" }}</button>
      <p class="switch">Already a member? <button type="button" @click="router.push('/login')">Login</button></p>
    </form>
  </main>
</template>

<style scoped>
.auth-form-page{min-height:100vh;display:grid;place-items:center;padding:30px;background:radial-gradient(circle at 85% 15%,rgba(216,180,106,.2),transparent 30%),#130e23;color:#fff;font-family:"Space Grotesk",sans-serif}.auth-card{width:min(460px,100%);padding:38px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:rgba(255,255,255,.06);backdrop-filter:blur(18px);box-shadow:0 25px 70px rgba(0,0,0,.3)}.back{border:0;background:transparent;color:rgba(255,255,255,.65);cursor:pointer;padding:0}.eyebrow{margin:35px 0 8px;color:#d8b46a;font:11px "DM Mono",monospace;letter-spacing:.15em}.auth-card h1{font-size:46px;margin:0}.sub{color:rgba(255,255,255,.6);margin-bottom:26px}.auth-card label{display:grid;gap:8px;margin:13px 0;font-size:13px;color:rgba(255,255,255,.7)}input{width:100%;padding:12px 14px;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:rgba(0,0,0,.18);color:#fff;outline:none}input:focus{border-color:#d8b46a}.submit{width:100%;margin-top:8px;padding:14px;border:0;border-radius:12px;background:#d8b46a;color:#130e23;font-weight:700;cursor:pointer}.submit:disabled{opacity:.6}.error{color:#ffabab;font-size:13px}.switch{text-align:center;color:rgba(255,255,255,.55);font-size:13px}.switch button{border:0;background:none;color:#d8b46a;cursor:pointer}
</style>
