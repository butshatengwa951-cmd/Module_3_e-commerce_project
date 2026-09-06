<template>
  <div class="page-background" aria-hidden="true">
    <div class="background-orb orb-gold"></div>

    <div class="background-orb orb-orange"></div>

    <div class="background-orb orb-purple"></div>

    <div class="background-orb orb-lavender"></div>

    <div class="page-grain"></div>
  </div>
</template>

<style scoped>
.page-background {
  position: absolute;

  inset: 0;

  overflow: hidden;

  pointer-events: none;
}

/* ========================================
   SHARED ORB
   ======================================== */

.background-orb {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(var(--sw-orb-blur));

  opacity: var(--sw-orb-opacity);
}

/* ========================================
   GOLD
   ======================================== */

.orb-gold {
  width: 40vw;
  height: 40vw;

  top: -16%;
  left: -12%;

  background: var(--sw-gold-500);

  animation: orbGold 16s ease-in-out infinite;
}

/* ========================================
   ORANGE
   ======================================== */

.orb-orange {
  width: 36vw;
  height: 36vw;

  top: 10%;
  right: -14%;

  background: var(--sw-orange-600);

  animation: orbOrange 19s ease-in-out infinite;
}

/* ========================================
   PURPLE
   ======================================== */

.orb-purple {
  width: 41vw;
  height: 41vw;

  bottom: -24%;
  left: 24%;

  background: var(--sw-purple-700);

  animation: orbPurple 21s ease-in-out infinite;
}

/* ========================================
   LAVENDER
   ======================================== */

.orb-lavender {
  width: 28vw;
  height: 28vw;

  bottom: 10%;
  right: 18%;

  background: var(--sw-lavender-500);

  animation: orbLavender 18s ease-in-out infinite;
}

/* ========================================
   GRAIN
   ======================================== */

.page-grain {
  position: absolute;

  inset: 0;

  pointer-events: none;

  opacity: var(--sw-grain-opacity);

  background-image: radial-gradient(
    var(--sw-grain-dot) 0.7px,
    transparent 0.7px
  );

  background-size: 5px 5px;

  mix-blend-mode: soft-light;
}

/* ========================================
   ANIMATIONS
   ======================================== */

@keyframes orbGold {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(80px, 40px) scale(1.15);
  }
}

@keyframes orbOrange {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(-70px, 60px) scale(1.12);
  }
}

@keyframes orbPurple {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(45px, -55px) scale(1.1);
  }
}

@keyframes orbLavender {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(-35px, -45px) scale(1.08);
  }
}

/* ========================================
   MOBILE
   ======================================== */

@media (max-width: 768px) {
  .background-orb {
    filter: blur(60px);
  }
}

/* ========================================
   REDUCED MOTION
   ======================================== */

@media (prefers-reduced-motion: reduce) {
  .background-orb {
    animation: none;
  }
}
</style>