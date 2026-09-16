<template>
  <div class="catalogue-page">
    <section class="catalogue-hero">
      <div>
        <p class="eyebrow">STOCKWELL MARKET</p>
        <h1>Groceries for <span>your group.</span></h1>
        <p class="hero-copy">Compare supplier prices, choose your best deal and explore your stokvel's bulk-shopping options.</p>
      </div>
      <div class="basket-summary">
        <span>GROUP BASKET</span>
        <strong>{{ basketCount }}</strong>
        <small>items added</small>
        <RouterLink v-if="isAuthenticated" to="/cart">View basket →</RouterLink>
        <RouterLink v-else to="/login-signup">Join to start a basket →</RouterLink>
      </div>
    </section>

    <section class="shop-toolbar">
      <button class="category-button" type="button" @click="showCategories = !showCategories">☰ Categories <b>{{ showCategories ? "↑" : "↓" }}</b></button>
      <label class="search-box"><span>⌕</span><input v-model="search" type="search" placeholder="Search groceries..." /></label>
      <select v-model="sortOption" aria-label="Sort products">
        <option value="default">Recommended</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name A-Z</option>
      </select>
    </section>

    <transition name="category-slide">
      <section v-if="showCategories" class="category-panel">
        <div class="category-title"><span>CATEGORIES</span><small>Choose what your group needs</small></div>
        <div class="category-list">
          <button v-for="category in categories" :key="category" type="button" :class="{ active: selectedCategory === category }" @click="selectCategory(category)">
            <span>{{ getCategoryIcon(category) }}</span>{{ category }}
          </button>
        </div>
      </section>
    </transition>

    <div v-if="selectedCategory !== 'All Products'" class="active-filter">Showing: <strong>{{ selectedCategory }}</strong><button type="button" @click="selectedCategory = 'All Products'">×</button></div>

    <main class="products-area">
      <div v-if="message" class="toast">{{ message }}</div>
      <div v-if="loading" class="state"><div class="loader"></div><p>Loading StockWell groceries...</p></div>
      <div v-else-if="errorMessage" class="state error"><strong>We couldn't load the catalogue.</strong><p>{{ errorMessage }}</p></div>

      <div v-else-if="filteredProducts.length" class="product-grid">
        <article v-for="product in filteredProducts" :key="product.product_id" class="product-card">
          <div class="product-image">
            <span v-if="getSaving(product) > 0" class="deal-badge">BEST DEAL</span><span class="bulk-badge">10+</span>
            <img :src="getProductImage(product)" :alt="product.product_name" @error="handleImageError" />
          </div>
          <div class="product-info">
            <span class="category-label">{{ product.category }}</span>
            <h2>{{ product.product_name }}</h2>
            <p class="description">{{ product.description || "Quality household essential." }}</p>
            <div class="price-row"><div><small>Best group price</small><strong>R{{ getLowestPrice(product).toFixed(2) }}</strong></div><div v-if="getSaving(product) > 0" class="saving">Save R{{ getSaving(product).toFixed(2) }}</div></div>
            <div class="best-supplier"><span>BEST SUPPLIER</span><strong>{{ getCheapestSupplier(product) || "Price unavailable" }}</strong></div>
            <div class="stock-row"><span>{{ product.quantity_available }} available</span><span :class="product.quantity_available > 20 ? 'in-stock' : 'low-stock'">{{ product.quantity_available > 20 ? "IN STOCK" : "LOW STOCK" }}</span></div>
            <button class="compare-button" type="button" @click="toggleProduct(product.product_id)">Compare suppliers <span>{{ expandedProduct === product.product_id ? "↑" : "↓" }}</span></button>
            <div v-if="expandedProduct === product.product_id" class="supplier-list">
              <div v-for="supplier in product.supplier_prices" :key="supplier.supplier_price_id" class="supplier-row" :class="{ cheapest: Number(supplier.price) === getLowestPrice(product) }">
                <div><strong>{{ supplier.supplier_name }}</strong><small>Minimum {{ supplier.minimum_quantity }}</small></div><span>R{{ Number(supplier.price).toFixed(2) }}</span>
              </div>
            </div>
            <button class="add-button" type="button" @click="addToBasket(product)"><span>+</span> Add to Group Basket</button>
          </div>
        </article>
      </div>

      <div v-else class="empty-state"><div>🧺</div><h2>No groceries found</h2><p>Try another search or category.</p><button type="button" @click="resetFilters">Show all products</button></div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getProducts, getCart, addCartItem } from "../services/api.js";

