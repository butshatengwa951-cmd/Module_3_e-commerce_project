<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const hovered = ref(null);
const selected = ref(null);
const transitioning = ref(false);

const mouseX = ref(50);
const mouseY = ref(50);

const selectAuth = (type) => {
  if (transitioning.value) {
    return;
  }

  selected.value = type;
  transitioning.value = true;

  setTimeout(() => {
    router.push(type === "login" ? "/login" : "/signup");
  }, 900);
};

const handleEnter = (type) => {
  if (!transitioning.value) {
    hovered.value = type;
  }
};

const handleLeave = () => {
  if (!transitioning.value) {
    hovered.value = null;
  }
};

const handleMouseMove = (event) => {
  if (transitioning.value) {
    return;
  }

  mouseX.value = (event.clientX / window.innerWidth) * 100;

  mouseY.value = (event.clientY / window.innerHeight) * 100;
};

window.addEventListener("mousemove", handleMouseMove);

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});

const signupMouseX = ref(50);
const signupMouseY = ref(50);

const handleSignupMouseMove = (event) => {
  if (transitioning.value) {
    return;
  }

  signupMouseX.value = (event.clientX / window.innerWidth) * 100;

  signupMouseY.value = (event.clientY / window.innerHeight) * 100;
};
</script>

<template>
  <main
    class="auth-selector"
    :class="{
      'is-transitioning': transitioning,
      'login-selected': selected === 'login',
      'signup-selected': selected === 'signup',
    }"
    :style="{
      '--mouse-x': `${mouseX}%`,
      '--mouse-y': `${mouseY}%`,
    }"
  >
    <!-- ========================================
         BRAND
         ======================================== -->

    <header class="brand">
      <div class="brand-mark" aria-label="StockWell">
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

      <span>StockWell</span>
    </header>

    <!-- ========================================
         LOGIN PANEL
         ======================================== -->

    <section
      class="auth-panel login-panel"
      :class="{
        hovered: hovered === 'login',
        selected: selected === 'login',
      }"
      @mouseenter="handleEnter('login')"
      @mouseleave="handleLeave"
      @click="selectAuth('login')"
    >
      <div class="gradient-orb orb-one"></div>
      <div class="gradient-orb orb-two"></div>
      <div class="gradient-orb orb-three"></div>

      <div class="grain"></div>

      <div class="panel-content">
        <span class="panel-kicker"> Welcome back </span>

        <h1>
          <span class="main-title">LOGIN</span>
          <span class="sub-title">to StockWell</span>
        </h1>

        <div class="title-line"></div>

        <p>Continue your StockWell journey</p>

        <span class="interaction-hint"> Enter StockWell </span>
      </div>
    </section>

    <!-- ========================================
         SIGNUP PANEL
         ======================================== -->

    <section
      class="auth-panel signup-panel"
      :class="{
        hovered: hovered === 'signup',
        selected: selected === 'signup',
      }"
      :style="{
        '--light-x': `${mouseX}%`,
        '--light-y': `${mouseY}%`,
      }"
      @mouseenter="handleEnter('signup')"
      @mouseleave="handleLeave"
      @click="selectAuth('signup')"
    >
      <div class="signup-light light-one"></div>
      <div class="signup-light light-two"></div>
      <div class="signup-light light-three"></div>
      <div class="signup-light light-four"></div>

      <div class="grain"></div>

      <div class="panel-content">
        <span class="panel-kicker"> Start today </span>

        <h1>
          <span class="main-title">SIGN UP</span>
          <span class="sub-title">to StockWell</span>
        </h1>

        <div class="title-line"></div>

        <p>Join your StockWell community</p>

        <span class="interaction-hint"> Create your account </span>
      </div>
    </section>

    <!-- ========================================
         FOOTER
         ======================================== -->

    <footer class="tagline">Save · Grow · Together</footer>
  </main>
</template>

<style scoped>
/* ==================================================
   ROOT
   ================================================== */

.auth-selector {
  --light-bg: #f7f5f1;

  --color-gold: #c8b019;
  --color-coral: #c2583d;
  --color-purple-dark: #312b50;
  --color-purple-light: #795d89;

  position: relative;

  width: 100%;
  height: 100vh;

  overflow: hidden;

  display: grid;
  grid-template-columns: 1fr 1fr;

  background: var(--light-bg);

  color: var(--color-purple-dark);

  font-family: "DM Mono", monospace;
}

