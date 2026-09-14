
<template>
<div class="app-shell" :class="theme">
  <header class="site-header">
    <button class="menu-button" @click="menuOpen=!menuOpen">☰</button>
   
    <RouterLink class="brand" to="/">
      <span class="brand-mark">🤝</span>
      <span class="brand-name">STOCK<span>WELL</span></span>
    </RouterLink>
    <nav class="desktop-nav">
      <RouterLink to="/" @click="menuOpen=false">Home</RouterLink>
      <RouterLink to="/catalogue" @click="menuOpen=false">Catalogue</RouterLink>
      
    </nav>

    <div class="header-actions">
      <RouterLink class="icon-button" to="/catalogue">⌕</RouterLink>


      <div class="basket-button"><span class="basket-symbol">🛒</span><span class="basket-count">{{ cartCount }}</span></div>

      
      <!-- THEME -->
      <button
        class="nav-icon theme-button"
        @click="toggleTheme"
      >
        {{ theme === "dark" ? "☀" : "☾" }}
      </button>

      <button class="logout-btn" @click="logout">Logout</button>
    </div>
  </header>

  <nav v-if="menuOpen" class="mobile-nav">
    <RouterLink to="/" @click="menuOpen=false">Home</RouterLink>
    <RouterLink to="/catalogue" @click="menuOpen=false">Catalogue</RouterLink>
    <RouterLink to="/member/" @click="menuOpen=false">Stokvel Groups</RouterLink>
    <RouterLink to="/admin" @click="menuOpen=false">Admin</RouterLink>
    <button @click="logout">Logout</button>
  </nav>

  <main><RouterView :theme="theme" /></main>

  <footer class="site-footer">
    <div><strong>STOCK<span>WELL</span></strong><p>Wholesale shopping made for SA stokvels • R50B economy • 82.5% women-led</p></div>
    <div class="footer-right">One group. One goal. Better savings. 🤝</div>
  </footer>
</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"; 
import { useRouter } from "vue-router";

const router = useRouter(); 
const isDark = ref(true); 
const theme = ref('dark'); 
const menuOpen = ref(false); 
const cartCount = ref(Number(localStorage.getItem('basketCount')||0));

function toggleTheme(){ 
  isDark.value=!isDark.value; 
  theme.value=isDark.value?'dark':'light'; 
  document.body.className=theme.value; 
  localStorage.setItem('theme',theme.value); 
}

function logout(){ 
  localStorage.clear(); 
  cartCount.value=0; 
  router.push('/'); 
  alert('Logged out 🤝'); 
}

function updateCart(e){ 
  cartCount.value=e.detail; 
}

onMounted(()=>{ 
 
  const saved=localStorage.getItem('theme')||'dark'; 
  theme.value=saved; isDark.value=saved==='dark'; 
  document.body.className=saved; window.addEventListener('basket-updated', updateCart); });
onBeforeUnmount(()=> window.removeEventListener('basket-updated', updateCart));
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap");

:root{--gold:#C8B019; 
  --purple:#795D89; 
  --cream:#EDE7F6; 
  --dark:#130E23; 
  --line:#D4CCEC; 
  font-family:"Space Grotesk", sans-serif;}

*{box-sizing:border-box;} 
body{
  margin:0; 
  min-width:320px; 
  background:#130E23; 
  color:#EDE7F6;
} 
  
  body.light{
    background:#EDE7F6; 
    color:#221A3A;
  }

.app-shell{
  min-height:100vh; 
  display:flex; 
  flex-direction:column;
} 
main{
  flex:1;
}

.site-header{
  height:68px; 
  padding:0 24px; 
  display:flex; 
  align-items:center; 
  gap:20px; 
  background:rgba(36,30,56,0.95); 
  border-bottom:1px solid rgba(167,139,250,0.2); 
  position:sticky; 
  top:0; z-index:1000; 
  backdrop-filter:blur(10px);
}

body.light .site-header{
  background:rgba(255,255,255,0.92);
}

.brand{
  display:flex; 
  align-items:center; 
  gap:10px; 
  text-decoration:none; 
  color:inherit; 
  min-width:160px;
}

.brand-mark{
  width:42px; 
  height:42px; 
  border-radius:50%; 
  background:var(--gold); 
  color:#221A3A; 
  display:grid; 
  place-items:center; 
  font-size:22px; 
  border:2px solid var(--gold);
}

.brand-name{
  font-size:20px; 
  font-weight:800; 
  letter-spacing:0.06em;
} 

.brand-name span{
  color:var(--gold);
}

.desktop-nav{
  flex:1; 
  display:flex; 
  justify-content:center; 
  gap:28px;
} 

.desktop-nav a{
  font-family:"DM Mono"; 
  font-size:11px; 
  text-transform:uppercase; 
  text-decoration:none; 
  color:inherit; 
  letter-spacing:0.5px; 
  transition:0.2s;
} 

.desktop-nav a:hover,.desktop-nav .router-link-active{
  color:var(--gold);
}

.header-actions{
  display:flex; 
  align-items:center; 
  gap:10px;
}

 .icon-button{
  font-size:20px; 
  text-decoration:none; 
  color:inherit;
}


.basket-button{
  width:40px; 
  height:40px;   
  display:grid; 
  place-items:center; 
  position:relative;
} 

.basket-button b{
  position:absolute; 
  top:-4px; 
  right:-4px; 
  width:18px; 
  height:18px; 
  background:var(--gold); 
  color:black; font:700 10px "DM Mono"; 
  border-radius:50%; 
  display:grid; 
  place-items:center;
}

/* =========================
   BASKET COUNT
========================= */

.basket-button {
  position: relative;
}

.basket-count {
  position: absolute;
  top: -4px;
  right: -3px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #c2583d;
  color: white;
  font-size: 10px;
  font-weight: 700;
}


.logout-btn{
  border:1px solid var(--line); 
  background:var(--card,#fff); 
  color:inherit; padding:8px 14px; 
  border-radius:20px; font-family:"DM Mono"; 
  font-size:11px; cursor:pointer;} 
  
  .logout-btn:hover{
    background:var(--gold); 
    color:#221A3A; 
    border-color:var(--gold);
  }

.menu-button{
  display:none; 
  background:transparent; 
  border:0; color:inherit; 
  font-size:20px;
}

.mobile-nav{
  display:none;
}

.site-footer{
  padding:24px; 
  background:#1A102E; 
  border-top:1px solid rgba(167,139,250,0.2); 
  display:flex; 
  justify-content:space-between; 
  color:#9B92B5; 
  font-size:12px;
}

.site-footer strong{
  color:white; 
  font-size:16px;
} 
.site-footer strong span{
  color:var(--gold);
}
@media(max-width:900px){
  .desktop-nav{display:none;}

   .menu-button{display:block;} 

   .mobile-nav{display:flex; 
   flex-direction:column; 
   background:#241E38; 
   border-bottom:1px solid var(--gold); 
   padding:10px;} 

   .mobile-nav a,

   .mobile-nav button{
    padding:12px 20px; 
    font-family:"DM Mono"; 
    font-size:12px; 
    text-transform:uppercase; 
    color:white; 
    text-decoration:none; 
    background:transparent; 
    border:0; 
    text-align:left; 
    border-bottom:1px solid rgba(255,255,255,0.1);} 
    }
</style>