import rice from "../assets/tastic-rice.png";
import whiteStar from "../assets/white-star.png";
import beans from "../assets/beans.png";
import cornflakes from "../assets/cornflakes.png";
import curryPowder from "../assets/curry-powder.png";
import hulets from "../assets/hulets.png";
import instant from "../assets/instant.png";
import maizeMeal from "../assets/maize-meal.png";
import mayonnaise from "../assets/mayonnaise.png";
import ricoffy from "../assets/ricoffy.png";
import sunfoil from "../assets/sunfoil.png";
import tomatoSauce from "../assets/tomato-sauce.png";

const products = ref([]);
const search = ref("");
const selectedCategory = ref("All Products");
const sortOption = ref("default");
const expandedProduct = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const message = ref("");
const showCategories = ref(false);
const isAuthenticated = ref(false);
const basketCount = ref(0);

const categories = ["All Products", "Staples", "Cooking Essentials", "Food", "Canned Food", "Spices", "Breakfast", "Beverages"];
const imageFallback = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&h=700&fit=crop";

function syncAuth() {
  isAuthenticated.value = Boolean(localStorage.getItem("token") || localStorage.getItem("sw_token"));
}

async function syncCloudBasket() {
  if (!isAuthenticated.value) {
    basketCount.value = 0;
    return;
  }

  try {
    const response = await getCart();
    basketCount.value = (response.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0);
    localStorage.setItem("basketCount", String(basketCount.value));
  } catch (error) {
    console.error("Cloud basket loading failed:", error);
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("stokvel");
      syncAuth();
    }
  }
}

function getCategoryIcon(category) {
  return { "All Products": "🛍️", Staples: "🌾", "Cooking Essentials": "🍳", Food: "🍎", "Canned Food": "🥫", Spices: "🌶️", Breakfast: "🥣", Beverages: "☕" }[category] || "🛍️";
}
function selectCategory(category) { selectedCategory.value = category; showCategories.value = false; }
function resetFilters() { search.value = ""; selectedCategory.value = "All Products"; sortOption.value = "default"; }
function getProductImage(product) {
  const name = (product.product_name || "").toLowerCase();
  if (name.includes("white star")) return whiteStar;
  if (name.includes("tastic rice")) return rice;
  if (name.includes("sunfoil")) return sunfoil;
  if (name.includes("iwisa")) return maizeMeal;
  if (name.includes("all gold")) return tomatoSauce;
  if (name.includes("koo")) return beans;
  if (name.includes("pakco")) return curryPowder;
  if (name.includes("ace")) return instant;
  if (name.includes("crosse")) return mayonnaise;
  if (name.includes("huletts")) return hulets;
  if (name.includes("ricoffy")) return ricoffy;
  if (name.includes("kellogg")) return cornflakes;
  return product.image_url || imageFallback;
}
function handleImageError(event) { if (event.target.src !== imageFallback) event.target.src = imageFallback; }
function getLowestPrice(product) { return product.supplier_prices?.length ? Math.min(...product.supplier_prices.map((s) => Number(s.price))) : 0; }
function getHighestPrice(product) { return product.supplier_prices?.length ? Math.max(...product.supplier_prices.map((s) => Number(s.price))) : 0; }
function getSaving(product) { return product.supplier_prices?.length >= 2 ? getHighestPrice(product) - getLowestPrice(product) : 0; }
function getCheapestSupplier(product) {
  if (!product.supplier_prices?.length) return "";
  return product.supplier_prices.reduce((lowest, supplier) => Number(supplier.price) < Number(lowest.price) ? supplier : lowest).supplier_name;
}
function toggleProduct(id) { expandedProduct.value = expandedProduct.value === id ? null : id; }

