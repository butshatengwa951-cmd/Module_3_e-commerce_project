<script setup>
import { onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";

import GlassCard from "../components/GlassCard.vue";
import PageBackground from "../components/PageBackground.vue";

import { login } from "../services/api.js";
import { useTheme } from "../composables/useTheme.js";

const router = useRouter();
const { isDark } = useTheme();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const leaving = ref(false);
const notification = ref({ visible: false, type: "", title: "", message: "" });
let notificationTimer = null;

const showNotification = (type, title, message) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { visible: true, type, title, message };
  notificationTimer = setTimeout(closeNotification, 4500);
};

const closeNotification = () => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
  notification.value.visible = false;
};

const handleLogin = async () => {
  closeNotification();
  if (!email.value || !password.value) {
    showNotification("error", "Login unsuccessful", "Email and password are required.");
    return;
  }
  loading.value = true;
  try {
    const response = await login({ email: email.value, password: password.value });
    if (response.success) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("stokvel", JSON.stringify(response.stokvel));
      window.dispatchEvent(new Event("auth-updated"));
      window.dispatchEvent(new Event("login-completed"));
      console.log("Logged in user:", response.user);
      console.log("User Stokvel:", response.stokvel);
      showNotification("success", "Login successful", response.message || "Welcome back to StockWell.");
      setTimeout(() => {
        router.push(response.user?.role === "admin" ? "/admin" : "/");
      }, 450);
    } else {
      showNotification("error", "Login unsuccessful", response.message || "Unable to log you in.");
    }
  } catch (err) {
    console.error("Login error:", err);
    if (err.response?.data?.message) {
      showNotification("error", "Login unsuccessful", err.response.data.message);
    } else {
      showNotification("error", "Connection error", "Unable to connect to the server.");
    }
  } finally {
    loading.value = false;
  }
};

const goBackToAuth = () => {
  if (leaving.value) return;
  leaving.value = true;
  setTimeout(() => router.push("/"), 450);
};

onBeforeUnmount(() => {
  if (notificationTimer) clearTimeout(notificationTimer);
});
</script>

<template>
  <main class="login-page" :class="{ 'is-leaving': leaving }">
    <PageBackground />
    <Transition name="notification">
      <div v-if="notification.visible" class="notification" :class="[`notification-${notification.type}`, { 'notification-dark': isDark }]" role="alert" aria-live="polite">
        <div class="notification-icon">
          <svg v-if="notification.type === 'success'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M7.5 12.5l3 3 6-6" /></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" /></svg>
        </div>
        <div class="notification-content"><strong>{{ notification.title }}</strong><span>{{ notification.message }}</span></div>
        <button type="button" class="notification-close" aria-label="Close notification" title="Close notification" @click="closeNotification">×</button>
      </div>
    </Transition>
    <button type="button" class="back-auth-button" :disabled="leaving" aria-label="Back to authentication selection" @click="goBackToAuth"><span class="back-arrow" aria-hidden="true"> ← </span><span> Back to Select </span></button>
    <header class="page-brand"><div class="brand-mark"><span class="brand-handshake" aria-hidden="true"> 🤝 </span></div><span> LOGIN to StockWell </span></header>
    <GlassCard :variant="isDark ? 'dark' : 'light'"><div class="login-content"><span class="eyebrow"> Welcome back </span><h1>Login</h1><p class="intro">Continue your StockWell journey.</p><form @submit.prevent="handleLogin"><div class="field"><label for="email"> Email </label><input id="email" v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required /></div><div class="field"><label for="password"> Password </label><div class="password-input-wrapper"><input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" required /><button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" :title="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword"><svg v-if="!showPassword" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12C4.5 8 8 6 12 6C16 6 19.5 8 22 12C19.5 16 16 18 12 18C8 18 4.5 16 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg><svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 6.2C11.05 6.07 11.52 6 12 6C16 6 19.5 8 22 12C21.25 13.2 20.35 14.25 19.25 15.15" /><path d="M6.1 6.1C3.7 7.6 2.5 9.7 2 12C4.5 16 8 18 12 18C13.65 18 15.2 17.6 16.6 17" /><path d="M9.9 9.9C8.75 11.05 8.75 12.95 9.9 14.1C11.05 15.25 12.95 15.25 14.1 14.1" /></svg></button></div></div><div class="forgot"><router-link to="/forgot-password">Forgot your password?</router-link></div><button type="submit" :disabled="loading" class="login-submit"><span v-if="!loading"> Login </span><span v-else> Logging in... </span></button></form><div class="bottom-link"><span> Don't have an account? </span><router-link to="/signup"> Sign up </router-link></div></div></GlassCard>
    <footer>Save · Grow · Together</footer>
  </main>
</template>

