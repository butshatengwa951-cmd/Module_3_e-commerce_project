<template>
  <div id="app" class="app-shell">
    <div class="background-grid"></div>

    <header v-if="showNavbar" class="site-header">
      <div class="header-inner">
        <RouterLink to="/pay" class="brand">STOCK<span>WELL</span></RouterLink>

        <nav class="main-nav">
          <RouterLink to="/pay">Home</RouterLink>
          <RouterLink to="/pay">Catalogue</RouterLink>

          <button class="icon-btn" type="button" aria-label="Search" title="Search">⌕</button>
          <button class="icon-btn" type="button" aria-label="Basket" title="Basket">🛒</button>

          <RouterLink v-if="auth.isLoggedIn" to="/member/profile" class="profile-link" aria-label="Profile" title="Profile">
            <span class="profile-icon">{{ initials }}</span>
          </RouterLink>
          <button v-else class="icon-btn" type="button" aria-label="Profile" title="Join StockWell" @click="router.push('/')">♙</button>

          <button class="icon-btn theme-btn" type="button" aria-label="Toggle theme" title="Toggle theme" @click="toggleTheme">{{ isDark ? "☀" : "☾" }}</button>

          <button v-if="auth.isLoggedIn" class="logout-btn" @click="logout">Logout</button>
          <button v-else class="join-btn" @click="router.push('/')">Join</button>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <Footer v-if="showNavbar" />
    <ConfirmationPopup v-if="showConfirm" @close="showConfirm=false" />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth.js";
import ConfirmationPopup from "./components/ui/ConfirmationPopup.vue";
import Footer from "./components/ui/Footer.vue";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
auth.syncFromStorage();
const showConfirm = ref(false);
const isDark = ref(true);

const showNavbar = computed(() => !["/", "/login", "/signup"].includes(route.path));
const initials = computed(() => {
  const name = auth.fullName || "Member";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
});

function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("light-theme", !isDark.value);
}

function logout() {
  auth.logout();
  router.push("/pay");
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
*{box-sizing:border-box}body{margin:0;background:#130e23}button,a{font:inherit}.app-shell{min-height:100vh;background:#130e23;color:#fff;position:relative;font-family:"Space Grotesk",sans-serif;overflow-x:hidden}.background-grid{position:fixed;inset:0;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px);background-size:24px 24px;opacity:.5;pointer-events:none}.site-header{position:relative;z-index:20;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(19,14,35,.82);backdrop-filter:blur(18px)}.header-inner{max-width:1320px;min-height:76px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{color:#fff;text-decoration:none;font-family:"DM Mono",monospace;font-size:16px;font-weight:700;letter-spacing:.08em}.brand span{color:#d8b46a}.main-nav{display:flex;align-items:center;gap:8px}.main-nav a,.logout-btn,.join-btn{color:rgba(255,255,255,.72);text-decoration:none;border:0;background:transparent;padding:9px 11px;border-radius:10px;cursor:pointer;transition:.2s}.main-nav a:hover,.logout-btn:hover,.main-nav a.router-link-active{color:#fff;background:rgba(255,255,255,.07)}.icon-btn{width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:rgba(255,255,255,.78);cursor:pointer;font-size:18px}.icon-btn:hover{background:rgba(255,255,255,.08);color:#fff}.profile-link{display:flex;align-items:center;padding:3px!important}.profile-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#d8b46a;color:#130e23;font:700 10px "DM Mono",monospace}.join-btn{background:#d8b46a;color:#130e23;font-weight:700;padding:9px 18px}.join-btn:hover{background:#efd28e}.logout-btn{font-size:13px}.app-main{position:relative;z-index:2;min-height:calc(100vh - 76px)}.light-theme .app-shell{background:#f5f2ec;color:#241a35}.light-theme body{background:#f5f2ec}.light-theme .site-header{background:rgba(245,242,236,.82);border-color:rgba(36,26,53,.1)}.light-theme .brand,.light-theme .main-nav a,.light-theme .logout-btn,.light-theme .icon-btn{color:#241a35}.light-theme .background-grid{opacity:.12}
@media(max-width:800px){.header-inner{padding:0 14px}.main-nav{gap:2px}.main-nav>a{font-size:12px;padding:8px 6px}.main-nav>a:nth-child(2){display:none}.icon-btn{width:30px;height:30px;font-size:16px}.logout-btn{font-size:11px;padding:7px}.join-btn{padding:8px 12px;font-size:12px}.profile-icon{width:29px;height:29px}}
</style>
