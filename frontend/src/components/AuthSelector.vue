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
  }, 1200);
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
    <!-- ==================================================
         BRAND
         ================================================== -->

    <header class="brand">
      <div class="brand-mark" aria-label="StockWell">
        <span class="brand-handshake" aria-hidden="true"> 🤝 </span>
      </div>

      <span> StockWell </span>
    </header>

    <!-- ==================================================
         LOGIN PANEL
         ================================================== -->

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

    <!-- ==================================================
         SIGNUP PANEL
         ================================================== -->

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

    <!-- ==================================================
         LIQUID TRANSITION
         ================================================== -->

    <div class="liquid-transition" aria-hidden="true"></div>

    <!-- ==================================================
         FOOTER
         ================================================== -->

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

  z-index: 60;

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

.brand-handshake {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  width: 100%;
  height: 100%;

  font-size: 1.65rem;

  line-height: 1;

  transform: translateY(-1px);

  filter: drop-shadow(0 2px 4px rgba(49, 43, 80, 0.12));

  transition:
    transform 400ms ease,
    filter 400ms ease;
}

.brand:hover .brand-mark {
  transform: translateY(-2px) rotate(-3deg);
}

.brand:hover .brand-handshake {
  transform: translateY(-1px) scale(1.06);

  filter: drop-shadow(0 4px 7px rgba(49, 43, 80, 0.2));
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
    width 1200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 1200ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 700ms ease,
    filter 800ms ease,
    background 900ms ease,
    color 600ms ease;
}

/* ==================================================
   LOGIN BACKGROUND
   ================================================== */

