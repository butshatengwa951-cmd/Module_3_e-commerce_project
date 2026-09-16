<template>
  <header class="sw-header">
    <router-link to="/pay" class="brand">STOCKWELL</router-link>
    <nav aria-label="Primary navigation">
      <router-link to="/pay">Payments</router-link>
      <router-link to="/delivery">Delivery</router-link>
      <router-link to="/profile">Profile</router-link>
    </nav>
  </header>
</template>

<style scoped>
.sw-header { position: sticky; top: 0; z-index: 90; display:flex; align-items:center; justify-content:space-between; gap:24px; padding:16px 28px; background:color-mix(in srgb,var(--bg-secondary) 86%,transparent); border-bottom:1px solid var(--border); backdrop-filter:blur(18px); color:var(--text); }
.brand { font-weight:800; letter-spacing:.12em; }
nav { display:flex; gap:20px; font-size:.82rem; }
nav a { color:var(--text-soft); }
nav a.router-link-active { color:var(--text); font-weight:700; }
@media (max-width:620px) { .sw-header { padding:14px 16px; } nav { gap:12px; font-size:.72rem; } }
</style>
