<script setup>
import { onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";

import GlassCard from "../components/GlassCard.vue";
import PageBackground from "../components/PageBackground.vue";

import { forgotPassword } from "../services/api.js";
import { useTheme } from "../composables/useTheme.js";

const router = useRouter();

const { isDark } = useTheme();

const email = ref("");
const loading = ref(false);
const leaving = ref(false);

const notification = ref({
  visible: false,
  type: "",
  title: "",
  message: "",
});

let notificationTimer = null;

const showNotification = (type, title, message) => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  notification.value = {
    visible: true,
    type,
    title,
    message,
  };

  notificationTimer = setTimeout(() => {
    closeNotification();
  }, 4500);
};

const closeNotification = () => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);

    notificationTimer = null;
  }

  notification.value.visible = false;
};

const handleForgotPassword = async () => {
  closeNotification();

  if (!email.value) {
    showNotification(
      "error",
      "Reset request unsuccessful",
      "Email is required.",
    );

    return;
  }

  loading.value = true;

  try {
    const response = await forgotPassword(email.value);

    if (response.success) {
      showNotification(
        "success",
        "Reset link sent",
        response.message ||
          "Check your email for instructions to reset your password.",
      );
    } else {
      showNotification(
        "error",
        "Reset request unsuccessful",
        response.message || "Unable to process your password reset request.",
      );
    }
  } catch (err) {
    console.error("Forgot password error:", err);

    if (err.response?.data?.message) {
      showNotification(
        "error",
        "Reset request unsuccessful",
        err.response.data.message,
      );
    } else {
      showNotification(
        "error",
        "Connection error",
        "Unable to connect to the server.",
      );
    }
  } finally {
    loading.value = false;
  }
};

const goBackToLogin = () => {
  if (leaving.value) {
    return;
  }

  leaving.value = true;

  setTimeout(() => {
    router.push("/login");
  }, 450);
};

onBeforeUnmount(() => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }
});
</script>

<template>
  <main
    class="forgot-password-page"
    :class="{
      'is-leaving': leaving,
    }"
  >
    <PageBackground />

    <!-- ==================================================
         GLASS NOTIFICATION
         ================================================== -->

    <Transition name="notification">
      <div
        v-if="notification.visible"
        class="notification"
        :class="[
          `notification-${notification.type}`,
          {
            'notification-dark': isDark,
          },
        ]"
        role="alert"
        aria-live="polite"
      >
        <div class="notification-icon">
          <svg
            v-if="notification.type === 'success'"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />

            <path d="M7.5 12.5l3 3 6-6" />
          </svg>

          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />

            <path d="M12 8v5" />

            <circle
              cx="12"
              cy="16.5"
              r="0.8"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </div>

        <div class="notification-content">
          <strong>
            {{ notification.title }}
          </strong>

          <span>
            {{ notification.message }}
          </span>
        </div>

        <button
          type="button"
          class="notification-close"
          aria-label="Close notification"
          title="Close notification"
          @click="closeNotification"
        >
          ×
        </button>
      </div>
    </Transition>

    <!-- ==================================================
         BACK TO LOGIN
         ================================================== -->

    <button
      type="button"
      class="back-auth-button"
      :disabled="leaving"
      aria-label="Return to login"
      @click="goBackToLogin"
    >
      <span class="back-arrow" aria-hidden="true"> ← </span>

      <span> Back to Login </span>
    </button>

    <!-- ==================================================
         BRANDING
         ================================================== -->

    <header class="page-brand">
      <div class="brand-mark">
        <span class="brand-handshake" aria-hidden="true"> 🤝 </span>
      </div>

      <span> FORGOT PASSWORD · StockWell </span>
    </header>

    <!-- ==================================================
         GLASS CARD
         ================================================== -->

    <GlassCard :variant="isDark ? 'dark' : 'light'">
      <div class="forgot-password-content">
        <span class="eyebrow"> Account recovery </span>

        <h1>Forgot Password?</h1>

        <p class="intro">
          Enter the email address associated with your StockWell account and
          we'll help you get back in.
        </p>

        <form @submit.prevent="handleForgotPassword">
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

          <button type="submit" class="reset-submit" :disabled="loading">
            <span v-if="!loading"> Send Reset Link </span>

            <span v-else> Sending... </span>
          </button>
        </form>

        <div class="bottom-link">
          <span> Remember your password? </span>

          <router-link to="/login"> Login </router-link>
        </div>
      </div>
    </GlassCard>

    <!-- ==================================================
         FOOTER
         ================================================== -->

    <footer>Save · Grow · Together</footer>
  </main>
</template>

<style scoped>
/* =========================================================
   PAGE
   ========================================================= */

