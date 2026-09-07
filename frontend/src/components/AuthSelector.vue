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
    <!-- BRAND -->

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

      <span> StockWell </span>
    </header>

    <!-- LOGIN PANEL -->

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
          <span class="main-title"> LOGIN </span>

          <span class="sub-title"> to StockWell </span>
        </h1>

        <div class="title-line"></div>

        <p>Continue your StockWell journey</p>

        <span class="interaction-hint"> Enter StockWell </span>
      </div>
    </section>

    <!-- SIGNUP PANEL -->

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
          <span class="main-title"> SIGN UP </span>

          <span class="sub-title"> to StockWell </span>
        </h1>

        <div class="title-line"></div>

        <p>Join your StockWell community</p>

        <span class="interaction-hint"> Create your account </span>
      </div>
    </section>

    <!-- FOOTER -->

    <footer class="tagline">Save · Grow · Together</footer>
  </main>
</template>

<style scoped>
/* ==================================================
   ROOT
   ================================================== */

.auth-selector {
  position: relative;

  width: 100%;
  height: 100vh;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    1fr
    1fr;

  background: var(--sw-off-white);

  color: var(--sw-purple-900);

  font-family: var(--sw-font-body);

  transition:
    background var(--sw-transition-slow),
    color var(--sw-transition-slow);
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

  color: var(--sw-purple-900);

  transition: color var(--sw-transition);
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
    filter 500ms ease,
    background 700ms ease,
    color 500ms ease;
}

/* ==================================================
   LOGIN BACKGROUND
   ================================================== */

.login-panel {
  position: relative;

  will-change: background;

  color: var(--sw-white);

  background:
    radial-gradient(
      circle at var(--mouse-x) var(--mouse-y),
      var(--sw-gold-500) 0%,

      transparent 28%
    ),
    radial-gradient(
      circle at calc(var(--mouse-x) + 25%) calc(var(--mouse-y) - 10%),
      var(--sw-orange-600) 0%,

      transparent 38%
    ),
    radial-gradient(
      circle at calc(var(--mouse-x) - 20%) calc(var(--mouse-y) + 25%),
      var(--sw-purple-700) 0%,

      transparent 42%
    ),
    linear-gradient(
      135deg,
      var(--sw-purple-900),
      var(--sw-purple-700),
      var(--sw-orange-600)
    );

  background-size:
    150% 150%,
    145% 145%,
    150% 150%,
    180% 180%;
}

/* ==================================================
   SIGNUP BACKGROUND
   ================================================== */

.signup-panel {
  position: relative;

  background: var(--sw-off-white);

  color: var(--sw-purple-900);
}

/* ==================================================
   SIGNUP GRAIN
   ================================================== */

.signup-panel::before {
  content: "";

  position: absolute;

  inset: 0;

  pointer-events: none;

  z-index: 1;

  background: radial-gradient(
    circle at 20% 30%,

    rgba(255, 255, 255, 0.55) 0.6px,

    transparent 0.8px
  );

  background-size: 6px 6px;

  opacity: 0.08;

  mix-blend-mode: soft-light;
}

/* ==================================================
   SIGNUP MOUSE LIGHT
   ================================================== */