async function addToBasket(product) {
  syncAuth();
  if (!isAuthenticated.value) {
    message.value = "Please join or log in before adding items to your group basket.";
    window.setTimeout(() => { message.value = ""; }, 3500);
    return;
  }

  try {
    await addCartItem({ product_id: product.product_id, supplier_price_id: null, quantity: 1 });
    await syncCloudBasket();
    window.dispatchEvent(new CustomEvent("basket-updated", { detail: basketCount.value }));
    message.value = `${product.product_name} added to your group's cloud basket.`;
  } catch (error) {
    console.error("Cloud basket add failed:", error);
    message.value = error.response?.data?.message || "We could not add this product to the group basket.";
  }
  window.setTimeout(() => { message.value = ""; }, 3000);
}

const filteredProducts = computed(() => {
  let result = products.value.filter((product) => {
    const name = product.product_name || "";
    const category = product.category || "";
    return name.toLowerCase().includes(search.value.toLowerCase()) && (selectedCategory.value === "All Products" || category === selectedCategory.value);
  });
  if (sortOption.value === "price-low") result = [...result].sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
  if (sortOption.value === "price-high") result = [...result].sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
  if (sortOption.value === "name") result = [...result].sort((a, b) => a.product_name.localeCompare(b.product_name));
  return result;
});

function handleAuthChange() { syncAuth(); syncCloudBasket(); }

onMounted(async () => {
  syncAuth();
  try {
    const response = await getProducts();
    products.value = Array.isArray(response) ? response : response.products || [];
    await syncCloudBasket();
  } catch (error) {
    console.error("Catalogue loading failed:", error);
    errorMessage.value = "Please make sure the StockWell API is running and try again.";
  } finally { loading.value = false; }
  window.addEventListener("login-completed", handleAuthChange);
  window.addEventListener("auth-updated", handleAuthChange);
});

onUnmounted(() => {
  window.removeEventListener("login-completed", handleAuthChange);
  window.removeEventListener("auth-updated", handleAuthChange);
});
</script>

