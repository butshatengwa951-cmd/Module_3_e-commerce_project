<template>
  <div id="app" class="app-shell">
    <div class="background-grid"></div>

    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/pay" class="brand">STOCK<span>WELL</span></RouterLink>

        <nav class="main-nav">
          <RouterLink to="/pay">Home</RouterLink>
          <RouterLink to="/delivery">Delivery</RouterLink>
          <RouterLink v-if="auth.isLoggedIn" to="/member/profile" class="profile-link">
            <span class="profile-icon">{{ initials }}</span>
            <span>Profile</span>
          </RouterLink>
          <button v-if="auth.isLoggedIn" class="logout-btn" @click="logout">Logout</button>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <Footer />
    <ConfirmationPopup v-if="showConfirm" @close="showConfirm=false" />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth.js";
import ConfirmationPopup from "./components/ui/ConfirmationPopup.vue";
import Footer from "./components/ui/Footer.vue";

const router = useRouter();
const auth = useAuthStore();
auth.syncFromStorage();
const showConfirm = ref(false);

const initials = computed(() => {
  const name = auth.fullName || "Member";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
});

function logout() {
  auth.logout();
  router.push("/pay");
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }
body { margin: 0; background: #130e23; }
button, a { font: inherit; }

.app-shell { min-height: 100vh; background: #130e23; color: #fff; position: relative; font-family: "Space Grotesk", sans-serif; overflow-x: hidden; }
.background-grid { position: fixed; inset: 0; background-image: radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px); background-size: 24px 24px; opacity: .5; pointer-events: none; }
.site-header { position: relative; z-index: 20; border-bottom: 1px solid rgba(255,255,255,.08); background: rgba(19,14,35,.78); backdrop-filter: blur(18px); }
.header-inner { max-width: 1320px; min-height: 76px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand { color: #fff; text-decoration: none; font-family: "DM Mono", monospace; font-size: 16px; font-weight: 700; letter-spacing: .08em; }
.brand span { color: #d8b46a; }
.main-nav { display: flex; align-items: center; gap: 12px; }
.main-nav a, .logout-btn { color: rgba(255,255,255,.72); text-decoration: none; border: 0; background: transparent; padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: .2s ease; }
.main-nav a:hover, .logout-btn:hover, .main-nav a.router-link-active { color: #fff; background: rgba(255,255,255,.07); }
.profile-link { display: flex; align-items: center; gap: 8px; }
.profile-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: #d8b46a; color: #130e23; font: 700 10px "DM Mono", monospace; }
.logout-btn { font-size: 13px; }
.app-main { position: relative; z-index: 2; min-height: calc(100vh - 76px); }

@media (max-width: 640px) {
  .header-inner { min-height: 68px; padding: 0 16px; }
  .main-nav { gap: 2px; }
  .main-nav a, .logout-btn { padding: 7px 8px; font-size: 12px; }
  .main-nav a:first-child { display: none; }
  .profile-link span:last-child { display: none; }
}
</style>
