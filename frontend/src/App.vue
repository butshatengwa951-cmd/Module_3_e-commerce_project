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
      <span v-if="isDark" aria-hidden="true">☀</span>
      <span v-else aria-hidden="true">☾</span>

      <span class="theme-toggle-label">
        {{ isDark ? "Light" : "Dark" }}
      </span>
    </button>

    <router-view />
  </div>
</template>

<style>
:root {
  color-scheme: light;

  --page-text: #312b50;
  --page-muted: rgba(49, 43, 80, 0.7);

  --toggle-background: rgba(255, 255, 255, 0.22);
  --toggle-border: rgba(255, 255, 255, 0.32);
  --toggle-text: #ffffff;

  --dark-page-text: #f7f5f1;
}

html.dark-mode {
  color-scheme: dark;
}

html,
body,
#app {
  margin: 0;
  min-height: 100%;
}

body {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
}

.theme-toggle {
  position: fixed;

  top: 24px;
  right: 28px;

  z-index: 100;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 9px 14px;

  border: 1px solid var(--toggle-border);
  border-radius: 999px;

  background: var(--toggle-background);

  color: var(--toggle-text);

  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.18);

  font-family: "DM Mono", monospace;
  font-size: 0.68rem;
  font-weight: 700;

  cursor: pointer;

  transition:
    transform 200ms ease,
    background 200ms ease,
    box-shadow 200ms ease;
}

.theme-toggle:hover {
  transform: translateY(-2px);

  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.16),
    inset 0 1px 1px rgba(255, 255, 255, 0.25);
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

@media (max-width: 768px) {
  .theme-toggle {
    top: 18px;
    right: 18px;

    padding: 8px 11px;
  }

  .theme-toggle-label {
    display: none;
  }
}
</style>