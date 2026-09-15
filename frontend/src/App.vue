<template>

  <div class="app-shell" :class="theme">

    <!-- HEADER -->
    <header class="site-header">

      <!-- MOBILE MENU BUTTON -->
      <button
        class="menu-button"
        @click="menuOpen = !menuOpen"
      >
        ☰
      </button>


      <!-- LOGO -->
      <RouterLink
        class="brand"
        to="/"
      >

        <span class="brand-mark">
          🤝
        </span>

        <span class="brand-name">
          STOCK<span>WELL</span>
        </span>

      </RouterLink>


      <!-- DESKTOP NAVIGATION -->
      <nav class="desktop-nav">

        <RouterLink
          to="/"
          @click="menuOpen = false"
        >
          Home
        </RouterLink>


        <RouterLink
          to="/catalogue"
          @click="menuOpen = false"
        >
          Catalogue
        </RouterLink>



        <RouterLink
          to="/order-history"
          @click="menuOpen = false"
        >
          Order History
        </RouterLink>



        <RouterLink
          to="/delivery"
          @click="menuOpen = false"
        >
          Delivery
        </RouterLink>

      </nav>


      <!-- HEADER ACTIONS -->
      <div class="header-actions">

        <!-- SEARCH -->
        <RouterLink
          class="icon-button"
          to="/catalogue"
          title="Search products"
        >
          ⌕
        </RouterLink>


        <!-- CART -->
        <RouterLink
          class="basket-button"
          to="/cart"
          title="Shopping cart"
        >

          <span class="basket-symbol">
            🛒
          </span>

          <span class="basket-count">
            {{ cartCount }}
          </span>

        </RouterLink>


        <!-- THEME -->
        <button
          class="nav-icon theme-button"
          @click="toggleTheme"
          :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
        >
          {{ theme === "dark" ? "☀" : "☾" }}
        </button>


        <!-- SIGN UP -->
        <RouterLink
          class="signup-btn"
          to="/signup"
        >
          Sign Up
        </RouterLink>


        <!-- LOGIN -->
        <RouterLink
          class="login-btn"
          to="/login"
        >
          Login
        </RouterLink>

      </div>

    </header>


    <!-- MOBILE NAVIGATION -->
    <nav
      v-if="menuOpen"
      class="mobile-nav"
    >

      <RouterLink
        to="/"
        @click="menuOpen = false"
      >
        Home
      </RouterLink>


      <RouterLink
        to="/catalogue"
        @click="menuOpen = false"
      >
        Catalogue
      </RouterLink>


      <RouterLink
        to="/cart"
        @click="menuOpen = false"
      >
        Cart
      </RouterLink>


      <RouterLink
        to="/order-history"
        @click="menuOpen = false"
      >
        Order History
      </RouterLink>


      <RouterLink
        to="/payment"
        @click="menuOpen = false"
      >
        Payment
      </RouterLink>


      <RouterLink
        to="/delivery"
        @click="menuOpen = false"
      >
        Delivery
      </RouterLink>


      <RouterLink
        to="/member/1"
        @click="menuOpen = false"
      >
        Stokvel Groups
      </RouterLink>


      <RouterLink
        to="/admin"
        @click="menuOpen = false"
      >
        Admin
      </RouterLink>


      <RouterLink
        to="/signup"
        @click="menuOpen = false"
      >
        Sign Up
      </RouterLink>


      <RouterLink
        to="/login"
        @click="menuOpen = false"
      >
        Login
      </RouterLink>


      <button @click="logout">
        Logout
      </button>

    </nav>


    <!-- PAGE CONTENT -->
    <main>

      <RouterView :theme="theme" />

    </main>


    <!-- FOOTER -->
    <footer class="site-footer">

      <div>

        <strong>
          STOCK<span>WELL</span>
        </strong>

        <p>
          Wholesale shopping made for SA stokvels • R50B economy • 82.5% women-led
        </p>

      </div>


      <div class="footer-right">
        One group. One goal. Better savings. 🤝
      </div>

    </footer>

  </div>

</template>


<script setup>

import {
  ref,
  onMounted,
  onBeforeUnmount
} from "vue";

import { useRouter } from "vue-router";


const router = useRouter();


/* =========================
   THEME
========================= */

const isDark = ref(true);

const theme = ref("dark");


