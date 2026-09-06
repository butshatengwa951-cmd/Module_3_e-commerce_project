<script setup>
import { onMounted, reactive, ref } from "vue";
import { getStokvels, signup } from "../services/api.js";
import GlassCard from "../components/GlassCard.vue";
import { useTheme } from "../composables/useTheme.js";

const { isDark } = useTheme();

const stokvels = ref([]);
const loadingStokvels = ref(false);
const submitting = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

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

onMounted(() => {
  loadStokvels();
});
</script>

<template>
  <main class="signup-page">
    <!-- Animated background lights -->
    <div class="background-orb orb-one"></div>
    <div class="background-orb orb-two"></div>
    <div class="background-orb orb-three"></div>
    <div class="background-orb orb-four"></div>

    <!-- Grain overlay -->
    <div class="page-grain"></div>

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
            <label for="full_name">Full Name</label>

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
            <label for="email">Email</label>

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
            <label for="password">Password</label>

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
            <label for="phone_number">Phone Number</label>

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
            <label for="stokvel_name">Choose Your Stokvel</label>

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
          <button type="submit" :disabled="submitting || loadingStokvels">
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
          <router-link to="/login">Login</router-link>
        </p>
      </div>
    </GlassCard>

    <!-- Footer -->
    <footer class="page-footer">Save · Grow · Together</footer>
  </main>
</template>

<style scoped>
.signup-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 80px 20px;

  background: linear-gradient(135deg, #312b50 0%, #795d89 50%, #c2583d 100%);

  color: white;
  font-family: "DM Mono", monospace;

  box-sizing: border-box;
}

/* --------------------------------------------------
   StockWell branding
-------------------------------------------------- */