/* ==================================================
   BRAND
   ================================================== */

.brand {
  position: absolute;

  top: 28px;
  left: 32px;

  z-index: 50;

  display: flex;
  align-items: center;

  gap: 10px;

  font-weight: 700;
  font-size: 1rem;
}

.brand-mark {
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  transition:
    transform 400ms ease,
    filter 400ms ease;
}

.brand-mark svg {
  width: 100%;
  height: 100%;
}

.brand:hover .brand-mark {
  transform: translateY(-2px) rotate(-3deg);
}

/* ==================================================
   PANELS
   ================================================== */

.auth-panel {
  position: relative;

  min-width: 0;
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  cursor: pointer;

  transition:
    width 900ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 600ms ease,
    filter 500ms ease;
}

/* ==================================================
   LOGIN
   ================================================== */

.login-panel {
  position: relative;

  will-change: background;

  color: white;

  background:
    radial-gradient(
      circle at var(--mouse-x) var(--mouse-y),
      var(--color-gold) 0%,
      transparent 28%
    ),
    radial-gradient(
      circle at calc(var(--mouse-x) + 25%) calc(var(--mouse-y) - 10%),
      var(--color-coral) 0%,
      transparent 38%
    ),
    radial-gradient(
      circle at calc(var(--mouse-x) - 20%) calc(var(--mouse-y) + 25%),
      var(--color-purple-light) 0%,
      transparent 42%
    ),
    linear-gradient(
      135deg,
      var(--color-purple-dark),
      var(--color-purple-light),
      var(--color-coral)
    );

  background-size:
    150% 150%,
    145% 145%,
    150% 150%,
    180% 180%;

  transition: background-position 300ms ease;
}

/* ==================================================
   SIGNUP
   ================================================== */

.signup-panel {
  position: relative;

  background: var(--light-bg);

  color: var(--color-purple-dark);
}

.signup-panel::before {
  content: "";

  position: absolute;

  inset: 0;

  pointer-events: none;

  z-index: 1;

  background: radial-gradient(
    circle at 20% 30%,
    rgba(255, 255, 255, 0.5) 0.6px,
    transparent 0.8px
  );

  background-size: 6px 6px;

  opacity: 0.08;

  mix-blend-mode: soft-light;
}

