<script setup>
defineProps({
  variant: {
    type: String,
    default: "light",
  },
});
</script>

<template>
  <section
    class="glass-card"
    :class="`glass-${variant}`"
  >
    <div class="glass-highlight"></div>

    <div class="glass-noise"></div>

    <div class="glass-content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
/* =========================================================
   BASE GLASS
   ========================================================= */

.glass-card {
  position: relative;

  width: min(520px, 90%);

  padding: var(--sw-space-13);

  overflow: hidden;

  border-radius: var(--sw-radius-xl);

  isolation: isolate;

  backdrop-filter:
    blur(var(--sw-glass-blur))
    saturate(var(--sw-glass-saturation));

  -webkit-backdrop-filter:
    blur(var(--sw-glass-blur))
    saturate(var(--sw-glass-saturation));

  animation:
    glassAppear
    var(--sw-transition-slow)
    both;

  transition:
    background var(--sw-transition-slow),
    border-color var(--sw-transition-slow),
    color var(--sw-transition-slow),
    box-shadow var(--sw-transition-slow),
    transform var(--sw-transition);
}


/* =========================================================
   LIGHT GLASS
   ========================================================= */

.glass-light {
  background: var(--sw-glass-light);

  border:
    1px solid
    var(--sw-glass-light-border);

  color: var(--sw-glass-light-text);

  box-shadow:
    var(--sw-glass-shadow-light);
}


/* =========================================================
   DARK GLASS
   ========================================================= */

.glass-dark {
  background: var(--sw-glass-dark);

  border:
    1px solid
    var(--sw-glass-dark-border);

  color: var(--sw-glass-dark-text);

  box-shadow:
    var(--sw-glass-shadow-dark);
}


/* =========================================================
   THEME ADAPTATION
   ========================================================= */

/*
   When a light glass card is used inside dark mode,
   automatically soften it into the dark glass treatment.
   This protects pages that still pass variant="light".
*/

:global(html.dark-mode) .glass-light {
  background: var(--sw-glass-dark);

  border-color:
    var(--sw-glass-dark-border);

  color:
    var(--sw-glass-dark-text);

  box-shadow:
    var(--sw-glass-shadow-dark);
}

:global(html.dark-mode) .glass-light:hover {
  box-shadow:
    var(--sw-glass-shadow-dark-hover);
}


/* =========================================================
   HIGHLIGHT
   ========================================================= */

.glass-highlight {
  position: absolute;

  top: 0;
  left: 10%;

  width: 80%;
  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.85),
      transparent
    );

  opacity: 0.7;

  pointer-events: none;

  transition:
    opacity var(--sw-transition-slow);
}


/* Light-mode highlight */

:global(html.light-mode) .glass-highlight {
  opacity: 0.82;
}


/* Dark-mode highlight */

:global(html.dark-mode) .glass-highlight {
  opacity: 0.46;
}


/* =========================================================
   NOISE
   ========================================================= */

.glass-noise {
  position: absolute;

  inset: 0;

  z-index: -1;

  pointer-events: none;

  opacity: 0.08;

  background-image:
    radial-gradient(
      rgba(255, 255, 255, 0.9) 0.6px,
      transparent 0.7px
    );

  background-size: 5px 5px;

  mix-blend-mode: soft-light;

  transition:
    opacity var(--sw-transition-slow);
}


/* Dark mode gets slightly stronger texture */

:global(html.dark-mode) .glass-noise {
  opacity: 0.1;
}


/* =========================================================
   CONTENT
   ========================================================= */

.glass-content {
  position: relative;

  z-index: 2;
}


/* =========================================================
   HOVER
   ========================================================= */

.glass-card:hover {
  transform: translateY(-2px);
}

.glass-light:hover {
  box-shadow:
    var(--sw-glass-shadow-light-hover);
}

.glass-dark:hover {
  box-shadow:
    var(--sw-glass-shadow-dark-hover);
}


/* =========================================================
   DARK-MODE HOVER
   ========================================================= */

:global(html.dark-mode) .glass-light:hover {
  box-shadow:
    var(--sw-glass-shadow-dark-hover);
}


/* =========================================================
   ENTRANCE
   ========================================================= */

@keyframes glassAppear {
  0% {
    opacity: 0;

    transform:
      translateY(35px)
      scale(0.96);

    filter: blur(8px);
  }

  100% {
    opacity: 1;

    transform:
      translateY(0)
      scale(1);

    filter: blur(0);
  }
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (max-width: 768px) {
  .glass-card {
    width: 90%;

    padding:
      var(--sw-space-11)
      var(--sw-space-8);

    border-radius: var(--sw-radius-lg);
  }

  .glass-card:hover {
    transform: none;
  }
}


/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .glass-card {
    animation: none;

    transition: none;
  }

  .glass-card:hover {
    transform: none;
  }
}
</style>