/* =========================
   MOBILE MENU
========================= */

const menuOpen = ref(false);


/* =========================
   CART COUNT
========================= */

const cartCount = ref(
  Number(
    localStorage.getItem("basketCount") || 0
  )
);


/* =========================
   CHANGE THEME
========================= */

function toggleTheme() {

  isDark.value = !isDark.value;

  theme.value = isDark.value
    ? "dark"
    : "light";

  document.body.className = theme.value;

  localStorage.setItem(
    "theme",
    theme.value
  );

}


/* =========================
   LOGOUT
========================= */

function logout() {

  localStorage.clear();

  cartCount.value = 0;

  menuOpen.value = false;

  router.push("/");

  alert("Logged out 🤝");

}


/* =========================
   UPDATE CART COUNT
========================= */

function updateCart(e) {

  cartCount.value = e.detail;

}


/* =========================
   PAGE LOAD
========================= */

onMounted(() => {

  const saved =
    localStorage.getItem("theme") || "dark";

  theme.value = saved;

  isDark.value =
    saved === "dark";

  document.body.className = saved;


  window.addEventListener(
    "basket-updated",
    updateCart
  );

});


/* =========================
   CLEAN UP
========================= */

onBeforeUnmount(() => {

  window.removeEventListener(
    "basket-updated",
    updateCart
  );

});

</script>


<style>

@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");


/* =========================
   VARIABLES
========================= */

:root {

  --gold: #C8B019;

  --purple: #795D89;

  --cream: #EDE7F6;

  --dark: #130E23;

  --line: #D4CCEC;

  font-family: "Space Grotesk", sans-serif;

}


/* =========================
   RESET
========================= */

* {

  box-sizing: border-box;

}


body {

  margin: 0;

  min-width: 320px;

  background: #130E23;

  color: #EDE7F6;

}


body.light {

  background: #EDE7F6;

  color: #221A3A;

}


/* =========================
   APP
========================= */

.app-shell {

  min-height: 100vh;

  display: flex;

  flex-direction: column;

}


main {

  flex: 1;

}


/* =========================
   HEADER
========================= */

.site-header {

  min-height: 68px;

  padding: 0 24px;

  display: flex;

  align-items: center;

  gap: 20px;

  background: rgba(36, 30, 56, 0.95);

  border-bottom: 1px solid rgba(167, 139, 250, 0.2);

  position: sticky;

  top: 0;

  z-index: 1000;

  backdrop-filter: blur(10px);

}


body.light .site-header {

  background: rgba(255, 255, 255, 0.92);

}


/* =========================
   BRAND
========================= */

.brand {

  display: flex;

  align-items: center;

  gap: 10px;

  text-decoration: none;

  color: inherit;

  min-width: 160px;

}


.brand-mark {

  width: 42px;

  height: 42px;

  border-radius: 50%;

  background: var(--gold);

  color: #221A3A;

  display: grid;

  place-items: center;

  font-size: 22px;

  border: 2px solid var(--gold);

}


.brand-name {

  font-size: 20px;

  font-weight: 800;

  letter-spacing: 0.06em;

}


.brand-name span {

  color: var(--gold);

}


/* =========================
   DESKTOP NAV
========================= */

.desktop-nav {

  flex: 1;

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 20px;

}


.desktop-nav a {

  font-family: "DM Mono";

  font-size: 10px;

  text-transform: uppercase;

  text-decoration: none;

  color: inherit;

  letter-spacing: 0.5px;

  transition: 0.2s;

  white-space: nowrap;

}


.desktop-nav a:hover,

.desktop-nav .router-link-active {

  color: var(--gold);

}


/* =========================
   HEADER ACTIONS
========================= */

.header-actions {

  display: flex;

  align-items: center;

  gap: 10px;

}


/* =========================
   SEARCH
========================= */

.icon-button {

  font-size: 20px;

  text-decoration: none;

  color: inherit;

  display: flex;

  align-items: center;

  justify-content: center;

  transition: 0.2s;

}


.icon-button:hover {

  color: var(--gold);

}


/* =========================
   CART
========================= */

.basket-button {

  width: 40px;

  height: 40px;

  display: grid;

  place-items: center;

  position: relative;

  text-decoration: none;

  color: inherit;

}


.basket-symbol {

  font-size: 20px;

}