.page-brand {
  position: absolute;
  top: 28px;
  left: 32px;

  z-index: 20;

  display: flex;
  align-items: center;
  gap: 10px;

  font-size: 0.95rem;
  font-weight: 700;
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

/* --------------------------------------------------
   Animated background lights
-------------------------------------------------- */

.background-orb {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(80px);

  opacity: 0.45;
}

/* Gold */
.orb-one {
  width: 38vw;
  height: 38vw;

  top: -14%;
  left: -10%;

  background: #c8b019;

  animation: signupOrbOne 16s ease-in-out infinite;
}

/* Burnt orange */
.orb-two {
  width: 34vw;
  height: 34vw;

  top: 8%;
  right: -12%;

  background: #c2583d;

  animation: signupOrbTwo 19s ease-in-out infinite;
}

/* Purple */
.orb-three {
  width: 42vw;
  height: 42vw;

  bottom: -22%;
  left: 22%;

  background: #795d89;

  animation: signupOrbThree 21s ease-in-out infinite;
}

/* Deep purple / gold mix */
.orb-four {
  width: 28vw;
  height: 28vw;

  bottom: 10%;
  right: 18%;

  background: #9b86a7;

  animation: signupOrbFour 18s ease-in-out infinite;
}

/* --------------------------------------------------
   Grain
-------------------------------------------------- */

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

/* --------------------------------------------------
   Signup card content
-------------------------------------------------- */

.signup-content {
  display: flex;
  flex-direction: column;
}

.eyebrow {
  margin: 0 0 10px;

  font-size: 0.68rem;
  font-weight: 700;

  text-transform: uppercase;
  letter-spacing: 0.18em;

  color: rgba(49, 43, 80, 0.62);
}

h1 {
  margin: 0;

  color: #312b50;

  font-size: 3rem;
  line-height: 1;

  letter-spacing: -0.06em;
}

.intro {
  margin: 12px 0 30px;

  color: rgba(49, 43, 80, 0.7);

  font-size: 0.85rem;
  line-height: 1.7;
}

/* --------------------------------------------------
   Form fields
-------------------------------------------------- */

.field {
  margin-bottom: 18px;
}

.field label {
  display: block;

  margin-bottom: 8px;

  color: #312b50;

  font-size: 0.72rem;
  font-weight: 700;

  letter-spacing: 0.08em;
}

.field input,
.field select {
  width: 100%;

  box-sizing: border-box;

  padding: 14px 16px;

  border: 1px solid rgba(49, 43, 80, 0.16);
  border-radius: 12px;

  outline: none;

  background: rgba(255, 255, 255, 0.3);

  color: #312b50;

  font-family: "DM Mono", monospace;
  font-size: 0.8rem;

  transition:
    border 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.field input::placeholder {
  color: rgba(49, 43, 80, 0.45);
}

.field select {
  cursor: pointer;

  appearance: none;

  background-image:
    linear-gradient(45deg, transparent 50%, #312b50 50%),
    linear-gradient(135deg, #312b50 50%, transparent 50%);

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
  border-color: rgba(121, 93, 137, 0.7);

  background: rgba(255, 255, 255, 0.5);

  box-shadow: 0 0 0 4px rgba(121, 93, 137, 0.1);

  transform: translateY(-1px);
}

.field select:disabled {
  cursor: wait;
  opacity: 0.65;
}

/* --------------------------------------------------
   Submit button
-------------------------------------------------- */

button {
  width: 100%;

  margin-top: 4px;

  padding: 15px;

  border: none;
  border-radius: 999px;

  background: linear-gradient(90deg, #312b50, #795d89, #c2583d);

  color: white;

  font-family: "DM Mono", monospace;
  font-size: 0.78rem;
  font-weight: 700;

  letter-spacing: 0.05em;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow: 0 10px 25px rgba(49, 43, 80, 0.2);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* --------------------------------------------------
   Status messages
-------------------------------------------------- */

.status-message {
  margin: 18px 0 0;

  font-size: 0.72rem;
  line-height: 1.6;
}

.success-message {
  color: #312b50;
}

.error-message {
  color: #a33c2d;
}

/* --------------------------------------------------
   Login link
-------------------------------------------------- */

.bottom-link {
  margin: 24px 0 0;

  text-align: center;

  color: rgba(49, 43, 80, 0.65);

  font-size: 0.72rem;
}

.bottom-link a {
  color: #312b50;

  font-weight: 700;

  text-decoration: none;
}

.bottom-link a:hover {
  text-decoration: underline;
}

/* --------------------------------------------------
   Footer
-------------------------------------------------- */

.page-footer {
  position: absolute;

  bottom: 25px;
  left: 32px;

  font-size: 0.65rem;

  letter-spacing: 0.12em;

  opacity: 0.55;
}

/* --------------------------------------------------
   Orb animations
-------------------------------------------------- */

@keyframes signupOrbOne {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(90px, 45px) scale(1.16);
  }
}

@keyframes signupOrbTwo {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(-80px, 55px) scale(1.13);
  }
}

@keyframes signupOrbThree {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(55px, -60px) scale(1.12);
  }
}

@keyframes signupOrbFour {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(-45px, -35px) scale(1.14);
  }
}

/* --------------------------------------------------
   Responsive
-------------------------------------------------- */

@media (max-width: 768px) {
  .signup-page {
    align-items: flex-start;

    padding: 90px 16px 80px;
  }

  .page-brand {
    top: 22px;
    left: 20px;
  }

  .page-footer {
    bottom: 18px;
    left: 20px;
  }

  h1 {
    font-size: 2.5rem;
  }

  .intro {
    margin-bottom: 26px;
  }

  .orb-one {
    width: 65vw;
    height: 65vw;
  }

  .orb-two {
    width: 58vw;
    height: 58vw;
  }

  .orb-three {
    width: 62vw;
    height: 62vw;
  }

  .orb-four {
    width: 50vw;
    height: 50vw;
  }
}

@media (max-width: 480px) {
  .signup-page {
    padding-left: 12px;
    padding-right: 12px;
  }

  h1 {
    font-size: 2.15rem;
  }

  .field input,
  .field select {
    padding: 13px 14px;
  }

  button {
    padding: 14px;
  }
}

/* ========================================
   DARK MODE
   ======================================== */

:global(html.dark-mode) .signup-page {
  background:
    linear-gradient(
      135deg,
      #111019 0%,
      #292137 48%,
      #4a2119 100%
    );

  color: #f7f5f1;
}

:global(html.dark-mode) .page-grain {
  opacity: 0.14;

  background-image:
    radial-gradient(
      rgba(255, 255, 255, 0.8) 0.7px,
      transparent 0.7px
    );
}

:global(html.dark-mode) .eyebrow {
  color: rgba(247, 245, 241, 0.6);
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

:global(html.dark-mode) .field input,
:global(html.dark-mode) .field select {
  border-color: rgba(255, 255, 255, 0.16);

  background:
    rgba(255, 255, 255, 0.07);

  color: #f7f5f1;
}

:global(html.dark-mode) .field input::placeholder {
  color:
    rgba(247, 245, 241, 0.4);
}

:global(html.dark-mode) .field input:focus,
:global(html.dark-mode) .field select:focus {
  border-color:
    rgba(200, 176, 25, 0.65);

  background:
    rgba(255, 255, 255, 0.1);

  box-shadow:
    0 0 0 4px
    rgba(200, 176, 25, 0.1);
}

:global(html.dark-mode) .field select {
  color: #f7f5f1;

  background-image:
    linear-gradient(45deg, transparent 50%, #f7f5f1 50%),
    linear-gradient(135deg, #f7f5f1 50%, transparent 50%);
}

:global(html.dark-mode) .field select option {
  background: #1a1721;
  color: #f7f5f1;
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
