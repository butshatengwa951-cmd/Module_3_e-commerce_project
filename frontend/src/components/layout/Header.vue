<template>
  <header class="sw-header">
    <button class="menu-button" type="button" aria-label="Open menu" @click="menuOpen = !menuOpen">☰</button>

    <router-link to="/pay" class="brand">STOCKWELL</router-link>

    <nav class="desktop-nav" aria-label="Primary navigation">
      <router-link to="/pay">Home</router-link>
      <router-link to="/catalogue">Catalogue</router-link>
    </nav>

    <div class="header-actions">
      <router-link class="icon-button" to="/catalogue" aria-label="Search">🔍</router-link>

      <router-link class="icon-button cart-button" to="/cart" aria-label="Cart">
        🛒
        <span v-if="cartCount" class="cart-count">{{ cartCount }}</span>
      </router-link>

      <template v-if="isLoggedIn">
        <router-link class="icon-button" to="/profile" aria-label="Profile">👤</router-link>

        <button class="icon-button theme-button" type="button" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
          {{ isDark ? "☀" : "☾" }}
        </button>

        <button class="logout-btn" type="button" @click="logout">Logout</button>
      </template>

      <template v-else>
        <router-link class="join-btn" to="/profile">Join</router-link>

        <button class="icon-button theme-button" type="button" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
          {{ isDark ? "☀" : "☾" }}
        </button>
      </template>
    </div>
  </header>

  <nav v-if="menuOpen" class="mobile-nav" aria-label="Mobile navigation">
    <router-link to="/pay" @click="menuOpen = false">Home</router-link>
    <router-link to="/catalogue" @click="menuOpen = false">Catalogue</router-link>
    <router-link to="/delivery" @click="menuOpen = false">Delivery</router-link>
    <router-link v-if="isLoggedIn" to="/profile" @click="menuOpen = false">Profile</router-link>
    <router-link to="/cart" @click="menuOpen = false">Cart</router-link>
    <router-link v-if="!isLoggedIn" to="/profile" @click="menuOpen = false">Join</router-link>
    <button type="button" @click="toggleTheme">{{ isDark ? "☀ Light mode" : "☾ Dark mode" }}</button>
    <button v-if="isLoggedIn" type="button" @click="logout">Logout</button>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "../../composables/useTheme.js";

const router = useRouter();
const { isDark, toggleTheme } = useTheme();
const menuOpen = ref(false);
const cartCount = ref(Number(localStorage.getItem("basketCount") || 0));
const authVersion = ref(0);

const isLoggedIn = computed(() => {
  authVersion.value;
  return Boolean(localStorage.getItem("token") || localStorage.getItem("sw_token"));
});

function refreshAuthState() {
  authVersion.value += 1;
}

function updateCart(event) {
  cartCount.value = Number(event.detail || 0);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("sw_token");
  localStorage.removeItem("basketCount");
  cartCount.value = 0;
  menuOpen.value = false;
  refreshAuthState();
  router.push("/pay");
}

onMounted(() => {
  window.addEventListener("basket-updated", updateCart);
  window.addEventListener("auth-updated", refreshAuthState);
  window.addEventListener("storage", refreshAuthState);
  window.addEventListener("focus", refreshAuthState);
  router.afterEach(refreshAuthState);
});

onBeforeUnmount(() => {
  window.removeEventListener("basket-updated", updateCart);
  window.removeEventListener("auth-updated", refreshAuthState);
  window.removeEventListener("storage", refreshAuthState);
  window.removeEventListener("focus", refreshAuthState);
});
</script>

<style scoped>
.sw-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: 68px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  gap: 28px;
  background: color-mix(in srgb, var(--bg-secondary) 94%, transparent);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(16px);
  color: var(--text);
}

.brand {
  min-width: 160px;
  color: var(--text);
  text-decoration: none;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.desktop-nav {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 30px;
}

.desktop-nav a {
  color: var(--text-soft);
  font-family: "DM Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: color 0.2s ease;
}

.desktop-nav a:hover,
.desktop-nav a.router-link-active {
  color: var(--gold);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.icon-button {
  position: relative;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: var(--text);
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 17px;
  transition: 0.2s ease;
}

.icon-button:hover {
  color: var(--gold);
  background: var(--card);
  border-color: var(--border);
}

.cart-count {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--terra);
  color: #fff;
  font: 700 9px "DM Mono", monospace;
}

.join-btn,
.logout-btn {
  margin-left: 4px;
  padding: 9px 15px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--card);
  color: var(--text);
  font: 11px "DM Mono", monospace;
  text-decoration: none;
  cursor: pointer;
  transition: 0.2s ease;
}

.join-btn:hover,
.logout-btn:hover {
  background: var(--gold);
  border-color: var(--gold);
  color: #211a2d;
}

.menu-button,
.mobile-nav {
  display: none;
}

@media (max-width: 900px) {
  .sw-header {
    padding: 0 16px;
    gap: 12px;
  }

  .brand {
    min-width: auto;
    font-size: 17px;
  }

  .desktop-nav {
    display: none;
  }

  .menu-button {
    display: block;
    padding: 6px;
    border: 0;
    background: transparent;
    color: var(--text);
    font-size: 21px;
    cursor: pointer;
  }

  .header-actions {
    margin-left: auto;
    gap: 3px;
  }

  .join-btn,
  .logout-btn {
    display: none;
  }

  .mobile-nav {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 68px;
    z-index: 999;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  }

  .mobile-nav a,
  .mobile-nav button {
    padding: 14px 20px;
    border: 0;
    border-bottom: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    text-align: left;
    text-decoration: none;
    font: 11px "DM Mono", monospace;
    text-transform: uppercase;
    cursor: pointer;
  }

  .mobile-nav a:hover,
  .mobile-nav button:hover {
    background: var(--card);
    color: var(--gold);
  }
}
</style>
