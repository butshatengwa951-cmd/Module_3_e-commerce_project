<script setup>
import { RouterLink, RouterView } from "vue-router";
import { onMounted, ref } from "vue";
import { cartApi } from "./services/api.js";

const appTheme = ref("light");
const cartCount = ref(0);

const syncTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  const nextTheme = savedTheme || systemTheme;
  appTheme.value = nextTheme;
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  document.documentElement.setAttribute("data-theme", nextTheme);
};

const toggleTheme = () => {
  const nextTheme = appTheme.value === "dark" ? "light" : "dark";
  appTheme.value = nextTheme;
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  document.documentElement.setAttribute("data-theme", nextTheme);
  localStorage.setItem("theme", nextTheme);
  window.dispatchEvent(new CustomEvent("theme-change", { detail: nextTheme }));
};

const syncCartCount = async (event) => {
  if (typeof event?.detail === "number") {
    cartCount.value = event.detail;
    return;
  }

  try {
    const { data } = await cartApi.getCart(1);
    cartCount.value = (data.items || []).length;
  } catch (error) {
    cartCount.value = 0;
  }
};

onMounted(() => {
  syncTheme();
  syncCartCount();
  window.addEventListener("theme-change", syncTheme);
  window.addEventListener("cart-change", syncCartCount);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (!localStorage.getItem("theme")) {
      syncTheme();
    }
  };

  media.addEventListener?.("change", onChange);
});
</script>

<template>
  <div class="app-frame" :class="appTheme">
    <nav class="navbar">
      <RouterLink class="brand-wrap" to="/" aria-label="Stockwell home">
        <span class="brand-mark">🤝</span>
        <span class="brand-text">STOCK<span>WELL</span></span>
      </RouterLink>

      <div class="nav-links">
        <RouterLink class="nav-link" to="/">Home</RouterLink>
        <RouterLink class="nav-link" to="/catalogue">Catalogue</RouterLink>
        <RouterLink class="nav-link" to="/cart">Cart</RouterLink>
        <RouterLink class="nav-link" to="/order-history"
          >Order History</RouterLink
        >
        <RouterLink class="nav-link" to="/payment">Payment</RouterLink>
        <RouterLink class="nav-link" to="/delivery">Delivery</RouterLink>
      </div>

      <div class="nav-actions">
        <button class="icon-button" aria-label="Search">⌕</button>
        <RouterLink class="cart-button" to="/cart" aria-label="Cart">
          🛒
          <span class="cart-count">{{ cartCount }}</span>
        </RouterLink>
        <button
          class="icon-button theme-button"
          @click="toggleTheme"
          aria-label="Toggle theme"
        >
          {{ appTheme === "dark" ? "☀" : "☾" }}
        </button>
        <RouterLink class="signup-button" to="/signup">Sign Up</RouterLink>
        <RouterLink class="login-button" to="/login">Login</RouterLink>
      </div>
    </nav>

    <RouterView />
  </div>
</template>

<style scoped>
.app-frame {
  min-height: 100vh;
  background: #f7f5f2;
  color: #111827;
  font-family: "Trebuchet MS", Arial, sans-serif;
  transition:
    background 0.25s ease,
    color 0.25s ease;
}

.app-frame.dark {
  background: #1d1231;
  color: #f3eef9;
}

.navbar {
  width: 100%;
  min-height: 76px;
  padding: 0 22px;
  display: flex;
  align-items: center;
  gap: 28px;
  background: #fff;
  border-bottom: 1px solid #e8e6e2;
  box-shadow: 0 1px 8px rgba(30, 26, 20, 0.04);
}

.app-frame.dark .navbar {
  background: #1f1434;
  border-bottom-color: rgba(199, 182, 236, 0.2);
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 255px;
  text-decoration: none;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #d2ae08;
  color: #fff4b0;
  font-size: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  font-size: 25px;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: #211b37;
}

.brand-text span {
  color: #c5a900;
}

.app-frame.dark .brand-text {
  color: #f7f2ff;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  flex: 1;
}

.nav-link {
  color: #282039;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.app-frame.dark .nav-link {
  color: #f3eef9;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #c5a900;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
}

.icon-button,
.cart-button {
  border: 0;
  background: transparent;
  color: #211b37;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  padding: 4px;
  text-decoration: none;
}

.app-frame.dark .icon-button,
.app-frame.dark .cart-button {
  color: #f7f2ff;
}

.cart-button {
  position: relative;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -7px;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #c85a3e;
  color: white;
  font:
    700 10px/18px Arial,
    sans-serif;
  text-align: center;
}

.signup-button,
.login-button {
  border-radius: 999px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 11px 18px;
  text-decoration: none;
  text-transform: uppercase;
}

.signup-button {
  border: 1px solid #c5a900;
  color: #211b37;
}

.login-button {
  background: #c5a900;
  color: #211b37;
}

.app-frame.dark .signup-button {
  color: #f7f2ff;
}

.app-frame.dark .login-button {
  color: #211b37;
}

.signup-button:hover,
.login-button:hover,
.icon-button:hover,
.cart-button:hover {
  opacity: 0.78;
}

@media (max-width: 1100px) {
  .navbar {
    gap: 16px;
  }

  .brand-wrap {
    min-width: auto;
  }

  .nav-links {
    gap: 14px;
  }

  .nav-actions {
    gap: 8px;
  }
}

@media (max-width: 800px) {
  .navbar {
    min-height: 70px;
    flex-wrap: wrap;
    padding: 12px 16px;
  }

  .nav-links {
    order: 3;
    flex-basis: 100%;
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 4px;
  }

  .brand-text {
    font-size: 21px;
  }

  .signup-button,
  .login-button {
    padding: 9px 12px;
  }
}

@media (max-width: 480px) {
  .nav-actions .theme-button,
  .nav-actions .signup-button {
    display: none;
  }
}
</style>
