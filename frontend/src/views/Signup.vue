<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { getStokvels, signup } from "../services/api.js";

import GlassCard from "../components/GlassCard.vue";
import PageBackground from "../components/PageBackground.vue";

import { useTheme } from "../composables/useTheme.js";

const router = useRouter();

const { isDark } = useTheme();

const stokvels = ref([]);

const loadingStokvels = ref(false);
const submitting = ref(false);

const leaving = ref(false);

const showPassword = ref(false);

const notification = ref({
  visible: false,
  type: "",
  title: "",
  message: "",
});

let notificationTimer = null;

const form = reactive({
  full_name: "",
  email: "",
  password: "",
  phone_number: "",
  stokvel_name: "",
});

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

const loadStokvels = async () => {
  loadingStokvels.value = true;

  try {
    const data = await getStokvels();

    if (data.success) {
      stokvels.value = data.stokvels;
    } else {
      showNotification(
        "error",
        "Unable to load stokvels",
        data.message || "Could not load the available stokvels.",
      );
    }
  } catch (error) {
    console.error("Failed to load stokvels:", error);

    showNotification(
      "error",
      "Connection error",
      "Could not connect to the server.",
    );
  } finally {
    loadingStokvels.value = false;
  }
};

const handleSubmit = async () => {
  closeNotification();

  submitting.value = true;

  try {
    const data = await signup({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      phone_number: form.phone_number,
      stokvel_name: form.stokvel_name,
    });

    if (data.success) {
      showNotification(
        "success",
        "Account created",
        data.message || "Your StockWell account has been created successfully.",
      );

      form.full_name = "";
      form.email = "";
      form.password = "";
      form.phone_number = "";
      form.stokvel_name = "";

      showPassword.value = false;
    } else {
      showNotification(
        "error",
        "Signup unsuccessful",
        data.message || "Unable to create your account.",
      );
    }
  } catch (error) {
    console.error("Signup request failed:", error);

    if (error.response?.data?.message) {
      showNotification(
        "error",
        "Signup unsuccessful",
        error.response.data.message,
      );
    } else {
      showNotification(
        "error",
        "Connection error",
        "Could not connect to the server.",
      );
    }
  } finally {
    submitting.value = false;
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

onMounted(() => {
  loadStokvels();
});

onBeforeUnmount(() => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }
});
</script>

<template>
  <main
    class="signup-page"
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
         BACK TO AUTH
         ================================================== -->

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

    <!-- ==================================================
         BRANDING
         ================================================== -->

    <header class="page-brand">
      <div class="brand-mark">
        <span class="brand-handshake" aria-hidden="true"> 🤝 </span>
      </div>

      <span> SIGN UP to StockWell </span>
    </header>

    <!-- ==================================================
         SIGNUP GLASS CARD
         ================================================== -->

    <GlassCard :variant="isDark ? 'dark' : 'light'">
      <div class="signup-content">
        <p class="eyebrow">Join the community</p>

        <h1>Create Your Account</h1>

        <p class="intro">
          Start your StockWell journey and choose the stokvel that fits you.
        </p>

        <form @submit.prevent="handleSubmit">
          <!-- FULL NAME -->

          <div class="field">
            <label for="full_name"> Full Name </label>

            <input
              id="full_name"
              v-model="form.full_name"
              type="text"
              autocomplete="name"
              required
              placeholder="Enter your full name"
            />
          </div>

          <!-- EMAIL -->

          <div class="field">
            <label for="email"> Email </label>

            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <!-- PASSWORD -->

          <div class="field">
            <label for="password"> Password </label>

            <div class="password-input-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                minlength="8"
                autocomplete="new-password"
                required
                placeholder="Minimum 8 characters"
              />

              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :title="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <svg
                  v-if="!showPassword"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="
                      M2 12
                      C4.5 8
                      8 6
                      12 6
                      C16 6
                      19.5 8
                      22 12
                      C19.5 16
                      16 18
                      12 18
                      C8 18
                      4.5 16
                      2 12
                      Z
                    "
                  />

                  <circle cx="12" cy="12" r="2.5" />
                </svg>

                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" />

                  <path
                    d="
                      M10.6 6.2
                      C11.05 6.07
                      11.52 6
                      12 6
                      C16 6
                      19.5 8
                      22 12
                      C21.25 13.2
                      20.35 14.25
                      19.25 15.15
                    "
                  />

                  <path
                    d="
                      M6.1 6.1
                      C3.7 7.6
                      2.5 9.7
                      2 12
                      C4.5 16
                      8 18
                      12 18
                      C13.65 18
                      15.2 17.6
                      16.6 17
                    "
                  />

                  <path
                    d="
                      M9.9 9.9
                      C8.75 11.05
                      8.75 12.95
                      9.9 14.1
                      C11.05 15.25
                      12.95 15.25
                      14.1 14.1
                    "
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- PHONE -->

          <div class="field">
            <label for="phone_number"> Phone Number </label>

            <input
              id="phone_number"
              v-model="form.phone_number"
              type="tel"
              autocomplete="tel"
              placeholder="Optional"
            />
          </div>

          <!-- STOKVEL -->

          <div class="field">
            <label for="stokvel_name"> Choose Your Stokvel </label>

            <select
              id="stokvel_name"
              v-model="form.stokvel_name"
              required
              :disabled="loadingStokvels"
            >
              <option value="" disabled>
                {{
                  loadingStokvels ? "Loading stokvels..." : "Select a stokvel"
                }}
              </option>

              <option
                v-for="stokvel in stokvels"
                :key="stokvel.stokvel_id"
                :value="stokvel.stokvel_name"
              >
                {{ stokvel.stokvel_name }}
              </option>
            </select>
          </div>

          <!-- SUBMIT -->

          <button
            type="submit"
            class="signup-submit"
            :disabled="submitting || loadingStokvels"
          >
            {{
              submitting ? "Creating Account..." : "Create StockWell Account"
            }}
          </button>
        </form>

        <!-- LOGIN -->

        <p class="bottom-link">
          Already have an account?

          <router-link to="/login"> Login </router-link>
        </p>
      </div>
    </GlassCard>

    <!-- FOOTER -->

    <footer class="page-footer">Save · Grow · Together</footer>
  </main>
