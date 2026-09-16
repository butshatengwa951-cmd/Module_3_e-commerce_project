<template>
  <div id="app" class="app-shell">
    <Header />
    <router-view />
    <Footer />
    <ConfirmationPopup v-if="showConfirm" @close="showConfirm = false" />
  </div>
</template>

<script setup>
import { ref, provide } from "vue";
import Header from "./components/layout/Header.vue";
import ConfirmationPopup from "./components/ui/ConfirmationPopup.vue";
import Footer from "./components/ui/Footer.vue";

const showConfirm = ref(false);
provide("showConfirm", showConfirm);
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  position: relative;
  background: var(--bg);
  color: var(--text);
  transition: background 0.3s ease, color 0.3s ease;
}
</style>
