<template>
  <div class="page-background" aria-hidden="true">
    <div class="page-base"></div>

    <div class="page-gradient"></div>

    <div class="background-orb orb-gold"></div>
    <div class="background-orb orb-orange"></div>
    <div class="background-orb orb-purple"></div>
    <div class="background-orb orb-lavender"></div>

    <div class="page-vignette"></div>
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

  background: var(--sw-page-background);

  isolation: isolate;

  transition:
    background-color var(--sw-transition-slow);
}


/* =========================================================
   BASE
   ========================================================= */

.page-base {
  position: absolute;
  inset: 0;

  z-index: 0;

  background: var(--sw-page-background);

  transition:
    background-color var(--sw-transition-slow);
}


/* =========================================================
   GRADIENT ATMOSPHERE
   ========================================================= */

.page-gradient {
  position: absolute;
  inset: -8%;

  z-index: 1;

  background: var(--sw-page-gradient);

  opacity: 0.88;

  transform: scale(1.04);

  transition:
    opacity var(--sw-transition-slow);

  animation:
    pageGradientDrift
    24s
    ease-in-out
    infinite;
}


/* =========================================================
   ORBS
   ========================================================= */

.background-orb {
  position: absolute;

  z-index: 2;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(var(--sw-orb-blur));

  opacity: var(--sw-orb-opacity);

  mix-blend-mode: screen;

  will-change: transform;

  transition:
    opacity var(--sw-transition-slow),
    background-color var(--sw-transition-slow);
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
   VIGNETTE
   ========================================================= */

.page-vignette {
  position: absolute;
  inset: 0;

  z-index: 3;

  pointer-events: none;

  background:
    radial-gradient(
      circle at center,
      transparent 38%,
      rgba(17,16,25,0.08) 72%,
      rgba(17,16,25,0.2) 100%
    );

  opacity: 0.75;

  transition:
    opacity var(--sw-transition-slow);
}


/* =========================================================
   GRAIN
   ========================================================= */

.page-grain {
  position: absolute;
  inset: 0;

  z-index: 4;

  pointer-events: none;

  opacity: var(--sw-grain-opacity);

  background-image:
    radial-gradient(
      var(--sw-grain-dot) 0.7px,
      transparent 0.7px
    );

  background-size: 5px 5px;

  mix-blend-mode: soft-light;

  transition:
    opacity var(--sw-transition-slow);
}


/* =========================================================
   LIGHT MODE
   ========================================================= */

:global(html.light-mode) .page-vignette {
  background:
    radial-gradient(
      circle at center,
      transparent 40%,
      rgba(49,43,80,0.05) 74%,
      rgba(49,43,80,0.12) 100%
    );
}

:global(html.light-mode) .background-orb {
  mix-blend-mode: multiply;
}


/* =========================================================
   DARK MODE
   ========================================================= */

:global(html.dark-mode) .page-gradient {
  opacity: 1;
}

:global(html.dark-mode) .background-orb {
  mix-blend-mode: screen;
}

:global(html.dark-mode) .page-vignette {
  opacity: 0.9;
}


/* =========================================================
   ANIMATIONS
   ========================================================= */

@keyframes pageGradientDrift {
  0%,
  100% {
    transform:
      scale(1.04)
      translate3d(0, 0, 0);
  }

  50% {
    transform:
      scale(1.08)
      translate3d(-1.5%, 1%, 0);
  }
}


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

  .page-gradient {
    inset: -14%;

    transform: scale(1.08);
  }

  .page-vignette {
    opacity: 0.65;
  }
}


/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .page-gradient,
  .background-orb {
    animation: none;
  }

  .page-background,
  .page-base,
  .page-gradient,
  .background-orb,
  .page-vignette,
  .page-grain {
    transition: none;
  }
}
</style>