.basket-count {

  position: absolute;

  top: -4px;

  right: -3px;

  min-width: 18px;

  height: 18px;

  padding: 0 4px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 50%;

  background: #c2583d;

  color: white;

  font-size: 10px;

  font-weight: 700;

}


/* =========================
   THEME BUTTON
========================= */

.theme-button {

  border: 0;

  background: transparent;

  color: inherit;

  font-size: 18px;

  cursor: pointer;

  padding: 6px;

}


.theme-button:hover {

  color: var(--gold);

}


/* =========================
   SIGN UP
========================= */

.signup-btn {

  border: 1px solid var(--gold);

  background: transparent;

  color: inherit;

  padding: 8px 13px;

  border-radius: 20px;

  font-family: "DM Mono";

  font-size: 10px;

  text-decoration: none;

  text-transform: uppercase;

  transition: 0.2s;

}


.signup-btn:hover {

  background: var(--gold);

  color: #221A3A;

}


/* =========================
   LOGIN
========================= */

.login-btn {

  border: 1px solid var(--gold);

  background: var(--gold);

  color: #221A3A;

  padding: 8px 14px;

  border-radius: 20px;

  font-family: "DM Mono";

  font-size: 10px;

  text-decoration: none;

  text-transform: uppercase;

  transition: 0.2s;

}


.login-btn:hover {

  background: transparent;

  color: inherit;

}


/* =========================
   LOGOUT
========================= */

.logout-btn {

  border: 1px solid var(--line);

  background: var(--card, #fff);

  color: inherit;

  padding: 8px 14px;

  border-radius: 20px;

  font-family: "DM Mono";

  font-size: 11px;

  cursor: pointer;

}


.logout-btn:hover {

  background: var(--gold);

  color: #221A3A;

  border-color: var(--gold);

}


/* =========================
   MOBILE MENU BUTTON
========================= */

.menu-button {

  display: none;

  background: transparent;

  border: 0;

  color: inherit;

  font-size: 20px;

  cursor: pointer;

}


/* =========================
   MOBILE NAV
========================= */

.mobile-nav {

  display: none;

}


/* =========================
   FOOTER
========================= */

.site-footer {

  padding: 24px;

  background: #1A102E;

  border-top: 1px solid rgba(167, 139, 250, 0.2);

  display: flex;

  justify-content: space-between;

  color: #9B92B5;

  font-size: 12px;

}


.site-footer strong {

  color: white;

  font-size: 16px;

}


.site-footer strong span {

  color: var(--gold);

}


.site-footer p {

  margin: 8px 0 0;

}


/* =========================
   MOBILE
========================= */

@media (max-width: 1100px) {

  .desktop-nav {

    gap: 12px;

  }


  .desktop-nav a {

    font-size: 9px;

  }

  .header-actions {

    gap: 7px;

  }

  .signup-btn,

  .login-btn {

    padding: 7px 10px;

    font-size: 9px;

  }

}


@media (max-width: 900px) {

  .site-header {

    padding: 0 16px;

  }


  .desktop-nav {

    display: none;

  }


  .menu-button {

    display: block;

  }


  .mobile-nav {

    display: flex;

    flex-direction: column;

    background: #241E38;

    border-bottom: 1px solid var(--gold);

    padding: 10px;

  }


  .mobile-nav a,

  .mobile-nav button {

    padding: 12px 20px;

    font-family: "DM Mono";

    font-size: 12px;

    text-transform: uppercase;

    color: white;

    text-decoration: none;

    background: transparent;

    border: 0;

    text-align: left;

    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    cursor: pointer;

  }


  .mobile-nav a:hover,

  .mobile-nav button:hover {

    color: var(--gold);

  }


  .header-actions {

    margin-left: auto;

  }


  .signup-btn,

  .login-btn {

    display: none;

  }


  .footer-right {

    display: none;

  }


  .site-footer {

    flex-direction: column;

    gap: 10px;

  }

}


@media (max-width: 500px) {

  .brand {

    min-width: auto;

  }


  .brand-name {

    font-size: 16px;

  }


  .brand-mark {

    width: 36px;

    height: 36px;

    font-size: 18px;

  }


  .site-header {

    gap: 10px;

  }


  .icon-button {

    font-size: 18px;

  }


  .basket-button {

    width: 34px;

    height: 34px;

  }

}

</style>