.forgot-password-page {
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

.forgot-password-page.is-leaving {
  opacity: 0;

  transform: translateY(24px) scale(0.98);

  filter: blur(8px);

  pointer-events: none;
}

.forgot-password-page :deep(.page-gradient) {
  opacity: 0.94;

  background:
    radial-gradient(
      circle at 18% 18%,
      rgba(255, 214, 120, 0.22),
      transparent 22%
    ),
    radial-gradient(
      circle at 72% 42%,
      rgba(170, 124, 230, 0.18),
      transparent 28%
    ),
    radial-gradient(
      circle at 82% 72%,
      rgba(255, 155, 96, 0.14),
      transparent 20%
    ),
    linear-gradient(
      135deg,
      rgba(249, 244, 236, 1) 0%,
      rgba(255, 248, 242, 0.9) 26%,
      rgba(247, 235, 250, 0.94) 100%
    );

  filter: saturate(1.2) brightness(1.06);

  animation-duration: 18s;
}

.forgot-password-page :deep(.background-orb) {
  opacity: 0.5;

  filter: blur(72px) saturate(1.25);

  animation-duration: 14s;
  animation-timing-function: ease-in-out;
}

/* =========================================================
   NOTIFICATION
   ========================================================= */

.notification {
  position: fixed;

  top: 82px;

  left: 32px;

  z-index: 100;

  width: min(360px, calc(100vw - 64px));

  display: flex;

  align-items: flex-start;

  gap: 14px;

  padding: 16px 18px;

  border: 1px solid rgba(255, 255, 255, 0.35);

  border-radius: 20px;

  background: rgba(255, 255, 255, 0.14);

  box-shadow:
    0 18px 55px rgba(49, 43, 80, 0.24),
    inset 0 1px 1px rgba(255, 255, 255, 0.35);

  backdrop-filter: blur(24px) saturate(145%);

  -webkit-backdrop-filter: blur(24px) saturate(145%);

  color: var(--sw-white);

  pointer-events: auto;
}

.notification-success {
  box-shadow:
    0 18px 55px rgba(49, 43, 80, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.notification-error {
  box-shadow:
    0 18px 55px rgba(163, 60, 45, 0.25),
    inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.notification-icon {
  width: 38px;

  height: 38px;

  flex: 0 0 38px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 13px;

  background: rgba(255, 255, 255, 0.15);
}

.notification-success .notification-icon {
  color: var(--sw-gold-500);
}

.notification-error .notification-icon {
  color: #ffb3a6;
}

.notification-icon svg {
  width: 21px;

  height: 21px;

  fill: none;

  stroke: currentColor;

  stroke-width: 1.8;

  stroke-linecap: round;

  stroke-linejoin: round;
}

.notification-content {
  min-width: 0;

  flex: 1;

  display: flex;

  flex-direction: column;

  gap: 4px;

  padding-top: 1px;
}

.notification-content strong {
  font-size: 0.9rem;

  font-weight: 800;

  letter-spacing: 0.02em;
}

.notification-content span {
  font-size: 0.78rem;

  line-height: 1.5;

  opacity: 0.82;

  overflow-wrap: anywhere;
}

.notification-close {
  flex: 0 0 28px;

  width: 28px;

  height: 28px;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 0;

  border: none;

  border-radius: 50%;

  background: transparent;

  color: currentColor;

  font-size: 1.35rem;

  line-height: 1;

  cursor: pointer;

  opacity: 0.65;

  transition:
    transform 200ms ease,
    opacity 200ms ease,
    background 200ms ease;
}

.notification-close:hover {
  opacity: 1;

  background: rgba(255, 255, 255, 0.1);

  transform: scale(1.06);
}

.notification-close:active {
  transform: scale(0.92);
}

.notification-close:focus-visible {
  outline: 2px solid currentColor;

  outline-offset: 2px;
}

/* =========================================================
   NOTIFICATION TRANSITION
   ========================================================= */

.notification-enter-active,
.notification-leave-active {
  transition:
    opacity 450ms ease,
    transform 550ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 450ms ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;

  transform: translate3d(-28px, -10px, 0) scale(0.96);

  filter: blur(8px);
}

/* =========================================================
   BACK TO LOGIN
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

  color: var(--sw-purple-900);

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

  color: var(--sw-purple-900);
}

.brand-mark {
  width: 30px;

  height: 30px;

  display: flex;

  align-items: center;

  justify-content: center;
}

.brand-handshake {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  width: 100%;

  height: 100%;

  font-size: 1.55rem;

  line-height: 1;

  transition:
    transform 300ms ease,
    filter 300ms ease;
}

.brand-mark:hover .brand-handshake {
  transform: scale(1.08) rotate(-3deg);

  filter: drop-shadow(0 3px 5px rgba(49, 43, 80, 0.18));
}

/* =========================================================
   CONTENT
   ========================================================= */

.forgot-password-content {
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
   FIELD
   ========================================================= */

.field {
  margin-bottom: var(--sw-space-9);
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
   SUBMIT
   ========================================================= */

.reset-submit {
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

.reset-submit:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow: var(--sw-button-shadow);
}

.reset-submit:active:not(:disabled) {
  transform: translateY(0);
}

.reset-submit:disabled {
  opacity: 0.6;

  cursor: not-allowed;
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

  color: var(--sw-purple-900);

  font-size: var(--sw-text-xs);

  letter-spacing: 0.12em;

  opacity: 0.72;
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

:global(html.dark-mode) .notification {
  border-color: rgba(255, 255, 255, 0.16);

  background: rgba(28, 23, 38, 0.58);

  box-shadow:
    0 18px 55px rgba(0, 0, 0, 0.42),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

:global(html.dark-mode) .brand-handshake {
  filter: drop-shadow(0 2px 5px rgba(255, 255, 255, 0.08));
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {
  .forgot-password-page {
    padding: var(--sw-space-14) var(--sw-space-5);
  }

  .page-brand {
    top: var(--sw-space-7);

    left: var(--sw-space-7);

    font-size: var(--sw-text-lg);
  }

  .back-auth-button {
    right: var(--sw-space-7);

    bottom: var(--sw-space-6);

    padding: var(--sw-space-2) var(--sw-space-4);

    font-size: 0.62rem;
  }

  .notification {
    top: 78px;

    left: 18px;

    right: 18px;

    width: auto;

    max-width: 360px;

    padding: 14px 15px;

    border-radius: 18px;
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

/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .forgot-password-page,
  .back-auth-button,
  .back-arrow,
  .brand-handshake,
  .notification,
  .notification-enter-active,
  .notification-leave-active {
    transition: none !important;
  }
}
</style>