.signup-panel::after {
  content: "";

  position: absolute;

  inset: -20%;

  pointer-events: none;

  z-index: 0;

  background: radial-gradient(
    circle at var(--light-x) var(--light-y),
    rgba(121, 93, 137, 0.1),
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

  background: var(--sw-gold-500);

  animation: floatOne 14s ease-in-out infinite;
}

.orb-two {
  right: -20%;
  top: 20%;

  background: var(--sw-orange-600);

  animation: floatTwo 17s ease-in-out infinite;
}

.orb-three {
  left: 20%;
  bottom: -25%;

  background: var(--sw-purple-700);

  animation: floatThree 19s ease-in-out infinite;
}

/* ==================================================
   SIGNUP LIGHTS
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

  background: var(--sw-gold-500);
}

.light-two {
  width: 190px;
  height: 190px;

  top: 25%;
  right: 8%;

  background: var(--sw-orange-600);

  animation-delay: -4s;
}

.light-three {
  width: 220px;
  height: 220px;

  bottom: 5%;
  left: 25%;

  background: var(--sw-purple-700);

  animation-delay: -7s;
}

.light-four {
  width: 150px;
  height: 150px;

  bottom: 20%;
  right: 15%;

  background: var(--sw-purple-900);

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

  opacity: var(--sw-grain-opacity);

  background-image: radial-gradient(
    var(--sw-grain-dot) 0.7px,

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

  font-size: var(--sw-text-md);

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
    transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sub-title {
  display: block;

  margin-top: 12px;

  font-size: clamp(1rem, 2vw, 1.45rem);

  font-weight: 400;

  letter-spacing: -0.03em;

  opacity: 0.8;

  transition:
    font-size 900ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.title-line {
  width: 90px;

  height: 2px;

  margin: 24px auto;

  border-radius: var(--sw-radius-pill);

  background: currentColor;

  opacity: 0.55;

  transition:
    width 900ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 400ms ease;
}

.panel-content p {
  margin: 0;

  font-size: var(--sw-text-base);

  letter-spacing: 0.04em;

  opacity: 0.75;
}

.interaction-hint {
  display: inline-block;

  margin-top: 28px;

  padding: 8px 14px;

  border: 1px solid currentColor;

  border-radius: var(--sw-radius-pill);

  font-size: var(--sw-text-sm);

  letter-spacing: 0.08em;

  text-transform: uppercase;

  opacity: 0.55;

  transition:
    transform 300ms ease,
    opacity 300ms ease;
}

.auth-panel:hover .interaction-hint,
.auth-panel.hovered .interaction-hint {
  transform: translateY(-2px);

  opacity: 0.9;
}

.auth-panel:hover .title-line,
.auth-panel.hovered .title-line {
  width: 130px;

  opacity: 0.85;
}

/* ==================================================
   TAGLINE
   ================================================== */

.tagline {
  position: absolute;

  left: 32px;
  bottom: 22px;

  z-index: 50;

  font-size: var(--sw-text-xs);

  letter-spacing: 0.16em;

  text-transform: uppercase;

  color: var(--sw-purple-900);

  opacity: 0.55;

  transition:
    color var(--sw-transition),
    opacity var(--sw-transition);

  pointer-events: none;
}

/* ==================================================
   HOVER STATES
   ================================================== */

.auth-selector:not(.is-transitioning) .login-panel:hover {
  transform: scale(1.015);
}

.auth-selector:not(.is-transitioning) .signup-panel:hover {
  transform: scale(1.015);
}

.auth-selector:not(.is-transitioning) .login-panel:hover .panel-content {
  transform: translateY(-4px);
}

.auth-selector:not(.is-transitioning) .signup-panel:hover .panel-content {
  transform: translateY(-4px);
}

/* ==================================================
   SELECTION TRANSITION
   ================================================== */

.login-selected .login-panel {
  z-index: 20;

  transform: scale(1.06);
}

.signup-selected .signup-panel {
  z-index: 20;

  transform: scale(1.06);
}

.login-selected .signup-panel {
  transform: translateX(100%);

  opacity: 0;

  filter: blur(12px);
}

.signup-selected .login-panel {
  transform: translateX(-100%);

  opacity: 0;

  filter: blur(12px);
}

.login-selected .login-panel .panel-content,
.signup-selected .signup-panel .panel-content {
  transform: scale(1.05);
}

.login-selected .brand,
.signup-selected .brand,
.login-selected .tagline,
.signup-selected .tagline {
  opacity: 0;

  pointer-events: none;
}

/* ==================================================
   DARK THEME
   ================================================== */

:global(html.dark-mode) .auth-selector {
  background: #111019;

  color: var(--sw-off-white);
}

:global(html.dark-mode) .brand {
  color: var(--sw-off-white);
}

:global(html.dark-mode) .signup-panel {
  background:
    radial-gradient(
      circle at var(--light-x) var(--light-y),
      rgba(155, 134, 167, 0.12),
      transparent 30%
    ),
    linear-gradient(135deg, #17131f 0%, #1f1828 48%, #25181a 100%);

  color: var(--sw-off-white);
}

:global(html.dark-mode) .signup-panel::before {
  opacity: 0.14;
}

:global(html.dark-mode) .signup-panel::after {
  background: radial-gradient(
    circle at var(--light-x) var(--light-y),
    rgba(200, 176, 25, 0.12),
    transparent 28%
  );
}

:global(html.dark-mode) .signup-light {
  opacity: 0.2;

  mix-blend-mode: screen;
}

:global(html.dark-mode) .tagline {
  color: var(--sw-off-white);
}

:global(html.dark-mode) .login-panel {
  background:
    radial-gradient(
      circle at var(--mouse-x) var(--mouse-y),
      var(--sw-gold-500) 0%,

      transparent 26%
    ),
    radial-gradient(
      circle at calc(var(--mouse-x) + 25%) calc(var(--mouse-y) - 10%),
      var(--sw-orange-600) 0%,

      transparent 36%
    ),
    radial-gradient(
      circle at calc(var(--mouse-x) - 20%) calc(var(--mouse-y) + 25%),
      #4b3d61 0%,

      transparent 42%
    ),
    linear-gradient(135deg, #111019, #292137, #4a2119);
}

/* ==================================================
   RESPONSIVE
   ================================================== */

@media (max-width: 850px) {
  .auth-selector {
    grid-template-columns: 1fr;

    grid-template-rows:
      1fr
      1fr;

    height: 100dvh;
  }

  .auth-panel {
    min-height: 50dvh;
  }

  .brand {
    top: 18px;
    left: 20px;
  }

  .tagline {
    left: 20px;
    bottom: 12px;
  }

  .panel-content {
    width: min(520px, 84%);
  }

  .main-title {
    font-size: clamp(2.8rem, 13vw, 5rem);
  }

  .login-selected .signup-panel {
    transform: translateY(100%);
  }

  .signup-selected .login-panel {
    transform: translateY(-100%);
  }
}

@media (max-width: 520px) {
  .brand {
    font-size: 0.9rem;
  }

  .brand-mark {
    width: 28px;

    height: 28px;
  }

  .panel-kicker {
    margin-bottom: 14px;

    font-size: 0.62rem;
  }

  .sub-title {
    margin-top: 9px;

    font-size: 1rem;
  }

  .title-line {
    margin: 18px auto;
  }

  .panel-content p {
    font-size: 0.68rem;
  }

  .interaction-hint {
    margin-top: 20px;

    font-size: 0.6rem;
  }

  .tagline {
    left: 14px;

    bottom: 10px;

    max-width: 48%;

    font-size: 0.52rem;

    letter-spacing: 0.1em;
  }
}

/* ==================================================
   REDUCED MOTION
   ================================================== */

@media (prefers-reduced-motion: reduce) {
  .auth-panel,
  .panel-content,
  .main-title,
  .sub-title,
  .title-line,
  .interaction-hint,
  .brand-mark,
  .auth-selector,
  .brand,
  .tagline {
    transition: none !important;
  }

  .gradient-orb,
  .signup-light {
    animation: none !important;
  }
}

/* ==================================================
   ANIMATIONS
   ================================================== */

@keyframes floatOne {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(8%, 5%, 0) scale(1.06);
  }
}

@keyframes floatTwo {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-7%, 8%, 0) scale(1.08);
  }
}

@keyframes floatThree {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(5%, -7%, 0) scale(1.05);
  }
}

@keyframes signupFloat {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(2%, -4%, 0) scale(1.08);
  }
}

@keyframes signupPulse {
  0%,
  100% {
    opacity: 0.22;
  }

  50% {
    opacity: 0.4;
  }
}
</style>
