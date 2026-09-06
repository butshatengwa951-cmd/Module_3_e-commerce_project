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
.glass-card {
  position: relative;

  width: min(520px, 90%);

  padding: 48px;

  overflow: hidden;

  border-radius: 28px;

  isolation: isolate;

  backdrop-filter:
    blur(24px)
    saturate(130%);

  -webkit-backdrop-filter:
    blur(24px)
    saturate(130%);

  box-shadow:
    0 25px 70px
    rgba(49, 43, 80, 0.18),

    inset 0 1px 1px
    rgba(255, 255, 255, 0.45),

    inset 0 -1px 1px
    rgba(49, 43, 80, 0.08);

  animation:
    glassAppear
    900ms
    cubic-bezier(0.22, 1, 0.36, 1)
    both;
}


/* ========================================
   LIGHT GLASS
   ======================================== */

.glass-light {
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.42),
      rgba(255, 255, 255, 0.18)
    );

  border:
    1px solid
    rgba(255, 255, 255, 0.48);

  color: #312b50;
}


/* ========================================
   DARK GLASS
   ======================================== */

.glass-dark {
  background:
    linear-gradient(
      135deg,
      rgba(15, 15, 18, 0.52),
      rgba(15, 15, 18, 0.24)
    );

  border:
    1px solid
    rgba(255, 255, 255, 0.15);

  color: #f7f5f1;

  box-shadow:
    0 25px 70px
    rgba(0, 0, 0, 0.4),

    inset 0 1px 1px
    rgba(255, 255, 255, 0.12),

    inset 0 -1px 1px
    rgba(0, 0, 0, 0.25);
}


/* ========================================
   GLASS HIGHLIGHT
   ======================================== */

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
}


/* ========================================
   GLASS NOISE
   ======================================== */

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
}


/* ========================================
   CONTENT
   ======================================== */

.glass-content {
  position: relative;

  z-index: 2;
}


/* ========================================
   HOVER
   ======================================== */

.glass-card:hover {
  box-shadow:
    0 30px 80px
    rgba(49, 43, 80, 0.22),

    inset 0 1px 1px
    rgba(255, 255, 255, 0.55),

    inset 0 -1px 1px
    rgba(49, 43, 80, 0.08);
}


/* ========================================
   ENTRANCE
   ======================================== */

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


/* ========================================
   MOBILE
   ======================================== */

@media (max-width: 768px) {

  .glass-card {
    width: 90%;

    padding: 32px 24px;

    border-radius: 22px;
  }
}


/* ========================================
   REDUCED MOTION
   ======================================== */

@media (prefers-reduced-motion: reduce) {

  .glass-card {
    animation: none;
  }
}
</style>