<style scoped>
.catalogue-page { min-height: 100vh; padding: clamp(28px,5vw,64px) clamp(16px,4vw,56px) 72px; background: var(--sw-page-background); color: var(--sw-page-text); }
.catalogue-hero { max-width:1180px; margin:0 auto 28px; display:grid; grid-template-columns:1fr auto; gap:28px; align-items:end; }
.eyebrow,.category-title>span,.basket-summary>span,.best-supplier>span { font-family:"DM Mono",monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--sw-gold-500); }
h1 { margin:8px 0 12px; font-size:clamp(38px,6vw,72px); line-height:.98; letter-spacing:-.04em; } h1 span { color:var(--sw-gold-500); }
.hero-copy { max-width:620px; opacity:.78; font-size:16px; line-height:1.7; }
.basket-summary,.shop-toolbar,.category-panel,.product-card,.empty-state { border:1px solid var(--sw-glass-border); background:var(--sw-glass-light); backdrop-filter:blur(var(--sw-glass-blur)); box-shadow:var(--sw-shadow-soft); }
.basket-summary { min-width:190px; padding:20px; border-radius:18px; display:grid; gap:5px; } .basket-summary strong { font-size:38px; } .basket-summary small { opacity:.65; } .basket-summary a { color:var(--sw-gold-500); margin-top:8px; text-decoration:none; font-weight:700; }
.shop-toolbar { max-width:1180px; margin:0 auto 14px; padding:12px; border-radius:16px; display:grid; grid-template-columns:auto 1fr auto; gap:10px; }
.shop-toolbar button,.shop-toolbar select,.search-box,.category-list button,.add-button,.compare-button,.empty-state button { border:1px solid var(--sw-glass-border); border-radius:12px; font:inherit; }
.category-button,.shop-toolbar select { background:var(--sw-input-background); color:var(--sw-page-text); padding:12px 15px; cursor:pointer; }
.search-box { display:flex; align-items:center; gap:10px; padding:0 14px; background:var(--sw-input-background); } .search-box input { width:100%; border:0; outline:0; background:transparent; color:inherit; padding:12px 0; }
.category-panel { max-width:1180px; margin:0 auto 18px; padding:18px; border-radius:16px; } .category-title { display:grid; gap:4px; margin-bottom:12px; } .category-title small { opacity:.65; } .category-list { display:flex; flex-wrap:wrap; gap:8px; } .category-list button { padding:10px 14px; background:var(--sw-input-background); color:inherit; cursor:pointer; } .category-list button.active { border-color:var(--sw-gold-500); color:var(--sw-gold-500); }
.active-filter { max-width:1180px; margin:0 auto 14px; font-size:14px; } .active-filter button { border:0; background:transparent; color:inherit; cursor:pointer; font-size:20px; margin-left:5px; }
.products-area { max-width:1180px; margin:0 auto; } .product-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(270px,1fr)); gap:18px; } .product-card { border-radius:20px; overflow:hidden; }
.product-image { height:240px; position:relative; display:grid; place-items:center; padding:20px; background:rgba(255,255,255,.04); } .product-image img { max-width:100%; max-height:205px; object-fit:contain; }
.deal-badge,.bulk-badge { position:absolute; top:12px; padding:6px 9px; border-radius:999px; font-family:"DM Mono",monospace; font-size:9px; z-index:1; } .deal-badge { left:12px; background:var(--sw-gold-500); color:#171022; } .bulk-badge { right:12px; background:var(--sw-purple-700); color:white; }
.product-info { padding:20px; } .category-label { color:var(--sw-gold-500); font-family:"DM Mono",monospace; font-size:10px; text-transform:uppercase; } .product-info h2 { margin:7px 0; font-size:21px; } .description { min-height:42px; opacity:.7; font-size:13px; line-height:1.5; }
.price-row { display:flex; justify-content:space-between; align-items:end; margin:18px 0; } .price-row small { display:block; opacity:.6; font-size:11px; } .price-row strong { font-size:25px; } .saving { color:var(--sw-gold-500); font-size:12px; font-weight:700; }
.best-supplier { display:grid; gap:3px; padding:12px; border-radius:12px; background:rgba(121,93,137,.14); } .best-supplier strong { font-size:14px; } .stock-row { display:flex; justify-content:space-between; margin:12px 0; font-size:12px; opacity:.8; } .in-stock { color:#68d391; } .low-stock { color:var(--sw-red-600); }
.compare-button,.add-button { width:100%; padding:11px 13px; cursor:pointer; color:inherit; } .compare-button { display:flex; justify-content:space-between; background:transparent; } .add-button { margin-top:10px; background:var(--sw-button-gradient); color:white; font-weight:700; }
.supplier-list { display:grid; gap:7px; margin-top:9px; } .supplier-row { display:flex; justify-content:space-between; padding:10px; border-radius:10px; background:rgba(255,255,255,.04); font-size:12px; } .supplier-row div { display:grid; gap:2px; } .supplier-row small { opacity:.6; } .supplier-row.cheapest { border:1px solid var(--sw-gold-500); }
.state,.empty-state { min-height:260px; border-radius:18px; display:grid; place-items:center; align-content:center; gap:8px; text-align:center; padding:30px; } .state p,.empty-state p { opacity:.7; } .error { border-color:var(--sw-red-600); } .empty-state>div { font-size:48px; } .empty-state h2 { margin:0; } .empty-state button { padding:10px 15px; background:var(--sw-button-gradient); color:white; cursor:pointer; }
.loader { width:34px; height:34px; border:3px solid var(--sw-glass-border); border-top-color:var(--sw-gold-500); border-radius:50%; animation:spin .8s linear infinite; } .toast { position:fixed; right:20px; bottom:20px; z-index:20; max-width:360px; padding:14px 16px; border-radius:12px; background:var(--sw-purple-700); color:white; box-shadow:var(--sw-shadow-soft); }
.category-slide-enter-active,.category-slide-leave-active { transition:.2s ease; } .category-slide-enter-from,.category-slide-leave-to { opacity:0; transform:translateY(-8px); } @keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:760px) { .catalogue-hero { grid-template-columns:1fr; } .shop-toolbar { grid-template-columns:1fr; } .basket-summary { min-width:0; } }
</style>