</template>

<style scoped>
/* =========================================================
   PAGE
   ========================================================= */

.signup-page {
  position: relative;

  min-height: 100vh;

  overflow: hidden;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: var(--sw-space-14) var(--sw-space-7);

  background:
    radial-gradient(
      circle at 18% 18%,
      rgba(255, 214, 120, 0.18),
      transparent 24%
    ),
    radial-gradient(
      circle at 74% 38%,
      rgba(170, 124, 230, 0.15),
      transparent 28%
    ),
    radial-gradient(
      circle at 80% 72%,
      rgba(255, 155, 96, 0.12),
      transparent 22%
    ),
    linear-gradient(
      135deg,
      rgba(249, 244, 236, 1) 0%,
      rgba(255, 248, 242, 0.94) 35%,
      rgba(247, 235, 249, 0.96) 100%
    );

  color: var(--sw-purple-900);

  font-family: var(--sw-font-body);

  box-sizing: border-box;

  isolation: isolate;

  transition:
    background var(--sw-transition-slow),
    color var(--sw-transition-slow),
    opacity 450ms ease,
    transform 450ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 450ms ease;
}

.signup-page.is-leaving {
  opacity: 0;

  transform: translateY(24px) scale(0.98);

  filter: blur(8px);

  pointer-events: none;
}

/* =========================================================
   BACKGROUND
   ========================================================= */

.signup-page :deep(.page-background) {
  z-index: 0;
}

.signup-page :deep(.page-gradient) {
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

.signup-page :deep(.background-orb) {
  opacity: 0.5;

  filter: blur(72px) saturate(1.25);

  animation-duration: 14s;
  animation-timing-function: ease-in-out;

  transition:
    opacity var(--sw-transition-slow),
    filter var(--sw-transition-slow);
}

.signup-page :deep(.orb-gold) {
  width: 20vw;

  height: 20vw;

  top: 8%;

  left: 12%;

  background: var(--sw-gold-500);

  animation-name: signupOrbGold;
}

.signup-page :deep(.orb-orange) {
  width: 16vw;

  height: 16vw;

  top: 22%;

  right: 10%;

  background: var(--sw-orange-600);

  animation-name: signupOrbOrange;
}

.signup-page :deep(.orb-purple) {
  width: 22vw;

  height: 22vw;

  bottom: 8%;

  left: 24%;

  background: var(--sw-purple-700);

  animation-name: signupOrbPurple;
}

.signup-page :deep(.orb-lavender) {
  width: 15vw;

  height: 15vw;

  bottom: 16%;

  right: 16%;

  background: var(--sw-lavender-500);

  animation-name: signupOrbLavender;
}

.signup-page :deep(.page-grain) {
  opacity: 0.08;

  mix-blend-mode: soft-light;
}

@keyframes signupOrbGold {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(5%, 7%, 0) scale(1.12);
  }
}

