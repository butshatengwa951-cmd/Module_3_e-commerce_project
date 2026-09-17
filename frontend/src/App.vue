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
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Header from "./components/layout/Header.vue";
import Footer from "./components/ui/Footer.vue";

const route = useRoute();
const router = useRouter();

const authRoutes = new Set([
  "AuthSelector",
  "Login",
  "Signup",
  "ForgotPassword",
  "ResetPassword",
]);

const showSiteShell = computed(() => !authRoutes.has(route.name));

const handleLoginCompleted = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "";
    const destination = redirect || (user?.role === "admin" ? "/admin" : "/member-dashboard");
    router.push(destination);
  } catch {
    router.push("/member-dashboard");
  }
};

onMounted(() => {
  window.addEventListener("login-completed", handleLoginCompleted);
});

onBeforeUnmount(() => {
  window.removeEventListener("login-completed", handleLoginCompleted);
});
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
