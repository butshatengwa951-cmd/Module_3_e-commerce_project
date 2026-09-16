<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const active = ref(null);

function choose(type) {
  active.value = type;
  setTimeout(() => router.push(type === "login" ? "/login" : "/signup"), 450);
}
</script>

<template>
  <main class="auth-selector">
    <div class="auth-brand">STOCK<span>WELL</span></div>

    <section class="auth-panel login-panel" @mouseenter="active = 'login'" @mouseleave="active = null" @click="choose('login')">
      <div class="orb orb-a"></div><div class="orb orb-b"></div><div class="grain"></div>
      <div class="content">
        <span>WELCOME BACK</span>
        <h1>LOGIN</h1>
        <p>Continue your StockWell journey</p>
        <button type="button">Enter StockWell →</button>
      </div>
    </section>

    <section class="auth-panel signup-panel" @mouseenter="active = 'signup'" @mouseleave="active = null" @click="choose('signup')">
      <div class="light light-a"></div><div class="light light-b"></div><div class="grain"></div>
      <div class="content">
        <span>START TODAY</span>
        <h1>SIGN UP</h1>
        <p>Join your StockWell community</p>
        <button type="button">Create your account →</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-selector{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;background:#f5f2ec;color:#241a35;font-family:"Space Grotesk",sans-serif;position:relative}
.auth-brand{position:absolute;top:28px;left:32px;z-index:20;font-family:"DM Mono",monospace;font-weight:700;letter-spacing:.08em;color:#fff;text-shadow:0 2px 15px rgba(0,0,0,.25)}
.auth-brand span{color:#d8b46a}.auth-panel{min-height:100vh;display:grid;place-items:center;position:relative;overflow:hidden;cursor:pointer;transition:filter .4s,transform .4s}.auth-panel:hover{filter:saturate(1.08)}
.login-panel{background:linear-gradient(135deg,#28183d,#59336f 45%,#c45d32)}.signup-panel{background:#f5f2ec}.content{position:relative;z-index:5;text-align:center;width:min(520px,78%)}.content span{font:11px "DM Mono",monospace;letter-spacing:.2em;opacity:.7}.content h1{font-size:clamp(3rem,6vw,6rem);line-height:.95;margin:18px 0 14px;letter-spacing:-.06em}.content p{font-size:16px;opacity:.72}.content button{margin-top:26px;border:1px solid currentColor;background:rgba(255,255,255,.08);color:inherit;padding:11px 18px;border-radius:999px;cursor:pointer}.signup-panel .content button{background:#241a35;color:#fff;border-color:#241a35}.orb,.light{position:absolute;border-radius:50%;filter:blur(55px);pointer-events:none}.orb-a{width:420px;height:420px;background:#d8b46a;left:-130px;top:-120px;opacity:.45}.orb-b{width:360px;height:360px;background:#f07b4e;right:-100px;bottom:-100px;opacity:.5}.light-a{width:240px;height:240px;background:#d8b46a;left:5%;top:8%;opacity:.3}.light-b{width:300px;height:300px;background:#8a6aa8;right:0;bottom:0;opacity:.18}.grain{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.22) .7px,transparent .7px);background-size:6px 6px;opacity:.08}
@media(max-width:700px){.auth-selector{grid-template-columns:1fr}.auth-panel{min-height:50vh}.auth-brand{color:#241a35}.login-panel .auth-brand{color:#fff}}
</style>
