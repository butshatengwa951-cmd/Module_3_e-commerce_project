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
      <button class="category-button" type="button" @click="showCategories = !showCategories">
        ☰ Categories <b>{{ showCategories ? "↑" : "↓" }}</b>
      </button>

      <label class="search-box">
        <span aria-hidden="true">⌕</span>
        <input v-model="search" type="search" placeholder="Search groceries..." />
      </label>

      <select v-model="sortOption" aria-label="Sort products">
        <option value="default">Recommended</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="name">Name A-Z</option>
      </select>
    </section>

    <transition name="category-slide">
      <section v-if="showCategories" class="category-panel">
        <div class="category-title">
          <span>CATEGORIES</span>
          <small>Choose what your group needs</small>
        </div>

        <div class="category-list">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            :class="{ active: selectedCategory === category }"
            @click="selectCategory(category)"
          >
            <span>{{ getCategoryIcon(category) }}</span>
            {{ category }}
          </button>
        </div>
      </section>
    </transition>

    <div v-if="selectedCategory !== 'All Products'" class="active-filter">
      <span>Showing:</span>
      <strong>{{ selectedCategory }}</strong>
      <button type="button" aria-label="Clear category filter" @click="selectedCategory = 'All Products'">×</button>
    </div>

    <main class="products-area">
      <div v-if="message" class="toast" role="status">{{ message }}</div>

      <div v-if="loading" class="state">
        <div class="loader"></div>
        <p>Loading StockWell groceries...</p>
      </div>

      <div v-else-if="errorMessage" class="state error">
        <strong>We couldn't load the catalogue.</strong>
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else-if="filteredProducts.length" class="product-grid">
        <article v-for="product in filteredProducts" :key="product.product_id" class="product-card">
          <div class="product-image">
            <span v-if="getSaving(product) > 0" class="deal-badge">BEST DEAL</span>
            <span class="bulk-badge">10+</span>
            <img :src="getProductImage(product)" :alt="product.product_name" @error="handleImageError" />
          </div>

          <div class="product-info">
            <span class="category-label">{{ product.category }}</span>
            <h2>{{ product.product_name }}</h2>
            <p class="description">{{ product.description || "Quality household essential." }}</p>

            <div class="price-row">
              <div>
                <small>Best group price</small>
                <strong>R{{ getLowestPrice(product).toFixed(2) }}</strong>
              </div>
              <div v-if="getSaving(product) > 0" class="saving">
                Save R{{ getSaving(product).toFixed(2) }}
              </div>
            </div>

            <div class="best-supplier">
              <span>BEST SUPPLIER</span>
              <strong>{{ getCheapestSupplier(product) || "Price unavailable" }}</strong>
            </div>

            <div class="stock-row">
              <span>{{ product.quantity_available }} available</span>
              <span :class="product.quantity_available > 20 ? 'in-stock' : 'low-stock'">
                {{ product.quantity_available > 20 ? "IN STOCK" : "LOW STOCK" }}
              </span>
            </div>

            <button class="compare-button" type="button" @click="toggleProduct(product.product_id)">
              <span>Compare suppliers</span>
              <span>{{ expandedProduct === product.product_id ? "↑" : "↓" }}</span>
            </button>

            <div v-if="expandedProduct === product.product_id" class="supplier-list">
              <div
                v-for="supplier in product.supplier_prices"
                :key="supplier.supplier_price_id"
                class="supplier-row"
                :class="{ cheapest: Number(supplier.price) === getLowestPrice(product) }"
              >
                <div class="supplier-details">
                  <strong>{{ supplier.supplier_name }}</strong>
                  <small>Minimum {{ supplier.minimum_quantity }}</small>
                </div>

                <div class="supplier-action">
                  <span>R{{ Number(supplier.price).toFixed(2) }}</span>
                  <button
                    class="supplier-add-button"
                    type="button"
                    :aria-label="`Add ${product.product_name} from ${supplier.supplier_name} to group basket`"
                    @click="addSupplierToBasket(product, supplier)"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <button class="add-button" type="button" @click="addToBasket(product)">
              <span aria-hidden="true">+</span>
              Add to Group Basket
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <div>🧺</div>
        <h2>No groceries found</h2>
        <p>Try another search or category.</p>
        <button type="button" @click="resetFilters">Show all products</button>
      </div>
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
  return {
    "All Products": "🛍️",
    Staples: "🌾",
    "Cooking Essentials": "🍳",
    Food: "🍎",
    "Canned Food": "🥫",
    Spices: "🌶️",
    Breakfast: "🥣",
    Beverages: "☕",
  }[category] || "🛍️";
}

function selectCategory(category) {
  selectedCategory.value = category;
  showCategories.value = false;
}

