<script setup>
import { useTheme } from "./composables/useTheme.js";

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <div class="app-shell">
    <button
      class="theme-toggle"
      type="button"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleTheme"
    >
      <span v-if="isDark" aria-hidden="true"> ☀ </span>

      <span v-else aria-hidden="true"> ☾ </span>

      <span class="theme-toggle-label">
        {{ isDark ? "Light" : "Dark" }}
      </span>
    </button>

    <router-view />
  </div>
</template>

<style>
.app-shell {
  min-height: 100vh;
}

/* =========================================================
   THEME TOGGLE
   ========================================================= */

.theme-toggle {
  position: fixed;

  top: var(--sw-space-8);
  right: var(--sw-space-9);

  z-index: 100;

  display: inline-flex;

  align-items: center;

  gap: var(--sw-space-2);

  padding: 9px 14px;

  border: 1px solid var(--sw-toggle-border);

  border-radius: var(--sw-radius-pill);

  background: var(--sw-toggle-background);

  color: var(--sw-purple-900);

  backdrop-filter: blur(14px);

  -webkit-backdrop-filter: blur(14px);

  box-shadow: var(--sw-toggle-shadow);

  font-family: var(--sw-font-body);

  font-size: var(--sw-text-sm);

  font-weight: 700;

  cursor: pointer;

  transition:
    transform var(--sw-transition-fast),
    background var(--sw-transition-fast),
    box-shadow var(--sw-transition-fast);
}

.theme-toggle:hover {
  transform: translateY(-2px);

  box-shadow: var(--sw-toggle-shadow-hover);
}

.theme-toggle:active {
  transform: translateY(0);
}

.theme-toggle:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);

  outline-offset: 3px;
}

.theme-toggle-label {
  letter-spacing: 0.04em;
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {
  .theme-toggle {
    top: var(--sw-space-6);

    right: var(--sw-space-6);

    padding: var(--sw-space-2) var(--sw-space-3);
  }

  .theme-toggle-label {
    display: none;
  }
}
</style>