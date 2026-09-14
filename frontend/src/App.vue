<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="app-frame">
    <nav class="navbar">
      <div class="nav-left">
        <RouterLink class="nav-link" to="/cart">Cart</RouterLink>
        <RouterLink class="nav-link" to="/catalogue">Catalogue</RouterLink>
        <RouterLink class="nav-link" to="/delivery">Delivery</RouterLink>
        <RouterLink class="nav-link" to="/login">Login</RouterLink>
        <RouterLink class="nav-link" to="/order-history"
          >Order History</RouterLink
        >
        <RouterLink class="nav-link" to="/payment">Payment</RouterLink>
        <RouterLink class="nav-link" to="/signup">Sign Up</RouterLink>
      </div>
    </nav>

    <header class="app-header">
      <div class="brand-wrap">
        <span class="brand-mark">S</span>
        <span class="brand-text">STOCKWELL</span>
      </div>

      <span class="profile-avatar">NM</span>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
.app-frame {
  min-height: 100vh;
  background: #eef1ea;
  color: #111827;
  font-family: Inter, Arial, sans-serif;
}

.navbar {
  width: 100%;
  background: #eef1ea;
  border-bottom: 1px solid #d7d9d8;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 10px 32px;
  flex-wrap: wrap;
}

.nav-link {
  color: #3c4a60;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  padding: 4px 6px;
  transition: color 0.2s ease;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #3850f5;
}

.app-header {
  width: min(1200px, calc(100vw - 80px));
  margin: 20px auto 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid #e2e7dc;
  display: flex;
  align-items: center;
  min-height: 70px;
  padding: 0 24px;
  gap: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #111827;
  color: #fff;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  font-size: 24px;
  font-weight: 900;
  color: #111827;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  background: #111827;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
}

@media (max-width: 768px) {
  .app-header {
    flex-wrap: wrap;
    height: auto;
    padding: 16px;
  }

  .nav-left {
    gap: 12px;
  }
}
</style>