function resetFilters() {
  search.value = "";
  selectedCategory.value = "All Products";
  sortOption.value = "default";
}

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

function handleImageError(event) {
  if (event.target.src !== imageFallback) event.target.src = imageFallback;
}

function getLowestPrice(product) {
  return product.supplier_prices?.length
    ? Math.min(...product.supplier_prices.map((s) => Number(s.price)))
    : 0;
}

function getHighestPrice(product) {
  return product.supplier_prices?.length
    ? Math.max(...product.supplier_prices.map((s) => Number(s.price)))
    : 0;
}

function getSaving(product) {
  return product.supplier_prices?.length >= 2 ? getHighestPrice(product) - getLowestPrice(product) : 0;
}

function getCheapestSupplier(product) {
  if (!product.supplier_prices?.length) return "";
  return product.supplier_prices.reduce(
    (lowest, supplier) => Number(supplier.price) < Number(lowest.price) ? supplier : lowest,
  ).supplier_name;
}

function toggleProduct(id) {
  expandedProduct.value = expandedProduct.value === id ? null : id;
}

function showBasketMessage(text, duration = 3000) {
  message.value = text;
  window.setTimeout(() => { message.value = ""; }, duration);
}

async function addToBasket(product) {
  syncAuth();
  if (!isAuthenticated.value) {
    showBasketMessage("Please join or log in before adding items to your group basket.", 3500);
    return;
  }

  try {
    await addCartItem({ product_id: product.product_id, supplier_price_id: null, quantity: 1 });
    await syncCloudBasket();
    window.dispatchEvent(new CustomEvent("basket-updated", { detail: basketCount.value }));
    showBasketMessage(`${product.product_name} added to your group's cloud basket.`);
  } catch (error) {
    console.error("Cloud basket add failed:", error);
    showBasketMessage(error.response?.data?.message || "We could not add this product to the group basket.");
  }
}