.login-panel {
  position: relative;

  will-change: transform, filter;

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
   SIGNUP MOUSE LIGHT
   ================================================== */

.signup-panel::before {
  content: "";

  position: absolute;

  inset: 0;

  pointer-events: none;

  z-index: 1;

  background: radial-gradient(
    circle at var(--light-x) var(--light-y),
    rgba(255, 255, 255, 0.55) 0.6px,

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
    rgba(121, 93, 137, 0.1),
    transparent 25%
  );

  transition: background-position 900ms cubic-bezier(0.16, 1, 0.3, 1);
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

  transition: transform 1.4s cubic-bezier(0.16, 1, 0.3, 1);
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
    transform 1200ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 600ms ease,
    filter 700ms ease;
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
    font-size 1200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 1200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.sub-title {
  display: block;

  margin-top: 12px;

  font-size: clamp(1rem, 2vw, 1.45rem);

  font-weight: 400;

  letter-spacing: -0.03em;

  opacity: 0.8;

  transition:
    font-size 1200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 1200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.title-line {
  width: 90px;

  height: 2px;

  margin: 24px auto;

  border-radius: var(--sw-radius-pill);

  background: currentColor;

  opacity: 0.55;

  transition:
    width 1000ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 500ms ease;
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
    transform 400ms ease,
    opacity 400ms ease;
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
   LIQUID TRANSITION
   ================================================== */

.liquid-transition {
  position: absolute;

  z-index: 45;

  width: 46vw;

  height: 72vh;

  left: 27%;

  top: 14%;

  pointer-events: none;

  opacity: 0;

  transform: scale(0.12);

  transform-origin: center;

  border-radius: 58% 42% 52% 48% / 48% 52% 45% 55%;

  filter: blur(1px);

  background: linear-gradient(
    135deg,
    var(--sw-purple-900),
    var(--sw-purple-700),
    var(--sw-orange-600)
  );

  box-shadow: 0 0 120px rgba(49, 43, 80, 0.16);

  will-change: transform, opacity, border-radius, filter;

  transition:
    transform 1200ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 500ms ease,
    border-radius 1400ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 1200ms ease;
}

.is-transitioning .liquid-transition {
  opacity: 0.96;

  transform: scale(3.15);

  border-radius: 46% 54% 58% 42% / 54% 46% 52% 48%;

  filter: blur(2px);
}

.login-selected .liquid-transition {
  left: -6%;

  top: 8%;

  background:
    radial-gradient(
      circle at 30% 32%,

      var(--sw-gold-500) 0%,

      transparent 28%
    ),
    radial-gradient(
      circle at 72% 60%,

      var(--sw-orange-600) 0%,

      transparent 42%
    ),
    linear-gradient(
      135deg,
      var(--sw-purple-900),
      var(--sw-purple-700),
      var(--sw-orange-600)
    );

  transform-origin: left center;
}

.signup-selected .liquid-transition {
  left: 54%;

  top: 8%;

  background:
    radial-gradient(
      circle at 30% 28%,

      rgba(200, 176, 25, 0.82) 0%,

      transparent 30%
    ),
    radial-gradient(
      circle at 72% 60%,

      rgba(194, 88, 61, 0.62) 0%,

      transparent 38%
    ),
    linear-gradient(135deg, #f7f5f1, #f3eee8, #eee3df);

  box-shadow: 0 0 120px rgba(121, 93, 137, 0.12);

  transform-origin: right center;
}

/* ==================================================
   SELECTED PANEL
   ================================================== */

.login-selected .login-panel,
.signup-selected .signup-panel {
  z-index: 20;

  transform: scale(1.025);

  filter: saturate(1.02);
}

/* ==================================================
   OPPOSITE PANEL
   ================================================== */

.login-selected .signup-panel {
  transform: translateX(100%) scale(0.985);

  opacity: 0;

  filter: blur(10px);

  transition:
    transform 1050ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 850ms ease,
    filter 950ms ease;
}

.signup-selected .login-panel {
  transform: translateX(-100%) scale(0.985);

  opacity: 0;

  filter: blur(10px);

  transition:
    transform 1050ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 850ms ease,
    filter 950ms ease;
}

/* ==================================================
   SELECTED CONTENT
   ================================================== */

.login-selected .login-panel .panel-content,
.signup-selected .signup-panel .panel-content {
  transform: scale(1.035);
}

/* ==================================================
   DARK MODE
   ================================================== */

:global(html.dark-mode) .auth-selector {
  background: #111019;

  color: var(--sw-off-white);
}

:global(html.dark-mode) .brand {
  color: var(--sw-off-white);
}

:global(html.dark-mode) .brand-handshake {
  filter: drop-shadow(0 2px 5px rgba(255, 255, 255, 0.08));
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

:global(html.dark-mode) .login-selected .liquid-transition {
  background:
    radial-gradient(
      circle at 35% 35%,

      var(--sw-gold-500) 0%,

      transparent 28%
    ),
    radial-gradient(
      circle at 72% 58%,

      var(--sw-orange-600) 0%,

      transparent 40%
    ),
    linear-gradient(135deg, #111019, #292137, #4a2119);

  box-shadow: 0 0 110px rgba(0, 0, 0, 0.4);
}

:global(html.dark-mode) .signup-selected .liquid-transition {
  background:
    radial-gradient(
      circle at 30% 28%,

      rgba(200, 176, 25, 0.45) 0%,

      transparent 28%
    ),
    radial-gradient(
      circle at 70% 58%,

      rgba(194, 88, 61, 0.35) 0%,

      transparent 38%
    ),
    linear-gradient(135deg, #17131f, #1f1828, #25181a);

  box-shadow: 0 0 110px rgba(0, 0, 0, 0.38);
}

/* ==================================================
   HOVER
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

  .liquid-transition {
    width: 82vw;

    height: 48vh;

    left: 9%;

    top: 26%;

    transform-origin: center;
  }

  .login-selected .liquid-transition {
    left: 0;

    top: 4%;

    transform-origin: center top;
  }

  .signup-selected .liquid-transition {
    left: 0;

    top: 48%;

    transform-origin: center bottom;
  }

  .login-selected .signup-panel {
    transform: translateY(100%) scale(0.985);
  }

  .signup-selected .login-panel {
    transform: translateY(-100%) scale(0.985);
  }
}

/* ==================================================
   MOBILE
   ================================================== */

@media (max-width: 520px) {
  .brand {
    font-size: 0.9rem;
  }

  .brand-mark {
    width: 28px;

    height: 28px;
  }

  .brand-handshake {
    font-size: 1.4rem;
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

  .liquid-transition {
    width: 90vw;

    height: 44vh;

    left: 5%;
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
  .brand-handshake,
  .auth-selector,
  .brand,
  .tagline,
  .liquid-transition {
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
