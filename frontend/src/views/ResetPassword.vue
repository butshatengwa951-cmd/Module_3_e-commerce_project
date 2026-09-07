<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import GlassCard from "../components/GlassCard.vue";
import PageBackground from "../components/PageBackground.vue";
import { resetPassword, verifyResetToken } from "../services/api.js";
import { useTheme } from "../composables/useTheme.js";

const route = useRoute();
const router = useRouter();

const { isDark } = useTheme();

const token = ref(route.query.token || "");

const password = ref("");
const confirmPassword = ref("");

const message = ref("");
const error = ref("");

const loading = ref(false);

const verifying = ref(true);
const tokenValid = ref(false);

const handleResetPassword = async () => {
  message.value = "";
  error.value = "";

  if (!tokenValid.value) {
    error.value = "This password reset link is invalid or has expired.";

    return;
  }

  if (!password.value || !confirmPassword.value) {
    error.value = "Please enter and confirm your new password.";

    return;
  }

  if (password.value.length < 8) {
    error.value = "Password must be at least 8 characters long.";

    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";

    return;
  }

  loading.value = true;

  try {
    const response = await resetPassword({
      token: token.value,
      password: password.value,
      confirm_password: confirmPassword.value,
    });

    if (response.success) {
      message.value = response.message;

      password.value = "";
      confirmPassword.value = "";

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      error.value = response.message;
    }
  } catch (err) {
    console.error("Reset password error:", err);

    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = "Unable to connect to the server.";
    }
  } finally {
    loading.value = false;
  }
};

const verifyToken = async () => {
  if (!token.value) {
    error.value = "This password reset link is invalid or has expired.";

    verifying.value = false;

    return;
  }

  try {
    const response = await verifyResetToken(token.value);

    if (response.success) {
      tokenValid.value = true;
    } else {
      error.value = response.message;
    }
  } catch (err) {
    console.error("Token verification error:", err);

    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else {
      error.value = "This password reset link is invalid or has expired.";
    }
  } finally {
    verifying.value = false;
  }
};

onMounted(() => {
  verifyToken();
});
</script>

<template>
  <main class="reset-password-page">
    <PageBackground />

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

      <span>RESET PASSWORD · StockWell</span>
    </header>

    <!-- Glass Card -->
    <GlassCard :variant="isDark ? 'dark' : 'light'">
      <div class="reset-password-content">
        <span class="eyebrow"> Account recovery </span>

        <template v-if="verifying">
          <h1>Checking Link</h1>

          <p class="intro">
            Please wait while we verify your password reset link.
          </p>

          <div class="loading-state">
            <span class="loading-dot"></span>

            <span> Verifying reset link... </span>
          </div>
        </template>

        <template v-else>
          <h1>Reset Password</h1>

          <p class="intro">Create a new password for your StockWell account.</p>

          <form v-if="tokenValid" @submit.prevent="handleResetPassword">
            <div class="field">
              <label for="password"> New Password </label>

              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Enter your new password"
                autocomplete="new-password"
                minlength="8"
                required
              />
            </div>

            <div class="field">
              <label for="confirmPassword"> Confirm Password </label>

              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                autocomplete="new-password"
                minlength="8"
                required
              />
            </div>

            <p class="password-hint">
              Password must be at least 8 characters long.
            </p>

            <button type="submit" :disabled="loading">
              <span v-if="!loading"> Reset Password </span>

              <span v-else> Resetting... </span>
            </button>
          </form>

          <div v-else class="invalid-state">
            <div class="invalid-icon">!</div>

            <h2>Link Unavailable</h2>

            <p>This password reset link is invalid or has expired.</p>

            <router-link class="recovery-link" to="/forgot-password">
              Request a new reset link
            </router-link>
          </div>
        </template>

        <p v-if="message" class="success-message">
          {{ message }}
        </p>

        <p v-if="error && tokenValid" class="error-message">
          {{ error }}
        </p>

        <div class="bottom-link">
          <span> Remember your password? </span>

          <router-link to="/login"> Login </router-link>
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

.reset-password-page {
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

.reset-password-content {
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
   LOADING STATE
   ========================================================= */

.loading-state {
  display: flex;

  align-items: center;
  justify-content: center;

  gap: var(--sw-space-3);

  padding: var(--sw-space-6) 0;

  color: var(--sw-page-text-muted);

  font-size: var(--sw-text-md);
}

.loading-dot {
  width: 10px;
  height: 10px;

  border-radius: 50%;

  background: var(--sw-orange-600);

  animation: loadingPulse 1.2s ease-in-out infinite;
}

@keyframes loadingPulse {
  0%,
  100% {
    opacity: 0.35;

    transform: scale(0.8);
  }

  50% {
    opacity: 1;

    transform: scale(1);
  }
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
   PASSWORD HINT
   ========================================================= */

.password-hint {
  margin: calc(var(--sw-space-4) * -1) 0 var(--sw-space-8);

  color: var(--sw-page-text-muted);

  font-size: var(--sw-text-sm);

  line-height: 1.6;
}

/* =========================================================
   BUTTON
   ========================================================= */

button {
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

button:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow: var(--sw-button-shadow);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

/* =========================================================
   INVALID LINK STATE
   ========================================================= */

.invalid-state {
  text-align: center;

  padding: 0 var(--sw-space-2);
}

.invalid-icon {
  width: 50px;
  height: 50px;

  margin: 0 auto var(--sw-space-5);

  display: flex;

  align-items: center;
  justify-content: center;

  border: 2px solid var(--sw-red-600);

  border-radius: 50%;

  color: var(--sw-red-600);

  font-size: 1.5rem;

  font-weight: 700;
}

.invalid-state h2 {
  margin: 0 0 var(--sw-space-3);

  color: var(--sw-page-text);

  font-size: var(--sw-heading-md);
}

.invalid-state p {
  margin: 0 0 var(--sw-space-5);

  color: var(--sw-page-text-soft);

  line-height: 1.7;
}

.recovery-link {
  color: var(--sw-purple-700);

  font-size: var(--sw-text-sm);

  font-weight: 700;

  text-decoration: none;
}

.recovery-link:hover {
  text-decoration: underline;
}

/* =========================================================
   MESSAGES
   ========================================================= */

.success-message {
  margin-top: var(--sw-space-6);

  color: var(--sw-page-text);

  font-size: var(--sw-text-base);

  line-height: 1.6;
}

.error-message {
  margin-top: var(--sw-space-6);

  color: var(--sw-red-600);

  font-size: var(--sw-text-base);

  line-height: 1.6;
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

  bottom: 25px;
  left: var(--sw-space-11);

  font-size: var(--sw-text-xs);

  letter-spacing: 0.12em;

  opacity: 0.55;
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {
  .reset-password-page {
    padding: var(--sw-space-14) var(--sw-space-5);
  }

  .page-brand {
    top: var(--sw-space-7);

    left: var(--sw-space-7);
  }

  h1 {
    font-size: clamp(2.4rem, 11vw, var(--sw-heading-xl));
  }

  .intro {
    font-size: var(--sw-text-base);
  }

  footer {
    left: var(--sw-space-7);

    bottom: var(--sw-space-6);
  }
}
</style>