async function addSupplierToBasket(product, supplier) {
  syncAuth();
  if (!isAuthenticated.value) {
    showBasketMessage("Please join or log in before adding items to your group basket.", 3500);
    return;
  }

  try {
    await addCartItem({
      product_id: product.product_id,
      supplier_price_id: supplier.supplier_price_id,
      quantity: 1,
    });
    await syncCloudBasket();
    window.dispatchEvent(new CustomEvent("basket-updated", { detail: basketCount.value }));
    showBasketMessage(`${product.product_name} added from ${supplier.supplier_name} at R${Number(supplier.price).toFixed(2)}.`);
  } catch (error) {
    console.error("Supplier basket add failed:", error);
    showBasketMessage(error.response?.data?.message || "We could not add this supplier option to the group basket.");
  }
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

function handleAuthChange() {
  syncAuth();
  syncCloudBasket();
}

onMounted(async () => {
  syncAuth();
  try {
    const response = await getProducts();
    products.value = Array.isArray(response) ? response : response.products || [];
    await syncCloudBasket();
  } catch (error) {
    console.error("Catalogue loading failed:", error);
    errorMessage.value = "Please make sure the StockWell API is running and try again.";
  } finally {
    loading.value = false;
  }

  window.addEventListener("login-completed", handleAuthChange);
  window.addEventListener("auth-updated", handleAuthChange);
});

onUnmounted(() => {
  window.removeEventListener("login-completed", handleAuthChange);
  window.removeEventListener("auth-updated", handleAuthChange);
});
</script>

<style scoped>
.catalogue-page {
  --catalogue-surface: color-mix(in srgb, var(--sw-page-background) 96%, var(--sw-page-text) 4%);
  --catalogue-surface-raised: color-mix(in srgb, var(--sw-page-background) 91%, var(--sw-page-text) 9%);
  --catalogue-border: color-mix(in srgb, var(--sw-page-text) 22%, var(--sw-page-background));
  --catalogue-border-soft: color-mix(in srgb, var(--sw-page-text) 14%, var(--sw-page-background));
  --catalogue-muted: color-mix(in srgb, var(--sw-page-text) 68%, var(--sw-page-background));
  --catalogue-shadow: var(--sw-shadow-soft, 0 12px 30px rgba(15, 23, 42, 0.08));

  min-height: 100vh;
  padding: clamp(28px, 5vw, 64px) clamp(16px, 4vw, 56px) 72px;
  background: var(--sw-page-background);
  color: var(--sw-page-text);
}

.catalogue-page *,
.catalogue-page *::before,
.catalogue-page *::after {
  box-sizing: border-box;
}

.catalogue-hero,
.shop-toolbar,
.category-panel,
.active-filter,
.products-area {
  max-width: 1180px;
  margin-inline: auto;
}

.catalogue-hero {
  margin-bottom: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 28px;
  align-items: end;
}

.eyebrow,
.category-title > span,
.basket-summary > span,
.best-supplier > span {
  margin: 0;
  color: var(--sw-gold-500);
  font-family: "DM Mono", monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.catalogue-page h1 {
  margin: 8px 0 12px;
  font-size: clamp(38px, 6vw, 72px);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.catalogue-page h1 span {
  color: var(--sw-gold-500);
}

.hero-copy {
  max-width: 620px;
  margin: 0;
  color: var(--catalogue-muted);
  font-size: 16px;
  line-height: 1.7;
}

.basket-summary,
.shop-toolbar,
.category-panel,
.product-card,
.empty-state,
.state {
  border: 1px solid var(--catalogue-border);
  background: var(--catalogue-surface);
  box-shadow: var(--catalogue-shadow);
  backdrop-filter: blur(var(--sw-glass-blur, 10px));
}

.basket-summary {
  min-width: 210px;
  padding: 20px;
  border-radius: 18px;
  display: grid;
  gap: 5px;
}

.basket-summary strong {
  font-size: 38px;
  line-height: 1;
}

.basket-summary small {
  color: var(--catalogue-muted);
}

.basket-summary a {
  margin-top: 8px;
  color: var(--sw-gold-500);
  font-weight: 700;
  text-decoration: none;
}

.basket-summary a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.shop-toolbar {
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 16px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
}

.shop-toolbar button,
.shop-toolbar select,
.search-box,
.category-list button,
.add-button,
.compare-button,
.empty-state button {
  min-height: 46px;
  border: 1px solid var(--catalogue-border);
  border-radius: 12px;
  font: inherit;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.category-button,
.shop-toolbar select {
  padding: 12px 15px;
  background: var(--catalogue-surface-raised);
  color: var(--sw-page-text);
  cursor: pointer;
}

.category-button:hover,
.shop-toolbar select:hover,
.category-list button:hover,
.compare-button:hover {
  border-color: color-mix(in srgb, var(--sw-gold-500) 55%, var(--catalogue-border));
  background: var(--catalogue-surface-raised);
}

.category-button:focus-visible,
.shop-toolbar select:focus-visible,
.search-box:focus-within,
.category-list button:focus-visible,
.compare-button:focus-visible,
.add-button:focus-visible,
.supplier-add-button:focus-visible,
.empty-state button:focus-visible,
.active-filter button:focus-visible {
  outline: 2px solid var(--sw-gold-500);
  outline-offset: 2px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: var(--catalogue-surface-raised);
}

.search-box > span {
  color: var(--catalogue-muted);
  font-size: 20px;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--sw-page-text);
  padding: 12px 0;
}

.search-box input::placeholder {
  color: var(--catalogue-muted);
}

.category-panel {
  margin-bottom: 18px;
  padding: 18px;
  border-radius: 16px;
}

.category-title {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}

.category-title small {
  color: var(--catalogue-muted);
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-list button {
  padding: 10px 14px;
  background: var(--catalogue-surface-raised);
  color: var(--sw-page-text);
  cursor: pointer;
}

.category-list button.active {
  border-color: var(--sw-gold-500);
  background: color-mix(in srgb, var(--sw-gold-500) 12%, var(--catalogue-surface));
  color: var(--sw-gold-500);
}

.category-list button span {
  margin-right: 5px;
}

.active-filter {
  margin-bottom: 14px;
  padding: 2px 2px 0;
  color: var(--catalogue-muted);
  font-size: 14px;
}

.active-filter strong {
  color: var(--sw-page-text);
}

.active-filter button {
  margin-left: 5px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.products-area {
  position: relative;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 18px;
}

.product-card {
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--sw-gold-500) 42%, var(--catalogue-border));
}

.product-image {
  position: relative;
  height: 240px;
  flex: 0 0 240px;
  display: grid;
  place-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--catalogue-border-soft);
  background: var(--catalogue-surface-raised);
}

.product-image img {
  max-width: 100%;
  max-height: 205px;
  object-fit: contain;
}

.deal-badge,
.bulk-badge {
  position: absolute;
  top: 12px;
  z-index: 1;
  padding: 6px 9px;
  border-radius: 999px;
  font-family: "DM Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.deal-badge {
  left: 12px;
  background: var(--sw-gold-500);
  color: #171022;
}

.bulk-badge {
  right: 12px;
  background: var(--sw-purple-700);
  color: #fff;
}

.product-info {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.category-label {
  color: var(--sw-gold-500);
  font-family: "DM Mono", monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.product-info h2 {
  height: 51px;
  min-height: 51px;
  margin: 7px 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 21px;
  line-height: 1.2;
}

.description {
  height: 42px;
  min-height: 42px;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--catalogue-muted);
  font-size: 13px;
  line-height: 1.5;
}

.price-row {
  min-height: 72px;
  height: 72px;
  flex: 0 0 72px;
  margin: 18px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.price-row > div:first-child {
  min-width: 0;
}

.price-row small {
  display: block;
  margin-bottom: 3px;
  color: var(--catalogue-muted);
  font-size: 11px;
}

.price-row strong {
  font-size: 25px;
  line-height: 1;
}

.saving {
  flex: 0 0 auto;
  color: var(--sw-gold-500);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.best-supplier {
  min-height: 64px;
  height: 64px;
  flex: 0 0 64px;
  display: grid;
  align-content: center;
  gap: 4px;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--catalogue-border-soft);
  border-radius: 12px;
  background: color-mix(in srgb, var(--sw-purple-700) 9%, var(--catalogue-surface));
}

.best-supplier strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 1.25;
}

.stock-row {
  min-height: 20px;
  height: 20px;
  flex: 0 0 20px;
  margin: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--catalogue-muted);
  font-size: 12px;
}

.in-stock,
.low-stock {
  font-weight: 700;
}

.in-stock {
  color: #2f9e62;
}

.low-stock {
  color: var(--sw-red-600);
}

.compare-button,
.add-button {
  width: 100%;
  padding: 11px 13px;
  cursor: pointer;
}

.compare-button {
  min-height: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  background: transparent;
  color: var(--sw-page-text);
}

.add-button {
  min-height: 46px;
  height: 46px;
  flex: 0 0 46px;
  margin-top: auto;
  padding-top: 12px;
  padding-bottom: 12px;
  border-color: transparent;
  background: var(--sw-button-gradient);
  color: #fff;
  font-weight: 700;
}

.add-button:hover,
.empty-state button:hover,
.supplier-add-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--catalogue-shadow);
}

