<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import GlassCard from "../components/GlassCard.vue";
import PageBackground from "../components/PageBackground.vue";
import { login } from "../services/api.js";
import { useTheme } from "../composables/useTheme.js";

const router = useRouter();
const { isDark } = useTheme();

const email = ref("");
const password = ref("");

const message = ref("");
const error = ref("");

const loading = ref(false);
const leaving = ref(false);

const handleLogin = async () => {
  message.value = "";
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Email and password are required.";

    return;
  }

  loading.value = true;

  try {
    const response = await login({
      email: email.value,
      password: password.value,
    });

    if (response.success) {
      message.value = response.message;

      localStorage.setItem("token", response.token);

      localStorage.setItem("user", JSON.stringify(response.user));

      localStorage.setItem("stokvel", JSON.stringify(response.stokvel));

      console.log("Logged in user:", response.user);
      console.log("User Stokvel:", response.stokvel);
    } else {
      error.value = response.message;
    }
  } catch (err) {
    console.error("Login error:", err);

    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = "Unable to connect to the server.";
    }
  } finally {
    loading.value = false;
  }
};

const goBackToAuth = () => {
  if (leaving.value) {
    return;
  }

  leaving.value = true;

  setTimeout(() => {
    router.push("/");
  }, 450);
};
</script>

<template>
  <main class="login-page" :class="{ 'is-leaving': leaving }">
    <PageBackground />

    <!-- Back to Auth -->
    <button
      type="button"
      class="back-auth-button"
      :disabled="leaving"
      aria-label="Back to authentication selection"
      @click="goBackToAuth"
    >
      <span class="back-arrow" aria-hidden="true"> ← </span>

      <span> Back to Auth </span>
    </button>

    <!-- Branding -->
    <header class="page-brand">
      <div class="brand-mark">
        <svg
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 27.5
               L17 18.5
               C20 15.5 24.5 15.5 27.5 18.5
               L32 23
               L36.5 18.5
               C39.5 15.5 44 15.5 47 18.5
               L56 27.5"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <path
            d="M10 29
               L19 38
               C21 40 24 40 26 38
               L32 32
               L38 38
               C40 40 43 40 45 38
               L54 29"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <path
            d="M26 38
               L30 42
               C32 44 35 44 37 42
               L42 37"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
          />

          <path
            d="M15 25 L24 34"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
          />

          <path
            d="M49 25 L40 34"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <span>LOGIN to StockWell</span>
    </header>

    <!-- Glass Login Card -->
    <GlassCard :variant="isDark ? 'dark' : 'light'">
      <div class="login-content">
        <span class="eyebrow"> Welcome back </span>

        <h1>Login</h1>

        <p class="intro">Continue your StockWell journey.</p>

        <form @submit.prevent="handleLogin">
          <div class="field">
            <label for="email"> Email </label>

            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="field">
            <label for="password"> Password </label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
          </div>

          <div class="forgot">
            <router-link to="/forgot-password">
              Forgot your password?
            </router-link>
          </div>

          <button type="submit" :disabled="loading" class="login-submit">
            <span v-if="!loading"> Login </span>

            <span v-else> Logging in... </span>
          </button>
        </form>

        <p v-if="message" class="success-message">
          {{ message }}
        </p>

        <p v-if="error" class="error-message">
          {{ error }}
        </p>

        <div class="bottom-link">
          <span> Don't have an account? </span>

          <router-link to="/signup"> Sign up </router-link>
        </div>
      </div>
    </GlassCard>

    <footer>Save · Grow · Together</footer>
  </main>
</template>

<style scoped>
/* =========================================================
   PAGE
   ========================================================= */

.login-page {
  position: relative;

  min-height: 100vh;

  overflow: hidden;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: var(--sw-space-14) var(--sw-space-7);

  background: var(--sw-page-gradient);

  color: var(--sw-white);

  font-family: var(--sw-font-body);

  box-sizing: border-box;

  transition:
    opacity 450ms ease,
    transform 450ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 450ms ease;
}

.login-page.is-leaving {
  opacity: 0;

  transform: translateY(24px) scale(0.98);

  filter: blur(8px);

  pointer-events: none;
}

/* =========================================================
   BACK TO AUTH
   ========================================================= */

.back-auth-button {
  position: absolute;

  right: var(--sw-space-11);
  bottom: var(--sw-space-6);

  z-index: 30;

  display: inline-flex;

  align-items: center;

  gap: var(--sw-space-2);

  padding: var(--sw-space-3) var(--sw-space-5);

  border: 1px solid var(--sw-glass-light-border);

  border-radius: var(--sw-radius-pill);

  background: var(--sw-glass-light);

  color: var(--sw-white);

  box-shadow: var(--sw-glass-shadow-light);

  backdrop-filter: blur(var(--sw-glass-blur))
    saturate(var(--sw-glass-saturation));

  -webkit-backdrop-filter: blur(var(--sw-glass-blur))
    saturate(var(--sw-glass-saturation));

  font-family: inherit;

  font-size: var(--sw-text-sm);

  font-weight: 700;

  letter-spacing: 0.04em;

  cursor: pointer;

  transition:
    transform 300ms ease,
    background 300ms ease,
    box-shadow 300ms ease,
    opacity 300ms ease;
}

.back-auth-button:hover:not(:disabled) {
  transform: translateY(-3px);

  box-shadow: var(--sw-glass-shadow-light-hover);
}

.back-auth-button:active:not(:disabled) {
  transform: translateY(0);
}

.back-auth-button:disabled {
  cursor: default;

  opacity: 0.55;
}

.back-arrow {
  font-size: 1rem;

  transition: transform 300ms ease;
}

.back-auth-button:hover:not(:disabled) .back-arrow {
  transform: translateX(-3px);
}

