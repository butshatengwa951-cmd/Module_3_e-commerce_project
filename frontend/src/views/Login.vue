<script setup>
import { ref } from "vue";
import GlassCard from "../components/GlassCard.vue";
import { login } from "../services/api.js";
import { useTheme } from "../composables/useTheme.js";
import PageBackground from "../components/PageBackground.vue";

const { isDark } = useTheme();

const email = ref("");
const password = ref("");

const message = ref("");
const error = ref("");

const loading = ref(false);

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
</script>

<template>
  <main class="login-page">
    <!-- Background -->
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

      <span> LOGIN to StockWell </span>
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

          <button type="submit" :disabled="loading">
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
/* ========================================
   PAGE
   ======================================== */

.login-page {
  position: relative;

  min-height: 100vh;

  overflow: hidden;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 80px 20px;

  background: var(--sw-page-gradient);

  color: white;

  font-family: var(--sw-font-body);
}

/* ========================================
   BRAND
   ======================================== */

.page-brand {
  position: absolute;

  top: 28px;
  left: 32px;

  z-index: 20;

  display: flex;

  align-items: center;

  gap: 10px;

  font-weight: 700;

  font-size: 0.95rem;
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

/* ========================================
   ORBS
   ======================================== */

.background-orb {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(80px);

  opacity: 0.45;
}

.orb-one {
  width: 45vw;
  height: 45vw;

  top: -20%;
  left: -15%;

  background: #c8b019;

  animation: loginOrbOne 16s ease-in-out infinite;
}

.orb-two {
  width: 38vw;
  height: 38vw;

  right: -15%;
  top: 15%;

  background: #c2583d;

  animation: loginOrbTwo 19s ease-in-out infinite;
}

.orb-three {
  width: 40vw;
  height: 40vw;

  left: 30%;
  bottom: -25%;

  background: #795d89;

  animation: loginOrbThree 21s ease-in-out infinite;
}

/* ========================================
   GRAIN
   ======================================== */

.page-grain {
  position: absolute;

  inset: 0;

  pointer-events: none;

  opacity: 0.1;

  background-image: radial-gradient(
    rgba(255, 255, 255, 0.9) 0.7px,
    transparent 0.7px
  );

  background-size: 5px 5px;

  mix-blend-mode: soft-light;
}

/* ========================================
   CONTENT
   ======================================== */

.login-content {
  display: flex;

  flex-direction: column;

  align-items: stretch;
}

.eyebrow {
  margin-bottom: 10px;

  font-size: 0.68rem;

  letter-spacing: 0.18em;

  text-transform: uppercase;

  opacity: 0.65;
}

h1 {
  margin: 0;

  font-size: 3.5rem;

  letter-spacing: -0.06em;

  color: #312b50;
}

.intro {
  margin-top: 10px;

  margin-bottom: 35px;

  color: rgba(49, 43, 80, 0.7);

  font-size: 0.85rem;

  line-height: 1.7;
}

/* ========================================
   FIELDS
   ======================================== */

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;

  margin-bottom: 8px;

  font-size: 0.72rem;

  font-weight: 700;

  letter-spacing: 0.08em;

  color: #312b50;
}

.field input {
  width: 100%;

  box-sizing: border-box;

  padding: 14px 16px;

  border: 1px solid rgba(49, 43, 80, 0.16);

  border-radius: 12px;

  outline: none;

  background: rgba(255, 255, 255, 0.3);

  color: #312b50;

  font-family: inherit;

  font-size: 0.8rem;

  transition:
    border-color 250ms ease,
    background 250ms ease,
    box-shadow 250ms ease;
}

.field input::placeholder {
  color: rgba(49, 43, 80, 0.4);
}

.field input:focus {
  border-color: rgba(121, 93, 137, 0.7);

  background: rgba(255, 255, 255, 0.5);

  box-shadow: 0 0 0 4px rgba(121, 93, 137, 0.1);
}

/* ========================================
   FORGOT
   ======================================== */

.forgot {
  margin-top: -6px;

  margin-bottom: 25px;

  text-align: right;
}