.signup-panel::after {
  content: "";

  position: absolute;

  inset: -20%;

  pointer-events: none;

  z-index: 0;

  background: radial-gradient(
    circle at var(--light-x) var(--light-y),
    rgba(121, 93, 137, 0.08),
    transparent 25%
  );

  transition: background-position 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* ==================================================
   LOGIN ORBS
   ================================================== */

.gradient-orb {
  position: absolute;

  width: 40vw;
  height: 40vw;

  border-radius: 50%;

  filter: blur(45px);

  opacity: 0.35;

  pointer-events: none;

  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.orb-one {
  top: -20%;
  left: -20%;

  background: var(--color-gold);

  animation: floatOne 14s ease-in-out infinite;
}

.orb-two {
  right: -20%;
  top: 20%;

  background: var(--color-coral);

  animation: floatTwo 17s ease-in-out infinite;
}

.orb-three {
  left: 20%;
  bottom: -25%;

  background: var(--color-purple-light);

  animation: floatThree 19s ease-in-out infinite;
}

/* ==================================================
   SIGNUP CIRCULAR LIGHTS
   ================================================== */

.signup-light {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  opacity: 0.3;

  filter: blur(22px);

  mix-blend-mode: multiply;

  animation:
    signupFloat 15s ease-in-out infinite,
    signupPulse 7s ease-in-out infinite;
}

.light-one {
  width: 240px;
  height: 240px;

  top: 8%;
  left: 10%;

  background: var(--color-gold);
}

.light-two {
  width: 190px;
  height: 190px;

  top: 25%;
  right: 8%;

  background: var(--color-coral);

  animation-delay: -4s;
}

.light-three {
  width: 220px;
  height: 220px;

  bottom: 5%;
  left: 25%;

  background: var(--color-purple-light);

  animation-delay: -7s;
}

.light-four {
  width: 150px;
  height: 150px;

  bottom: 20%;
  right: 15%;

  background: var(--color-purple-dark);

  animation-delay: -11s;
}

/* ==================================================
   GRAIN
   ================================================== */

.grain {
  position: absolute;

  inset: 0;

  z-index: 2;

  pointer-events: none;

  opacity: 0.12;

  background-image: radial-gradient(
    rgba(255, 255, 255, 0.9) 0.7px,
    transparent 0.7px
  );

  background-size: 5px 5px;

  mix-blend-mode: soft-light;
}

/* ==================================================
   CONTENT
   ================================================== */

.panel-content {
  position: relative;

  z-index: 10;

  width: min(520px, 80%);

  text-align: center;

  transition:
    transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 500ms ease;
}

.panel-kicker {
  display: block;

  margin-bottom: 20px;

  font-size: 0.72rem;

  letter-spacing: 0.18em;

  text-transform: uppercase;

  opacity: 0.72;
}

h1 {
  margin: 0;

  display: flex;
  flex-direction: column;
  align-items: center;

  line-height: 0.95;

  letter-spacing: -0.06em;

  font-weight: 700;
}

.main-title {
  display: block;

  font-size: clamp(3rem, 6vw, 6rem);

  transition:
    font-size 900ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
    letter-spacing 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sub-title {
  display: block;

  margin-top: 10px;

  font-size: 0.95rem;

  letter-spacing: 0.08em;

  opacity: 0;

  transform: translateY(12px);

  transition:
    opacity 500ms ease 250ms,
    transform 700ms cubic-bezier(0.22, 1, 0.36, 1) 250ms;
}

.login-panel h1 {
  color: white;
}

.signup-panel h1 {
  color: var(--color-purple-dark);
}

.title-line {
  width: 60px;
  height: 2px;

  margin: 24px auto 0;

  background: currentColor;

  opacity: 0.65;

  transition:
    width 500ms ease,
    opacity 500ms ease;
}

.panel-content p {
  margin-top: 22px;

  font-size: 0.84rem;

  line-height: 1.7;

  opacity: 0.8;
}

.interaction-hint {
  display: inline-block;

  margin-top: 28px;

  font-size: 0.68rem;

  letter-spacing: 0.12em;

  text-transform: uppercase;

  opacity: 0.5;

  transition:
    transform 400ms ease,
    opacity 400ms ease;
}

/* ==================================================
   HOVER
   ================================================== */

.auth-panel.hovered .panel-content {
  transform: scale(1.035);
}

.login-panel.hovered {
  filter: brightness(1.08);
}

.signup-panel.hovered {
  filter: brightness(1.02);
}

.auth-panel.hovered h1 {
  text-shadow: 0 0 24px rgba(255, 255, 255, 0.22);
}

.signup-panel.hovered h1 {
  text-shadow: 0 0 24px rgba(121, 93, 137, 0.25);
}

.auth-panel.hovered .title-line {
  width: 100px;
}

.auth-panel.hovered .interaction-hint {
  opacity: 0.8;

  transform: translateY(-2px);
}

/* ==================================================
   SELECTED LOGIN
   ================================================== */

.auth-selector.login-selected .signup-panel {
  opacity: 0;

  transform: translateX(40%);
}

.auth-selector.login-selected .login-panel {
  grid-column: 1 / 3;

  transform: scale(1.03);
}

.auth-selector.login-selected .login-panel .panel-content {
  transform: translateY(-10px);
}

.auth-selector.login-selected .login-panel .panel-kicker,
.auth-selector.signup-selected .signup-panel .panel-kicker {
  opacity: 0;

  transform: translateY(-12px);

  transition:
    opacity 300ms ease,
    transform 500ms ease;
}

.auth-selector.login-selected .login-panel p,
.auth-selector.signup-selected .signup-panel p {
  opacity: 0;

  transform: translateY(15px);

  transition:
    opacity 300ms ease,
    transform 500ms ease;
}

.auth-selector.login-selected .login-panel .interaction-hint,
.auth-selector.signup-selected .signup-panel .interaction-hint {
  opacity: 0;

  transform: translateY(15px);

  transition:
    opacity 250ms ease,
    transform 400ms ease;
}

.auth-selector.login-selected .login-panel .title-line,
.auth-selector.signup-selected .signup-panel .title-line {
  width: 40px;

  opacity: 0.5;
}

.auth-selector.login-selected .login-panel::after,
.auth-selector.signup-selected .signup-panel::after {
  content: "";

  position: absolute;

  inset: 0;

  pointer-events: none;

  background: radial-gradient(
    circle at 50% 45%,
    rgba(255, 255, 255, 0.08),
    transparent 35%
  );

  opacity: 1;
}

/* ==================================================
   SELECTED SIGNUP
   ================================================== */

.auth-selector.signup-selected .login-panel {
  opacity: 0;

  transform: translateX(-40%);
}

.auth-selector.signup-selected .signup-panel {
  grid-column: 1 / 3;

  transform: scale(1.03);
}

.auth-selector.signup-selected .signup-panel .panel-content {
  transform: translateY(-10px);
}

.auth-selector.login-selected .login-panel .main-title,
.auth-selector.signup-selected .signup-panel .main-title {
  font-size: clamp(2rem, 4vw, 3.5rem);

  letter-spacing: -0.04em;

  transform: translateY(-5px);
}

.auth-selector.login-selected .login-panel .sub-title,
.auth-selector.signup-selected .signup-panel .sub-title {
  opacity: 1;

  transform: translateY(0);
}

/* ==================================================
   FOOTER
   ================================================== */

.tagline {
  position: absolute;

  z-index: 50;

  left: 32px;
  bottom: 28px;

  font-size: 0.68rem;

  letter-spacing: 0.12em;

  opacity: 0.58;

  pointer-events: none;
}

/* ==================================================
   ANIMATIONS
   ================================================== */

@keyframes loginGradient {
  0% {
    background-position:
      0% 20%,
      100% 20%,
      40% 100%,
      0% 50%;
  }

  50% {
    background-position:
      40% 50%,
      60% 30%,
      20% 70%,
      50% 50%;
  }

  100% {
    background-position:
      100% 80%,
      20% 70%,
      80% 20%,
      100% 50%;
  }
}

@keyframes floatOne {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(80px, 30px) scale(1.15);
  }
}

@keyframes floatTwo {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(-70px, 60px) scale(1.2);
  }
}

@keyframes floatThree {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(50px, -50px) scale(1.1);
  }
}