@keyframes signupOrbOrange {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-6%, 9%, 0) scale(1.13);
  }
}

@keyframes signupOrbPurple {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(7%, -8%, 0) scale(1.1);
  }
}

@keyframes signupOrbLavender {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-4%, -6%, 0) scale(1.08);
  }
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

  transition:
    background var(--sw-transition-slow),
    border-color var(--sw-transition-slow),
    color var(--sw-transition-slow),
    box-shadow var(--sw-transition-slow);
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

  transition: background var(--sw-transition-slow);
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
    transform var(--sw-transition-fast),
    opacity var(--sw-transition-fast),
    background var(--sw-transition-fast);
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

  transform: translate3d(42px, -12px, 0) scale(0.96);

  filter: blur(8px);
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
    background var(--sw-transition-slow),
    border-color var(--sw-transition-slow),
    color var(--sw-transition-slow),
    box-shadow var(--sw-transition-slow),
    opacity 300ms ease;
}

.back-auth-button:hover:not(:disabled) {
  transform: translateY(-3px);

  background: var(--sw-input-background-focus);

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

  font-size: var(--sw-text-xl);

  font-weight: 700;

  letter-spacing: 0.02em;

  color: var(--sw-purple-900);

  transition: color var(--sw-transition-slow);
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

.signup-content {
  display: flex;

  flex-direction: column;
}

.eyebrow {
  margin: 0 0 var(--sw-space-3);

  font-size: var(--sw-text-sm);

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.18em;

  color: var(--sw-page-text-muted);

  transition: color var(--sw-transition-slow);
}

h1 {
  margin: 0;

  color: var(--sw-page-text);

  font-size: var(--sw-heading-lg);

  line-height: 1;

  letter-spacing: -0.06em;

  transition: color var(--sw-transition-slow);
}

.intro {
  margin: var(--sw-space-3) 0 var(--sw-space-10);

  color: var(--sw-page-text-soft);

  font-size: var(--sw-text-lg);

  line-height: 1.7;

  transition: color var(--sw-transition-slow);
}

/* =========================================================
   FORM
   ========================================================= */

.field {
  margin-bottom: var(--sw-space-6);
}

.field label {
  display: block;

  margin-bottom: var(--sw-space-2);

  color: var(--sw-page-text);

  font-size: var(--sw-text-md);

  font-weight: 700;

  letter-spacing: 0.08em;

  transition: color var(--sw-transition-slow);
}

.field input,
.field select {
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
    transform var(--sw-transition),
    color var(--sw-transition);
}

.field input::placeholder {
  color: var(--sw-placeholder);
}

.field input:focus,
.field select:focus {
  border-color: var(--sw-focus);

  background: var(--sw-input-background-focus);

  box-shadow: 0 0 0 4px var(--sw-focus-ring);

  transform: translateY(-1px);
}

.field input:hover:not(:focus),
.field select:hover:not(:focus) {
  border-color: var(--sw-focus);
}

/* =========================================================
   PASSWORD INPUT
   ========================================================= */

.password-input-wrapper {
  position: relative;

  width: 100%;
}

.password-input-wrapper input {
  padding-right: 56px;
}

.password-toggle {
  position: absolute;

  top: 50%;

  right: 12px;

  width: 34px;

  height: 34px;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 0;

  border: none;

  border-radius: 50%;

  background: transparent;

  color: var(--sw-page-text-muted);

  transform: translateY(-50%);

  cursor: pointer;

  transition:
    background var(--sw-transition-fast),
    color var(--sw-transition-fast),
    transform var(--sw-transition-fast);
}

.password-toggle:hover {
  background: rgba(121, 93, 137, 0.08);

  color: var(--sw-page-text);

  transform: translateY(-50%) scale(1.06);
}

.password-toggle:active {
  transform: translateY(-50%) scale(0.94);
}

.password-toggle:focus-visible {
  outline: 2px solid var(--sw-focus);

  outline-offset: 2px;
}

.password-toggle svg {
  width: 19px;

  height: 19px;

  fill: none;

  stroke: currentColor;

  stroke-width: 1.8;

  stroke-linecap: round;

  stroke-linejoin: round;
}

/* =========================================================
   SELECT
   ========================================================= */

.field select {
  cursor: pointer;

  appearance: none;

  background-image:
    linear-gradient(45deg, transparent 50%, var(--sw-page-text) 50%),
    linear-gradient(135deg, var(--sw-page-text) 50%, transparent 50%);

  background-position:
    calc(100% - 18px) 50%,
    calc(100% - 13px) 50%;

  background-size:
    5px 5px,
    5px 5px;

  background-repeat: no-repeat;

  padding-right: 42px;
}

.field select option {
  background: var(--sw-page-background);

  color: var(--sw-page-text);
}

.field select:disabled {
  cursor: wait;

  opacity: 0.65;
}

/* =========================================================
   SUBMIT
   ========================================================= */

.signup-submit {
  width: 100%;

  margin-top: var(--sw-space-1);

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
    opacity var(--sw-transition),
    filter var(--sw-transition);
}

.signup-submit:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow: var(--sw-button-shadow-hover);

  filter: brightness(1.03);
}

