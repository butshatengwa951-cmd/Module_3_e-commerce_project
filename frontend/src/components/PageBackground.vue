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

  z-index: 0;

  overflow: hidden;

  pointer-events: none;
}


/* =========================================================
   ORBS
   ========================================================= */

.background-orb {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(var(--sw-orb-blur));

  opacity: var(--sw-orb-opacity);
}


/* Gold */

.orb-gold {
  width: 38vw;
  height: 38vw;

  top: -14%;
  left: -10%;

  background: var(--sw-orb-gold);

  animation:
    pageOrbGold
    16s
    ease-in-out
    infinite;
}


/* Orange */

.orb-orange {
  width: 34vw;
  height: 34vw;

  top: 8%;
  right: -12%;

  background: var(--sw-orb-orange);

  animation:
    pageOrbOrange
    19s
    ease-in-out
    infinite;
}


/* Purple */

.orb-purple {
  width: 42vw;
  height: 42vw;

  bottom: -22%;
  left: 22%;

  background: var(--sw-orb-purple);

  animation:
    pageOrbPurple
    21s
    ease-in-out
    infinite;
}


/* Lavender */

.orb-lavender {
  width: 28vw;
  height: 28vw;

  bottom: 10%;
  right: 18%;

  background: var(--sw-orb-lavender);

  animation:
    pageOrbLavender
    18s
    ease-in-out
    infinite;
}


/* =========================================================
   GRAIN
   ========================================================= */

.page-grain {
  position: absolute;
  inset: 0;

  pointer-events: none;

  opacity: var(--sw-grain-opacity);

  background-image:
    radial-gradient(
      var(--sw-grain-dot) 0.7px,
      transparent 0.7px
    );

  background-size: 5px 5px;

  mix-blend-mode: soft-light;
}


/* =========================================================
   ANIMATIONS
   ========================================================= */

@keyframes pageOrbGold {
  0%,
  100% {
    transform:
      translate(0, 0)
      scale(1);
  }

  50% {
    transform:
      translate(80px, 40px)
      scale(1.15);
  }
}


@keyframes pageOrbOrange {
  0%,
  100% {
    transform:
      translate(0, 0)
      scale(1);
  }

  50% {
    transform:
      translate(-70px, 60px)
      scale(1.12);
  }
}


@keyframes pageOrbPurple {
  0%,
  100% {
    transform:
      translate(0, 0)
      scale(1);
  }

  50% {
    transform:
      translate(45px, -55px)
      scale(1.1);
  }
}


@keyframes pageOrbLavender {
  0%,
  100% {
    transform:
      translate(0, 0)
      scale(1);
  }

  50% {
    transform:
      translate(-40px, -45px)
      scale(1.08);
  }
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {
  .background-orb {
    filter: blur(60px);
  }
}


/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .background-orb {
    animation: none;
  }
}
</style>