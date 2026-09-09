<template>
  <div style="position:fixed; inset:0; z-index:50; display:grid; place-items:center; background:rgba(17,16,25,0.45); backdrop-filter:blur(10px)">
    <div class="glass" style="padding:32px; width:420px; max-width:90vw; text-align:center; border-radius:20px">
      <div style="width:56px; height:56px; border-radius:999px; background:linear-gradient(90deg,#4b3f6b,#b86a5a); margin:0 auto 16px; display:grid; place-items:center; color:white; font-size:24px">✓</div>
      <div style="font-size:18px; font-weight:600">Payment Successful</div>
      <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-top:8px">Order confirmed. Redirecting to delivery tracking (real schema).</div>
      <div style="margin-top:20px; height:4px; border-radius:999px; background:rgba(0,0,0,0.08); overflow:hidden"><div style="height:100%; background:linear-gradient(90deg,#4b3f6b,#b86a5a); animation:load 1.8s linear forwards"></div></div>
    </div>
  </div>
</template>
<script setup>defineEmits(['close'])</script>
<style>@keyframes load{from{width:0%}to{width:100%}}</style>
