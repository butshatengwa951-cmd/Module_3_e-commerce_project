<template>
  <div id="app" class="app-shell">
    <Header v-if="showSiteShell" />

    <main :class="{ 'auth-shell': !showSiteShell }">
      <router-view />
    </main>

    <Footer v-if="showSiteShell" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Header from "./components/layout/Header.vue";
import Footer from "./components/ui/Footer.vue";

const route = useRoute();

// Shared authentication pages keep their original full-screen presentation.
const authRoutes = new Set([
  "AuthSelector",
  "Login",
  "Signup",
  "ForgotPassword",
  "ResetPassword",
]);

const showSiteShell = computed(() => !authRoutes.has(route.name));
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  position: relative;
  background: var(--sw-page-background);
  color: var(--sw-page-text);
  transition: background 0.3s ease, color 0.3s ease;
}

.app-shell > main:not(.auth-shell) {
  min-height: calc(100vh - 68px);
}

.auth-shell {
  min-height: 100vh;
}
</style>
