<template>
  <div style="position:fixed; inset:0; z-index:50; display:grid; place-items:center; background:rgba(19,14,35,0.6); backdrop-filter:blur(10px)">
    <div class="glass" style="padding:32px; width:420px; max-width:90vw; text-align:center; border-radius:16px; background:#211a31; border:1px solid rgba(255,255,255,0.12); font-family:&quot;Space Grotesk&quot;, sans-serif">
      <div style="width:56px; height:56px; border-radius:999px; background:linear-gradient(90deg,#795d89,#c8b019); margin:0 auto 16px; display:grid; place-items:center; color:#211a2d; font-size:24px">✓</div>
      <div style="font-size:18px; font-weight:600; color:#f4eff8">Payment Successful</div>
      <div style="font-size:12px; color:rgba(244,239,248,0.65); margin-top:8px">Order confirmed. Redirecting you to delivery tracking.</div>
      <div style="margin-top:20px; height:4px; border-radius:999px; background:rgba(255,255,255,0.1); overflow:hidden"><div style="height:100%; background:linear-gradient(90deg,#795d89,#c8b019); animation:load 1.8s linear forwards"></div></div>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from "vue";
const emit = defineEmits(['close']);
onMounted(() => {
  setTimeout(() => emit('close'), 1800);
});
</script>
<style>@keyframes load{from{width:0%}to{width:100%}}</style>