<style scoped>
.login-page{position:relative;min-height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:var(--sw-space-14) var(--sw-space-7);background:var(--sw-page-gradient);color:var(--sw-page-text);font-family:var(--sw-font-body);box-sizing:border-box;transition:background var(--sw-transition-slow),color var(--sw-transition-slow),opacity 450ms ease,transform 450ms cubic-bezier(.22,1,.36,1),filter 450ms ease}.login-page.is-leaving{opacity:0;transform:translateY(24px) scale(.98);filter:blur(8px);pointer-events:none}.login-page :deep(.page-gradient){opacity:.9;filter:saturate(1.3) brightness(1.08);animation-duration:18s}.login-page :deep(.background-orb){opacity:.52;filter:blur(68px) saturate(1.2);animation-duration:14s;animation-timing-function:ease-in-out}.login-page :deep(.orb-gold),.login-page :deep(.orb-orange),.login-page :deep(.orb-purple),.login-page :deep(.orb-lavender){transform:scale(.9)}@keyframes loginOrbGold{0%,100%{transform:translate(0,0) scale(.9)}50%{transform:translate(72px,48px) scale(1.06)}}@keyframes loginOrbOrange{0%,100%{transform:translate(0,0) scale(.9)}50%{transform:translate(-72px,64px) scale(1.04)}}@keyframes loginOrbPurple{0%,100%{transform:translate(0,0) scale(.92)}50%{transform:translate(44px,-56px) scale(1.02)}}@keyframes loginOrbLavender{0%,100%{transform:translate(0,0) scale(.9)}50%{transform:translate(-40px,-48px) scale(1.02)}}.login-page :deep(.orb-gold){animation-name:loginOrbGold}.login-page :deep(.orb-orange){animation-name:loginOrbOrange}.login-page :deep(.orb-purple){animation-name:loginOrbPurple}.login-page :deep(.orb-lavender){animation-name:loginOrbLavender}.notification{position:fixed;top:82px;left:32px;z-index:100;width:min(360px,calc(100vw - 64px));display:flex;align-items:flex-start;gap:14px;padding:16px 18px;border:1px solid rgba(255,255,255,.35);border-radius:20px;background:rgba(255,255,255,.14);box-shadow:0 18px 55px rgba(49,43,80,.24),inset 0 1px 1px rgba(255,255,255,.35);backdrop-filter:blur(24px) saturate(145%);-webkit-backdrop-filter:blur(24px) saturate(145%);color:var(--sw-white)}.notification-icon{width:38px;height:38px;flex:0 0 38px;display:flex;align-items:center;justify-content:center;border-radius:13px;background:rgba(255,255,255,.15)}.notification-icon svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.notification-success .notification-icon{color:var(--sw-gold-500)}.notification-error .notification-icon{color:#ffb3a6}.notification-content{display:flex;flex-direction:column;gap:3px;flex:1}.notification-content strong{font-size:13px}.notification-content span{font-size:11px;line-height:1.5}.notification-close{border:0;background:transparent;color:currentColor;font-size:20px;cursor:pointer}.back-auth-button{position:absolute;top:28px;left:28px;z-index:20;border:0;background:transparent;color:var(--sw-page-text);font:600 12px var(--sw-font-body);cursor:pointer}.page-brand{position:absolute;top:28px;display:flex;align-items:center;gap:10px;font:800 14px var(--sw-font-body);letter-spacing:.08em}.page-brand .brand-mark{width:34px;height:34px;border-radius:50%;background:var(--sw-gold-500);display:grid;place-items:center}.login-content{width:min(100%,430px);padding:10px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:var(--sw-gold-500)}h1{margin:8px 0;font-size:42px}.intro{color:var(--sw-page-text-soft);margin-bottom:28px}.field{margin-bottom:18px}.field label{display:block;margin-bottom:7px;font-size:12px;font-weight:700}.field input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid var(--sw-input-border);border-radius:12px;background:var(--sw-input-background);color:var(--sw-page-text);outline:none}.password-input-wrapper{position:relative}.password-input-wrapper input{padding-right:48px}.password-toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--sw-page-text-soft);cursor:pointer}.password-toggle svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.forgot{text-align:right;margin:8px 0 20px}.forgot a,.bottom-link a{color:var(--sw-gold-500);text-decoration:none}.login-submit{width:100%;padding:14px;border:0;border-radius:999px;background:var(--sw-gold-500);color:var(--sw-purple-900);font-weight:800;cursor:pointer}.login-submit:disabled{opacity:.6;cursor:not-allowed}.bottom-link{text-align:center;margin-top:20px;color:var(--sw-page-text-soft);font-size:12px}.login-page footer{position:absolute;bottom:22px;font-size:11px;color:var(--sw-page-text-soft)}
@media(max-width:600px){.login-page{padding:90px 18px 70px}.back-auth-button{left:18px;top:18px}.page-brand{top:18px;right:18px;font-size:11px}.page-brand .brand-mark{width:30px;height:30px}}
</style>