/* =========================================================
   BRAND
   ========================================================= */

.page-brand {
  position: absolute;

  top: var(--sw-space-9);
  left: var(--sw-space-11);

  z-index: 20;

  display: flex;

  align-items: center;

  gap: var(--sw-space-3);

  font-weight: 700;

  font-size: var(--sw-text-xl);

  letter-spacing: 0.02em;
}

.brand-mark {
  width: 30px;
  height: 30px;

  display: flex;

  align-items: center;
  justify-content: center;
}

.brand-mark svg {
  width: 100%;
  height: 100%;
}

/* =========================================================
   CONTENT
   ========================================================= */

.login-content {
  display: flex;

  flex-direction: column;

  align-items: stretch;
}

.eyebrow {
  margin: 0 0 var(--sw-space-3);

  font-size: var(--sw-text-sm);

  letter-spacing: 0.18em;

  text-transform: uppercase;

  color: var(--sw-page-text-muted);
}

h1 {
  margin: 0;

  font-size: var(--sw-heading-xl);

  line-height: 1;

  letter-spacing: -0.06em;

  color: var(--sw-page-text);
}

.intro {
  margin: var(--sw-space-3) 0 var(--sw-space-12);

  color: var(--sw-page-text-soft);

  font-size: var(--sw-text-lg);

  line-height: 1.7;
}

/* =========================================================
   FIELDS
   ========================================================= */

.field {
  margin-bottom: var(--sw-space-7);
}

.field label {
  display: block;

  margin-bottom: var(--sw-space-2);

  font-size: var(--sw-text-md);

  font-weight: 700;

  letter-spacing: 0.08em;

  color: var(--sw-page-text);
}

.field input {
  width: 100%;

  box-sizing: border-box;

  padding: var(--sw-space-4) var(--sw-space-5);

  border: 1px solid var(--sw-input-border);

  border-radius: var(--sw-radius-md);

  outline: none;

  background: var(--sw-input-background);

  color: var(--sw-input-text);

  font-family: inherit;

  font-size: var(--sw-text-base);

  transition:
    border-color var(--sw-transition),
    background var(--sw-transition),
    box-shadow var(--sw-transition),
    transform var(--sw-transition);
}

.field input::placeholder {
  color: var(--sw-placeholder);
}

.field input:focus {
  border-color: var(--sw-focus);

  background: var(--sw-input-background-focus);

  box-shadow: 0 0 0 4px var(--sw-focus-ring);

  transform: translateY(-1px);
}

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

.forgot {
  margin-top: -6px;

  margin-bottom: var(--sw-space-9);

  text-align: right;
}

.forgot a {
  font-size: var(--sw-text-sm);

  color: var(--sw-purple-700);

  text-decoration: none;
}

.forgot a:hover {
  text-decoration: underline;
}

/* =========================================================
   BUTTON
   ========================================================= */

.login-submit {
  width: 100%;

  padding: 15px;

  border: none;

  border-radius: var(--sw-radius-pill);

  background: var(--sw-button-gradient);

  color: var(--sw-white);

  font-family: inherit;

  font-size: var(--sw-text-base);

  font-weight: 700;

  letter-spacing: 0.05em;

  cursor: pointer;

  transition:
    transform var(--sw-transition),
    box-shadow var(--sw-transition),
    opacity var(--sw-transition);
}

.login-submit:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow: var(--sw-button-shadow);
}

.login-submit:active:not(:disabled) {
  transform: translateY(0);
}

.login-submit:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

/* =========================================================
   MESSAGES
   ========================================================= */

.success-message {
  margin-top: var(--sw-space-6);

  color: var(--sw-page-text);

  font-size: var(--sw-text-base);
}

.error-message {
  margin-top: var(--sw-space-6);

  color: var(--sw-red-600);

  font-size: var(--sw-text-base);
}

/* =========================================================
   BOTTOM LINK
   ========================================================= */

.bottom-link {
  margin-top: var(--sw-space-10);

  text-align: center;

  font-size: var(--sw-text-md);

  color: var(--sw-page-text-muted);
}

.bottom-link a {
  margin-left: var(--sw-space-1);

  color: var(--sw-page-text);

  font-weight: 700;

  text-decoration: none;
}

.bottom-link a:hover {
  text-decoration: underline;
}

/* =========================================================
   FOOTER
   ========================================================= */

footer {
  position: absolute;

  left: var(--sw-space-11);
  bottom: var(--sw-space-6);

  color: var(--sw-white);

  font-size: var(--sw-text-xs);

  letter-spacing: 0.12em;

  opacity: 0.55;
}

/* =========================================================
   DARK MODE
   ========================================================= */

:global(html.dark-mode) .back-auth-button {
  border-color: var(--sw-glass-dark-border);

  background: var(--sw-glass-dark);

  color: var(--sw-glass-dark-text);

  box-shadow: var(--sw-glass-shadow-dark);
}

:global(html.dark-mode) .back-auth-button:hover:not(:disabled) {
  box-shadow: var(--sw-glass-shadow-dark-hover);
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {
  .login-page {
    padding: var(--sw-space-14) var(--sw-space-5);
  }

  .page-brand {
    top: var(--sw-space-7);
    left: var(--sw-space-7);
  }

  .back-auth-button {
    right: var(--sw-space-7);
    bottom: var(--sw-space-6);

    padding: var(--sw-space-2) var(--sw-space-4);

    font-size: 0.62rem;
  }

  h1 {
    font-size: clamp(2.6rem, 12vw, var(--sw-heading-xl));
  }

  footer {
    left: var(--sw-space-7);
    bottom: var(--sw-space-6);

    max-width: 45%;
  }
}

/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .login-page,
  .back-auth-button,
  .back-arrow {
    transition: none !important;
  }
}
</style>