.forgot a {
  font-size: 0.68rem;

  color: #795d89;

  text-decoration: none;
}

.forgot a:hover {
  text-decoration: underline;
}

/* ========================================
   BUTTON
   ======================================== */

button {
  width: 100%;

  padding: 15px;

  border: none;

  border-radius: 999px;

  background: linear-gradient(90deg, #312b50, #795d89, #c2583d);

  color: white;

  font-family: inherit;

  font-size: 0.78rem;

  font-weight: 700;

  letter-spacing: 0.05em;

  cursor: pointer;

  transition:
    transform 250ms ease,
    box-shadow 250ms ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow: 0 10px 25px rgba(49, 43, 80, 0.2);
}

button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

/* ========================================
   MESSAGES
   ======================================== */

.success-message {
  margin-top: 18px;

  color: #312b50;

  font-size: 0.75rem;
}

.error-message {
  margin-top: 18px;

  color: #a33c2d;

  font-size: 0.75rem;
}

/* ========================================
   BOTTOM LINK
   ======================================== */

.bottom-link {
  margin-top: 30px;

  text-align: center;

  font-size: 0.72rem;

  color: rgba(49, 43, 80, 0.65);
}

.bottom-link a {
  margin-left: 5px;

  color: #312b50;

  font-weight: 700;

  text-decoration: none;
}

.bottom-link a:hover {
  text-decoration: underline;
}

/* ========================================
   FOOTER
   ======================================== */

footer {
  position: absolute;

  bottom: 25px;
  left: 32px;

  font-size: 0.65rem;

  letter-spacing: 0.12em;

  opacity: 0.55;
}

/* ========================================
   ORB ANIMATIONS
   ======================================== */

@keyframes loginOrbOne {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(80px, 40px) scale(1.15);
  }
}

@keyframes loginOrbTwo {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(-70px, 60px) scale(1.12);
  }
}

@keyframes loginOrbThree {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(45px, -55px) scale(1.1);
  }
}

/* ========================================
   MOBILE
   ======================================== */

@media (max-width: 768px) {
  .login-page {
    padding: 80px 16px;
  }

  .page-brand {
    top: 20px;
    left: 20px;
  }

  h1 {
    font-size: clamp(2.6rem, 12vw, 3.5rem);
  }

  footer {
    left: 20px;

    bottom: 18px;
  }

  .background-orb {
    filter: blur(60px);
  }
}

/* ========================================
   DARK MODE
   ======================================== */

:global(html.dark-mode) .login-page {
  background: linear-gradient(135deg, #111019 0%, #292137 48%, #4a2119 100%);

  color: #f7f5f1;
}

:global(html.dark-mode) .page-grain {
  opacity: 0.14;
}

:global(html.dark-mode) .eyebrow {
  color: rgba(247, 245, 241, 0.62);
}

:global(html.dark-mode) h1 {
  color: #f7f5f1;
}

:global(html.dark-mode) .intro {
  color: rgba(247, 245, 241, 0.7);
}

:global(html.dark-mode) .field label {
  color: #f7f5f1;
}

:global(html.dark-mode) .field input {
  border-color: rgba(255, 255, 255, 0.16);

  background: rgba(255, 255, 255, 0.07);

  color: #f7f5f1;
}

:global(html.dark-mode) .field input::placeholder {
  color: rgba(247, 245, 241, 0.4);
}

:global(html.dark-mode) .field input:focus {
  border-color: rgba(200, 176, 25, 0.65);

  background: rgba(255, 255, 255, 0.1);

  box-shadow: 0 0 0 4px rgba(200, 176, 25, 0.1);
}

:global(html.dark-mode) .forgot a {
  color: #d7c85a;
}

:global(html.dark-mode) .success-message {
  color: #f7f5f1;
}

:global(html.dark-mode) .error-message {
  color: #ff9b88;
}

:global(html.dark-mode) .bottom-link {
  color: rgba(247, 245, 241, 0.62);
}

:global(html.dark-mode) .bottom-link a {
  color: #f7f5f1;
}
</style>