.signup-submit:active:not(:disabled) {
  transform: translateY(0);

  box-shadow: var(--sw-button-shadow);
}

.signup-submit:disabled {
  cursor: not-allowed;

  opacity: 0.6;
}

/* =========================================================
   BOTTOM LINK
   ========================================================= */

.bottom-link {
  margin: var(--sw-space-10) 0 0;

  text-align: center;

  color: var(--sw-page-text-muted);

  font-size: var(--sw-text-md);

  transition: color var(--sw-transition-slow);
}

.bottom-link a {
  margin-left: var(--sw-space-1);

  color: var(--sw-page-text);

  font-weight: 700;

  text-decoration: none;

  transition: color var(--sw-transition-fast);
}

.bottom-link a:hover {
  color: var(--sw-orange-600);

  text-decoration: underline;
}

/* =========================================================
   FOOTER
   ========================================================= */

.page-footer {
  position: absolute;

  left: var(--sw-space-11);

  bottom: var(--sw-space-6);

  color: var(--sw-purple-900);

  font-size: var(--sw-text-xs);

  letter-spacing: 0.12em;

  opacity: 0.72;

  transition:
    color var(--sw-transition-slow),
    opacity var(--sw-transition-slow);
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
  background: var(--sw-input-background-focus);

  box-shadow: var(--sw-glass-shadow-dark-hover);
}

:global(html.dark-mode) .brand-handshake {
  filter: drop-shadow(0 2px 5px rgba(255, 255, 255, 0.08));
}

:global(html.dark-mode) .notification {
  border-color: rgba(255, 255, 255, 0.16);

  background: rgba(28, 23, 38, 0.62);

  color: var(--sw-off-white);

  box-shadow:
    0 18px 55px rgba(0, 0, 0, 0.42),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

:global(html.dark-mode) .notification-error .notification-icon {
  color: #ff9d8c;
}

:global(html.dark-mode) .notification-success .notification-icon {
  color: var(--sw-gold-500);
}

:global(html.dark-mode) .password-toggle:hover {
  background: rgba(155, 134, 167, 0.12);
}

:global(html.dark-mode) .page-footer {
  color: var(--sw-off-white);

  opacity: 0.48;
}

:global(html.dark-mode) .signup-page :deep(.background-orb) {
  opacity: 0.2;

  filter: blur(100px);
}

:global(html.dark-mode) .signup-page :deep(.page-grain) {
  opacity: 0.12;
}

/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {
  .signup-page {
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
    font-size: clamp(2.4rem, 11vw, var(--sw-heading-lg));
  }

  .page-footer {
    left: var(--sw-space-7);

    bottom: var(--sw-space-6);

    max-width: 45%;
  }

  .signup-page :deep(.background-orb) {
    filter: blur(65px);
  }
}

/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .signup-page,
  .back-auth-button,
  .back-arrow,
  .brand-handshake,
  .password-toggle,
  .notification,
  .notification-enter-active,
  .notification-leave-active {
    transition: none !important;
  }
}
</style>