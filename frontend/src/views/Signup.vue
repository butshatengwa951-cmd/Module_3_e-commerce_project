<script setup>
import { onMounted, reactive, ref } from "vue";
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

const successMessage = ref("");
const errorMessage = ref("");

const leaving = ref(false);

const form = reactive({
  full_name: "",
  email: "",
  password: "",
  phone_number: "",
  stokvel_name: "",
});

const loadStokvels = async () => {
  loadingStokvels.value = true;
  errorMessage.value = "";

  try {
    const data = await getStokvels();

    if (data.success) {
      stokvels.value = data.stokvels;
    } else {
      errorMessage.value = "Could not load stokvels.";
    }
  } catch (error) {
    console.error("Failed to load stokvels:", error);

    errorMessage.value = "Could not connect to the server.";
  } finally {
    loadingStokvels.value = false;
  }
};

const handleSubmit = async () => {
  successMessage.value = "";
  errorMessage.value = "";
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
      successMessage.value = data.message;

      form.full_name = "";
      form.email = "";
      form.password = "";
      form.phone_number = "";
      form.stokvel_name = "";
    } else {
      errorMessage.value = data.message || "Signup failed.";
    }
  } catch (error) {
    console.error("Signup request failed:", error);

    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = "Could not connect to the server.";
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
</script>

<template>
  <main
    class="signup-page"
    :class="{
      'signup-page-dark': isDark,
      'is-leaving': leaving,
    }"
  >
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

    <!-- StockWell branding -->
    <header class="page-brand">
      <div class="brand-mark">
        <svg
          viewBox="0 0 40 40"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 20.5C11 15.253 15.253 11 20.5 11H29"
            fill="none"
            stroke="currentColor"
            stroke-width="3.5"
            stroke-linecap="round"
          />

          <path
            d="M29 19.5C29 24.747 24.747 29 19.5 29H11"
            fill="none"
            stroke="currentColor"
            stroke-width="3.5"
            stroke-linecap="round"
          />

          <circle cx="29" cy="11" r="2.5" fill="currentColor" />

          <circle cx="11" cy="29" r="2.5" fill="currentColor" />
        </svg>
      </div>

      <span>StockWell</span>
    </header>

    <!-- Signup glass card -->
    <GlassCard :variant="isDark ? 'dark' : 'light'">
      <div class="signup-content">
        <p class="eyebrow">Join the community</p>

        <h1>Create Your Account</h1>

        <p class="intro">
          Start your StockWell journey and choose the stokvel that fits you.
        </p>

        <form @submit.prevent="handleSubmit">
          <!-- Full Name -->
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

          <!-- Email -->
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

          <!-- Password -->
          <div class="field">
            <label for="password"> Password </label>

            <input
              id="password"
              v-model="form.password"
              type="password"
              minlength="8"
              autocomplete="new-password"
              required
              placeholder="Minimum 8 characters"
            />
          </div>

          <!-- Phone Number -->
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

          <!-- Stokvel -->
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

          <!-- Submit -->
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

        <!-- Success -->
        <p v-if="successMessage" class="status-message success-message">
          {{ successMessage }}
        </p>

        <!-- Error -->
        <p v-if="errorMessage" class="status-message error-message">
          {{ errorMessage }}
        </p>

        <!-- Login -->
        <p class="bottom-link">
          Already have an account?

          <router-link to="/login"> Login </router-link>
        </p>
      </div>
    </GlassCard>

    <!-- Footer -->
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

  background: linear-gradient(135deg, #f7f5f1 0%, #f3eee8 48%, #f0e8e2 100%);

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
   SIGNUP BACKGROUND SYSTEM
   ========================================================= */

.signup-page :deep(.page-background) {
  z-index: 0;
}

.signup-page :deep(.background-orb) {
  opacity: 0.28;

  filter: blur(90px);

  transition:
    opacity var(--sw-transition-slow),
    filter var(--sw-transition-slow);
}

.signup-page :deep(.orb-gold) {
  width: 34vw;
  height: 34vw;

  top: -10%;
  left: -8%;

  background: var(--sw-gold-500);
}

.signup-page :deep(.orb-orange) {
  width: 30vw;
  height: 30vw;

  top: 12%;
  right: -8%;

  background: var(--sw-orange-600);
}

.signup-page :deep(.orb-purple) {
  width: 38vw;
  height: 38vw;

  bottom: -18%;
  left: 18%;

  background: var(--sw-purple-700);
}

.signup-page :deep(.orb-lavender) {
  width: 25vw;
  height: 25vw;

  bottom: 6%;
  right: 16%;

  background: var(--sw-lavender-500);
}

.signup-page :deep(.page-grain) {
  opacity: 0.07;

  mix-blend-mode: soft-light;
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

  border: 1px solid var(--sw-input-border);

  border-radius: var(--sw-radius-pill);

  background: rgba(255, 255, 255, 0.3);

  color: var(--sw-purple-900);

  box-shadow:
    0 12px 30px rgba(49, 43, 80, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.45);

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
    color 300ms ease,
    opacity 300ms ease;
}

.back-auth-button:hover:not(:disabled) {
  transform: translateY(-3px);

  background: rgba(255, 255, 255, 0.46);

  box-shadow:
    0 18px 40px rgba(49, 43, 80, 0.14),
    inset 0 1px 1px rgba(255, 255, 255, 0.55);
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

  transition: color var(--sw-transition);
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
}

h1 {
  margin: 0;

  color: var(--sw-page-text);

  font-size: var(--sw-heading-lg);

  line-height: 1;

  letter-spacing: -0.06em;

  transition: color var(--sw-transition);
}

.intro {
  margin: var(--sw-space-3) 0 var(--sw-space-10);

  color: var(--sw-page-text-soft);

  font-size: var(--sw-text-lg);

  line-height: 1.7;

  transition: color var(--sw-transition);
}

/* =========================================================
   FORM FIELDS
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

  transition: color var(--sw-transition);
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

.field input:focus,
.field select:focus {
  border-color: var(--sw-focus);

  background: var(--sw-input-background-focus);

  box-shadow: 0 0 0 4px var(--sw-focus-ring);

  transform: translateY(-1px);
}

.field select:disabled {
  cursor: wait;

  opacity: 0.65;
}

/* =========================================================
   BUTTON
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
    opacity var(--sw-transition);
}

.signup-submit:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow: var(--sw-button-shadow);
}

.signup-submit:active:not(:disabled) {
  transform: translateY(0);
}

.signup-submit:disabled {
  cursor: not-allowed;

  opacity: 0.6;
}

/* =========================================================
   STATUS MESSAGES
   ========================================================= */

.status-message {
  margin: var(--sw-space-6) 0 0;

  font-size: var(--sw-text-base);

  line-height: 1.6;
}

.success-message {
  color: var(--sw-page-text);
}

.error-message {
  color: var(--sw-red-600);
}

/* =========================================================
   LOGIN LINK
   ========================================================= */

.bottom-link {
  margin: var(--sw-space-10) 0 0;

  text-align: center;

  color: var(--sw-page-text-muted);

  font-size: var(--sw-text-md);

  transition: color var(--sw-transition);
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

.page-footer {
  position: absolute;

  left: var(--sw-space-11);
  bottom: var(--sw-space-6);

  color: var(--sw-page-text);

  font-size: var(--sw-text-xs);

  letter-spacing: 0.12em;

  opacity: 0.55;

  transition: color var(--sw-transition);
}

/* =========================================================
   DARK MODE
   ========================================================= */

.signup-page-dark {
  background: linear-gradient(135deg, #15121b 0%, #1d1825 48%, #24191b 100%);

  color: var(--sw-off-white);
}

.signup-page-dark :deep(.background-orb) {
  opacity: 0.2;

  filter: blur(100px);
}

.signup-page-dark :deep(.orb-gold) {
  opacity: 0.18;
}

.signup-page-dark :deep(.orb-orange) {
  opacity: 0.2;
}

.signup-page-dark :deep(.orb-purple) {
  opacity: 0.24;
}

.signup-page-dark :deep(.orb-lavender) {
  opacity: 0.18;
}

.signup-page-dark :deep(.page-grain) {
  opacity: 0.12;
}

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
  h1,
  .intro,
  .field label,
  .field input,
  .field select,
  .bottom-link,
  .page-footer,
  .signup-page :deep(.background-orb) {
    transition: none !important;
  }
}
</style>
