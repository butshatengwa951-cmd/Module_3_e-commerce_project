<template>
  <header class="sw-header">
    <button class="menu-button" type="button" aria-label="Open menu" @click="menuOpen = !menuOpen">☰</button>
    <router-link to="/" class="brand"><span class="brand-mark">🤝</span><span class="brand-name">STOCK<span>WELL</span></span></router-link>
    <nav class="desktop-nav" aria-label="Primary navigation"><router-link to="/">Home</router-link><router-link to="/catalogue">Catalogue</router-link></nav>
    <div class="header-actions">
      <router-link class="icon-button" to="/catalogue" aria-label="Search">🔍</router-link>
      <router-link v-if="isLoggedIn" class="icon-button cart-button" to="/cart" aria-label="Cart">🛒<span v-if="cartCount" class="cart-count">{{ cartCount }}</span></router-link>
      <template v-if="isLoggedIn">
        <router-link class="icon-button" to="/profile" aria-label="Profile">👤</router-link>
        <button class="icon-button theme-button" type="button" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">{{ isDark ? "☀" : "☾" }}</button>
        <button class="logout-btn" type="button" @click="logout">Logout</button>
      </template>
      <template v-else><router-link class="join-btn" to="/login-signup">Join</router-link><button class="icon-button theme-button" type="button" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">{{ isDark ? "☀" : "☾" }}</button></template>
    </div>
  </header>
  <nav v-if="menuOpen" class="mobile-nav" aria-label="Mobile navigation">
    <router-link to="/" @click="menuOpen = false">Home</router-link><router-link to="/catalogue" @click="menuOpen = false">Catalogue</router-link><router-link v-if="isLoggedIn" to="/cart" @click="menuOpen = false">Cart</router-link><router-link v-if="isLoggedIn" to="/profile" @click="menuOpen = false">Profile</router-link><router-link v-if="!isLoggedIn" to="/login-signup" @click="menuOpen = false">Join</router-link><button type="button" @click="toggleTheme">{{ isDark ? "☀ Light mode" : "☾ Dark mode" }}</button><button v-if="isLoggedIn" type="button" @click="logout">Logout</button>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "../../composables/useTheme.js";
import { readCartState } from "../../composables/useCartState.js";

const router = useRouter();
const { isDark, toggleTheme } = useTheme();
const menuOpen = ref(false);
const cartCount = ref(readCartState().itemCount || 0);
const authVersion = ref(0);
const isLoggedIn = computed(() => { authVersion.value; return Boolean(localStorage.getItem("token") || localStorage.getItem("sw_token")); });
function refreshAuthState() { authVersion.value += 1; }
function updateCart(event) { cartCount.value = Number(event.detail?.itemCount ?? event.detail ?? 0); }
function refreshStoredCart() { cartCount.value = Number(readCartState().itemCount || 0); }
function logout() { localStorage.removeItem("token"); localStorage.removeItem("sw_token"); localStorage.removeItem("user"); localStorage.removeItem("stokvel"); localStorage.removeItem("stockwellCheckoutState"); localStorage.removeItem("stockwellCartState"); localStorage.removeItem("basketCount"); cartCount.value = 0; menuOpen.value = false; refreshAuthState(); router.push("/"); }
onMounted(() => { window.addEventListener("cart-state-updated", updateCart); window.addEventListener("basket-updated", updateCart); window.addEventListener("auth-updated", refreshAuthState); window.addEventListener("login-completed", refreshAuthState); window.addEventListener("storage", () => { refreshAuthState(); refreshStoredCart(); }); window.addEventListener("focus", () => { refreshAuthState(); refreshStoredCart(); }); });
onBeforeUnmount(() => { window.removeEventListener("cart-state-updated", updateCart); window.removeEventListener("basket-updated", updateCart); window.removeEventListener("auth-updated", refreshAuthState); window.removeEventListener("login-completed", refreshAuthState); });
</script>

<style scoped>
.sw-header { position:sticky;top:0;z-index:1000;min-height:68px;padding:0 28px;display:flex;align-items:center;gap:28px;background:color-mix(in srgb,var(--sw-page-background) 94%,transparent);border-bottom:1px solid var(--sw-input-border);backdrop-filter:blur(16px);color:var(--sw-page-text); }.brand{display:flex;align-items:center;gap:10px;min-width:160px;color:var(--sw-page-text);text-decoration:none}.brand-mark{width:42px;height:42px;border-radius:50%;background:var(--sw-gold-500);color:var(--sw-purple-900);display:grid;place-items:center;font-size:22px;border:2px solid var(--sw-gold-500)}.brand-name{font-size:20px;font-weight:800;letter-spacing:.06em}.brand-name span{color:var(--sw-gold-500)}.desktop-nav{flex:1;display:flex;justify-content:center;gap:30px}.desktop-nav a{color:var(--sw-page-text-soft);font-family:var(--sw-font-body);font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}.desktop-nav a:hover,.desktop-nav a.router-link-active{color:var(--sw-gold-500)}.header-actions{display:flex;align-items:center;gap:9px}.icon-button{position:relative;width:38px;height:38px;display:grid;place-items:center;color:var(--sw-page-text);text-decoration:none;border:1px solid transparent;border-radius:50%;background:transparent;cursor:pointer;font-size:17px}.icon-button:hover{color:var(--sw-gold-500);background:var(--sw-page-surface);border-color:var(--sw-input-border)}.cart-count{position:absolute;top:-2px;right:-2px;min-width:17px;height:17px;padding:0 4px;display:grid;place-items:center;border-radius:50%;background:var(--sw-orange-600);color:#fff;font:700 9px var(--sw-font-body)}.join-btn,.logout-btn{margin-left:4px;padding:9px 15px;border:1px solid var(--sw-input-border);border-radius:999px;background:var(--sw-page-surface);color:var(--sw-page-text);font:11px var(--sw-font-body);text-decoration:none;cursor:pointer}.join-btn:hover,.logout-btn:hover{background:var(--sw-gold-500);border-color:var(--sw-gold-500);color:var(--sw-purple-900)}.menu-button,.mobile-nav{display:none}@media(max-width:900px){.sw-header{padding:0 16px;gap:12px}.brand{min-width:auto}.brand-mark{width:36px;height:36px;font-size:19px}.brand-name{font-size:17px}.desktop-nav{display:none}.menu-button{display:block;padding:6px;border:0;background:transparent;color:var(--sw-page-text);font-size:21px;cursor:pointer}.header-actions{margin-left:auto;gap:3px}.join-btn,.logout-btn{display:none}.mobile-nav{display:flex;flex-direction:column;position:sticky;top:68px;z-index:999;background:var(--sw-page-background);border-bottom:1px solid var(--sw-input-border)}.mobile-nav a,.mobile-nav button{padding:14px 20px;border:0;border-bottom:1px solid var(--sw-input-border);background:transparent;color:var(--sw-page-text);text-align:left;text-decoration:none;font:11px var(--sw-font-body);text-transform:uppercase;cursor:pointer}}
</style>