.supplier-list {
  margin-top: 0;
  margin-bottom: 8px;
  display: grid;
  gap: 7px;
}

.supplier-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--catalogue-border-soft);
  border-radius: 10px;
  background: var(--catalogue-surface-raised);
  font-size: 12px;
}

.supplier-details {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.supplier-details strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.supplier-details small {
  color: var(--catalogue-muted);
}

.supplier-action {
  display: grid;
  justify-items: end;
  gap: 6px;
}

.supplier-action > span {
  font-weight: 700;
  white-space: nowrap;
}

.supplier-add-button {
  min-height: 30px;
  padding: 6px 10px;
  border: 1px solid var(--catalogue-border);
  border-radius: 8px;
  background: var(--catalogue-surface);
  color: var(--sw-page-text);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.supplier-add-button:hover {
  border-color: var(--sw-gold-500);
  background: color-mix(in srgb, var(--sw-gold-500) 10%, var(--catalogue-surface));
}

.supplier-row.cheapest {
  border-color: var(--sw-gold-500);
  background: color-mix(in srgb, var(--sw-gold-500) 8%, var(--catalogue-surface));
}

.state,
.empty-state {
  min-height: 260px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  padding: 30px;
  text-align: center;
}

.state p,
.empty-state p {
  margin: 0;
  color: var(--catalogue-muted);
}

.error {
  border-color: var(--sw-red-600);
}

.empty-state > div {
  font-size: 48px;
}

.empty-state h2 {
  margin: 0;
}

.empty-state button {
  padding: 10px 15px;
  border-color: transparent;
  background: var(--sw-button-gradient);
  color: #fff;
  cursor: pointer;
}

.loader {
  width: 34px;
  height: 34px;
  border: 3px solid var(--catalogue-border);
  border-top-color: var(--sw-gold-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 20;
  max-width: min(360px, calc(100vw - 32px));
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, #fff 18%, var(--sw-purple-700));
  border-radius: 12px;
  background: var(--sw-purple-700);
  color: #fff;
  box-shadow: var(--catalogue-shadow);
}

.category-slide-enter-active,
.category-slide-leave-active {
  transition: 0.2s ease;
}

.category-slide-enter-from,
.category-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .catalogue-hero {
    grid-template-columns: 1fr;
  }

  .basket-summary {
    width: 100%;
  }

  .shop-toolbar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .catalogue-page {
    padding: 24px 14px 56px;
  }

  .catalogue-hero {
    gap: 18px;
    margin-bottom: 22px;
  }

  .catalogue-page h1 {
    font-size: clamp(36px, 13vw, 54px);
  }

  .product-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .product-image {
    height: 220px;
    flex-basis: 220px;
  }

  .product-info {
    padding: 18px;
  }

  .category-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .category-list button {
    width: 100%;
  }

  .price-row {
    align-items: center;
  }

  .supplier-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .supplier-action {
    grid-template-columns: auto auto;
    justify-items: stretch;
    align-items: center;
  }

  .toast {
    right: 14px;
    bottom: 14px;
  }
}
</style>
