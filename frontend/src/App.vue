<template>
  <div id="app" class="app-shell">
    <Header />
    <button class="theme-toggle" type="button" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
      {{ isDark ? "☀ Light" : "☾ Dark" }}
    </button>
    <router-view />
    <Footer />
    <ConfirmationPopup v-if="showConfirm" @close="showConfirm = false" />
  </div>
</template>

<script setup>
import { ref, provide } from "vue";
import { useTheme } from "./composables/useTheme.js";
import Header from "./components/layout/Header.vue";
import ConfirmationPopup from "./components/ui/ConfirmationPopup.vue";
import Footer from "./components/ui/Footer.vue";

const { isDark, toggleTheme } = useTheme();
const showConfirm = ref(false);
provide("showConfirm", showConfirm);
</script>

<style scoped>
.app-shell { min-height: 100vh; position: relative; background: var(--bg); color: var(--text); transition: background .3s ease, color .3s ease; }
.theme-toggle { position:fixed; top:76px; right:24px; z-index:100; padding:9px 13px; border:1px solid var(--border); border-radius:999px; background:var(--bg-secondary); color:var(--text); box-shadow:0 8px 24px rgba(0,0,0,.15); font-size:.72rem; font-weight:700; }
@media (max-width:620px) { .theme-toggle { top:64px; right:14px; } }
</style>