@keyframes signupFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  35% {
    transform: translate(30px, -20px) scale(1.08);
  }

  70% {
    transform: translate(-20px, 35px) scale(0.94);
  }
}

@keyframes signupPulse {
  0%,
  100% {
    opacity: 0.18;
  }

  50% {
    opacity: 0.38;
  }
}

/* ==================================================
   MOBILE
   ================================================== */

@media (max-width: 768px) {
  .auth-selector {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .auth-panel {
    min-height: 50vh;
  }

  .brand {
    top: 20px;
    left: 20px;
  }

  .tagline {
    left: 20px;
    bottom: 18px;
  }

  h1 {
    font-size: clamp(2.6rem, 13vw, 4.5rem);
  }

  .panel-content {
    width: 85%;
  }

  .gradient-orb {
    width: 70vw;
    height: 70vw;
  }

  .signup-light {
    transform: scale(0.75);
  }

  .auth-selector.login-selected .login-panel h1,
  .auth-selector.signup-selected .signup-panel h1 {
    font-size: clamp(3rem, 15vw, 5rem);
  }
}

@media (max-width: 768px) {
  .auth-selector.login-selected .login-panel .main-title,
  .auth-selector.signup-selected .signup-panel .main-title {
    font-size: clamp(2rem, 11vw, 3rem);
  }

  .sub-title {
    font-size: 0.75rem;
  }
}

/* ==================================================
   REDUCED MOTION
   ================================================== */

@media (prefers-reduced-motion: reduce) {
  .auth-panel,
  .panel-content,
  h1,
  .title-line,
  .interaction-hint {
    transition: none;
  }

  .login-panel,
  .gradient-orb,
  .signup-light {
    animation: none;
  }
}
</style>
