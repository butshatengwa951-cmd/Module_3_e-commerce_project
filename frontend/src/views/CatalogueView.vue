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
            <span v-if="getMinimumQuantity(product) > 1" class="bulk-badge">MIN {{ getMinimumQuantity(product) }}</span>
            <span v-else class="bulk-badge">1+</span>
            <img :src="getProductImage(product)" :alt="product.product_name" @error="handleImageError" />
            <button class="details-button" type="button" @click="openProductDetails(product)">View details</button>
          </div>

          <div class="product-info">
            <span class="category-label">{{ product.category }}</span>
            <h2>{{ product.product_name }}</h2>
            <p class="description">{{ product.description || "Quality household essential." }}</p>

            <div class="price-row">
              <div>
                <small>Best group price</small>
                <strong v-if="getBestSupplier(product)">R{{ getBestSupplier(product).price.toFixed(2) }}</strong>
                <strong v-else>Unavailable</strong>
              </div>
              <div v-if="getSaving(product) > 0" class="saving">
                Save up to R{{ getSaving(product).toFixed(2) }}
              </div>
            </div>

            <div class="best-supplier">
              <span>BEST SUPPLIER FOR {{ getPurchaseQuantity(product) }} UNIT{{ getPurchaseQuantity(product) === 1 ? '' : 'S' }}</span>
              <strong>{{ getBestSupplier(product)?.supplier_name || "No supplier meets this quantity" }}</strong>
            </div>

            <div class="stock-row">
              <span>{{ product.quantity_available }} available</span>
              <span :class="product.quantity_available > 20 ? 'in-stock' : product.quantity_available > 0 ? 'low-stock' : 'out-of-stock'">
                {{ product.quantity_available > 20 ? "IN STOCK" : product.quantity_available > 0 ? "LOW STOCK" : "OUT OF STOCK" }}
              </span>
            </div>

            <div class="quantity-control" :class="{ disabled: product.quantity_available < 1 }">
              <span>Quantity</span>
              <div class="quantity-picker">
                <button type="button" aria-label="Decrease quantity" :disabled="getPurchaseQuantity(product) <= 1" @click="changeQuantity(product, -1)">−</button>
                <input
                  :value="getPurchaseQuantity(product)"
                  type="number"
                  min="1"
                  :max="Math.max(1, Number(product.quantity_available || 0))"
                  aria-label="Purchase quantity"
                  :disabled="product.quantity_available < 1"
                  @change="setPurchaseQuantity(product, $event.target.value)"
                />
                <button type="button" aria-label="Increase quantity" :disabled="getPurchaseQuantity(product) >= Number(product.quantity_available || 0) || product.quantity_available < 1" @click="changeQuantity(product, 1)">+</button>
              </div>
            </div>

            <button class="compare-button" type="button" :disabled="!product.supplier_prices?.length" @click="toggleProduct(product.product_id)">
              <span>{{ product.supplier_prices?.length ? "Compare suppliers" : "No suppliers available" }}</span>
              <span v-if="product.supplier_prices?.length">{{ expandedProduct === product.product_id ? "↑" : "↓" }}</span>
            </button>

            <div v-if="expandedProduct === product.product_id && product.supplier_prices?.length" class="supplier-list">
              <div class="supplier-toolbar">
                <span>Supplier options</span>
                <select v-model="supplierSort[product.product_id]" aria-label="Sort supplier options">
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="min-low">Minimum: Low to High</option>
                  <option value="min-high">Minimum: High to Low</option>
                </select>
              </div>

              <div
                v-for="supplier in getSortedSuppliers(product)"
                :key="supplier.supplier_price_id"
                class="supplier-row"
                :class="{ cheapest: getBestSupplier(product)?.supplier_price_id === supplier.supplier_price_id, unavailable: !isSupplierEligible(product, supplier) }"
              >
                <div class="supplier-details">
                  <strong>{{ supplier.supplier_name }}</strong>
                  <small>Minimum {{ supplier.minimum_quantity || 1 }} · {{ isSupplierEligible(product, supplier) ? 'Available for this quantity' : `Choose ${supplier.minimum_quantity || 1}+ units` }}</small>
                </div>

                <div class="supplier-action">
                  <span>R{{ Number(supplier.price).toFixed(2) }}</span>
                  <button
                    class="supplier-add-button"
                    type="button"
                    :disabled="!isSupplierEligible(product, supplier)"
                    :aria-label="`Add ${product.product_name} from ${supplier.supplier_name} to group basket`"
                    @click="addSupplierToBasket(product, supplier)"
                  >
                    {{ isSupplierEligible(product, supplier) ? `Add ${getPurchaseQuantity(product)}` : `Min ${supplier.minimum_quantity || 1}` }}
                  </button>
                </div>
              </div>
            </div>

            <button class="add-button" type="button" :disabled="!canAddProduct(product)" @click="addToBasket(product)">
              <span aria-hidden="true">+</span>
              {{ product.quantity_available < 1 ? "Out of Stock" : canAddProduct(product) ? "Add to Group Basket" : "Choose a valid quantity" }}
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

    <transition name="modal-fade">
      <div v-if="selectedProduct" class="details-modal-backdrop" @click.self="closeProductDetails">
        <section class="details-modal" role="dialog" aria-modal="true" :aria-label="`${selectedProduct.product_name} details`">
          <button class="modal-close" type="button" aria-label="Close product details" @click="closeProductDetails">×</button>
          <div class="modal-content">
            <div class="modal-image-wrap">
              <img :src="getProductImage(selectedProduct)" :alt="selectedProduct.product_name" @error="handleImageError" />
            </div>
            <div class="modal-details">
              <span class="category-label">{{ selectedProduct.category }}</span>
              <h2>{{ selectedProduct.product_name }}</h2>
              <p>{{ selectedProduct.description || "Quality household essential." }}</p>
              <div class="modal-stock">
                <strong>{{ selectedProduct.quantity_available }}</strong>
                <span>units available</span>
              </div>
              <div class="modal-supplier-summary">
                <strong>Supplier options</strong>
                <span>{{ selectedProduct.supplier_prices?.length || 0 }} available</span>
              </div>
              <div v-if="selectedProduct.supplier_prices?.length" class="modal-supplier-list">
                <div v-for="supplier in getSortedSuppliers(selectedProduct)" :key="supplier.supplier_price_id">
                  <span>{{ supplier.supplier_name }}</span>
                  <strong>R{{ Number(supplier.price).toFixed(2) }}</strong>
                  <small>Min {{ supplier.minimum_quantity || 1 }}</small>
                </div>
              </div>
              <button class="modal-add-button" type="button" :disabled="!canAddProduct(selectedProduct)" @click="addToBasket(selectedProduct)">
                {{ selectedProduct.quantity_available > 0 ? `Add ${getPurchaseQuantity(selectedProduct)} to Group Basket` : "Out of Stock" }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </transition>
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
const selectedProduct = ref(null);
const requestedQuantities = ref({});
const supplierSort = ref({});
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
      localStorage.removeItem("sw_token");
      localStorage.removeItem("user");
      localStorage.removeItem("stokvel");
      syncAuth();
      basketCount.value = 0;
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

function getMinimumQuantity(product) {
  if (!product.supplier_prices?.length) return 1;
  return Math.min(...product.supplier_prices.map((supplier) => Number(supplier.minimum_quantity || 1)));
}

function getPurchaseQuantity(product) {
  const stock = Number(product.quantity_available || 0);
  const current = Number(requestedQuantities.value[product.product_id]);
  if (!Number.isFinite(current) || current < 1) return stock > 0 ? 1 : 0;
  return Math.min(Math.max(Math.round(current), 1), Math.max(stock, 1));
}

function setPurchaseQuantity(product, value) {
  const stock = Number(product.quantity_available || 0);
  if (!stock) {
    requestedQuantities.value[product.product_id] = 0;
    return;
  }

  const parsed = Number(value);
  const quantity = Number.isFinite(parsed) ? Math.round(parsed) : 1;
  requestedQuantities.value[product.product_id] = Math.min(Math.max(quantity, 1), stock);
}

function changeQuantity(product, delta) {
  setPurchaseQuantity(product, getPurchaseQuantity(product) + delta);
}

function getBestSupplier(product) {
  const quantity = getPurchaseQuantity(product);
  return [...(product.supplier_prices || [])]
    .filter((supplier) => Number(supplier.minimum_quantity || 1) <= quantity)
    .filter(() => Number(product.quantity_available || 0) >= quantity)
    .sort((a, b) => Number(a.price) - Number(b.price))[0] || null;
}

function isSupplierEligible(product, supplier) {
  const quantity = getPurchaseQuantity(product);
  return Number(product.quantity_available || 0) >= quantity && Number(supplier.minimum_quantity || 1) <= quantity;
}

function getSortedSuppliers(product) {
  const sort = supplierSort.value[product.product_id] || "price-low";
  return [...(product.supplier_prices || [])].sort((a, b) => {
    if (sort === "price-high") return Number(b.price) - Number(a.price);
    if (sort === "min-low") return Number(a.minimum_quantity || 1) - Number(b.minimum_quantity || 1);
    if (sort === "min-high") return Number(b.minimum_quantity || 1) - Number(a.minimum_quantity || 1);
    return Number(a.price) - Number(b.price);
  });
}

function canAddProduct(product) {
  return Number(product.quantity_available || 0) > 0 && Boolean(getBestSupplier(product));
}

function toggleProduct(id) {
  expandedProduct.value = expandedProduct.value === id ? null : id;
}

function openProductDetails(product) {
  selectedProduct.value = product;
  if (!supplierSort.value[product.product_id]) supplierSort.value[product.product_id] = "price-low";
}

function closeProductDetails() {
  selectedProduct.value = null;
}

function showBasketMessage(text, duration = 3000) {
  message.value = text;
  window.setTimeout(() => {
    message.value = "";
  }, duration);
}

async function addToBasket(product) {
  syncAuth();
  if (!isAuthenticated.value) {
    showBasketMessage("Please join or log in before adding items to your group basket.", 3500);
    return;
  }

  const quantity = getPurchaseQuantity(product);
  const supplier = getBestSupplier(product);

  if (!supplier) {
    showBasketMessage("No supplier can fulfil the selected quantity. Increase the quantity or compare suppliers.", 3500);
    return;
  }

  try {
    await addCartItem({
      product_id: product.product_id,
      supplier_price_id: supplier.supplier_price_id,
      quantity,
    });
    await syncCloudBasket();
    window.dispatchEvent(new CustomEvent("basket-updated", { detail: basketCount.value }));
    showBasketMessage(`${quantity} × ${product.product_name} added from ${supplier.supplier_name} at R${Number(supplier.price).toFixed(2)} each.`);
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

  const quantity = getPurchaseQuantity(product);
  const minimum = Number(supplier.minimum_quantity || 1);

  if (!isSupplierEligible(product, supplier)) {
    showBasketMessage(`This supplier requires at least ${minimum} unit${minimum === 1 ? "" : "s"}.`, 3500);
    if (Number(product.quantity_available || 0) >= minimum) setPurchaseQuantity(product, minimum);
    return;
  }

  try {
    await addCartItem({
      product_id: product.product_id,
      supplier_price_id: supplier.supplier_price_id,
      quantity,
    });
    await syncCloudBasket();
    window.dispatchEvent(new CustomEvent("basket-updated", { detail: basketCount.value }));
    showBasketMessage(`${quantity} × ${product.product_name} added from ${supplier.supplier_name} at R${Number(supplier.price).toFixed(2)} each.`);
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

  if (sortOption.value === "price-low") result = [...result].sort((a, b) => (getBestSupplier(a)?.price ?? Infinity) - (getBestSupplier(b)?.price ?? Infinity));
  if (sortOption.value === "price-high") result = [...result].sort((a, b) => (getBestSupplier(b)?.price ?? -Infinity) - (getBestSupplier(a)?.price ?? -Infinity));
  if (sortOption.value === "name") result = [...result].sort((a, b) => a.product_name.localeCompare(b.product_name));
  return result;
});

function handleAuthChange() {
  syncAuth();
  syncCloudBasket();
}

function handleEscape(event) {
  if (event.key === "Escape" && selectedProduct.value) closeProductDetails();
}

onMounted(async () => {
  syncAuth();
  try {
    const response = await getProducts();
    products.value = Array.isArray(response) ? response : response.products || [];
    products.value.forEach((product) => {
      requestedQuantities.value[product.product_id] = product.quantity_available > 0 ? 1 : 0;
      supplierSort.value[product.product_id] = "price-low";
    });
    await syncCloudBasket();
  } catch (error) {
    console.error("Catalogue loading failed:", error);
    errorMessage.value = "Please make sure the StockWell API is running and try again.";
  } finally {
    loading.value = false;
  }

  window.addEventListener("login-completed", handleAuthChange);
  window.addEventListener("auth-updated", handleAuthChange);
  window.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  window.removeEventListener("login-completed", handleAuthChange);
  window.removeEventListener("auth-updated", handleAuthChange);
  window.removeEventListener("keydown", handleEscape);
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
.compare-button:hover:not(:disabled) {
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
.active-filter button:focus-visible,
.details-button:focus-visible,
.modal-close:focus-visible,
.modal-add-button:focus-visible,
.quantity-picker button:focus-visible,
.quantity-picker input:focus-visible {
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

.details-button {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  min-height: 34px;
  padding: 7px 12px;
  border: 1px solid color-mix(in srgb, #fff 35%, var(--sw-purple-700));
  border-radius: 999px;
  background: color-mix(in srgb, var(--sw-purple-700) 88%, transparent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.details-button:hover {
  background: var(--sw-purple-700);
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
.low-stock,
.out-of-stock {
  font-weight: 700;
}

.in-stock {
  color: #2f9e62;
}

.low-stock {
  color: var(--sw-red-600);
}

.out-of-stock {
  color: var(--sw-red-600);
}

.quantity-control {
  min-height: 46px;
  height: 46px;
  flex: 0 0 46px;
  margin-bottom: 8px;
  padding: 6px 8px 6px 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--catalogue-border-soft);
  border-radius: 12px;
  background: var(--catalogue-surface-raised);
  color: var(--catalogue-muted);
  font-size: 12px;
}

.quantity-control.disabled {
  opacity: 0.62;
}

.quantity-picker {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.quantity-picker button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--catalogue-border);
  border-radius: 8px;
  background: var(--catalogue-surface);
  color: var(--sw-page-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.quantity-picker button:disabled,
.quantity-picker input:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.quantity-picker input {
  width: 45px;
  height: 30px;
  border: 1px solid var(--catalogue-border);
  border-radius: 8px;
  background: var(--catalogue-surface);
  color: var(--sw-page-text);
  text-align: center;
  font: inherit;
  font-size: 12px;
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

.compare-button:disabled,
.add-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
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

.add-button:hover:not(:disabled),
.empty-state button:hover,
.supplier-add-button:hover:not(:disabled),
.modal-add-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--catalogue-shadow);
}

.supplier-list {
  margin-top: 0;
  margin-bottom: 8px;
  display: grid;
  gap: 7px;
}

.supplier-toolbar {
  min-height: 36px;
  padding: 7px 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--catalogue-border-soft);
  border-radius: 10px;
  background: var(--catalogue-surface-raised);
  color: var(--catalogue-muted);
  font-size: 11px;
}

.supplier-toolbar select {
  max-width: 170px;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--sw-page-text);
  font: inherit;
  cursor: pointer;
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

.supplier-row.unavailable {
  opacity: 0.68;
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

.supplier-add-button:hover:not(:disabled) {
  border-color: var(--sw-gold-500);
  background: color-mix(in srgb, var(--sw-gold-500) 10%, var(--catalogue-surface));
}

.supplier-add-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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
  max-width: min(420px, calc(100vw - 32px));
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, #fff 18%, var(--sw-purple-700));
  border-radius: 12px;
  background: var(--sw-purple-700);
  color: #fff;
  box-shadow: var(--catalogue-shadow);
}

.details-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(10, 8, 20, 0.65);
  backdrop-filter: blur(7px);
}

.details-modal {
  position: relative;
  width: min(880px, 100%);
  max-height: min(760px, calc(100vh - 40px));
  overflow: auto;
  border: 1px solid var(--catalogue-border);
  border-radius: 22px;
  background: var(--catalogue-surface);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 38px;
  height: 38px;
  border: 1px solid var(--catalogue-border);
  border-radius: 50%;
  background: var(--catalogue-surface-raised);
  color: var(--sw-page-text);
  font-size: 23px;
  line-height: 1;
  cursor: pointer;
}

.modal-content {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.15fr);
  gap: 24px;
  padding: 28px;
}

.modal-image-wrap {
  min-height: 360px;
  display: grid;
  place-items: center;
  padding: 20px;
  border: 1px solid var(--catalogue-border-soft);
  border-radius: 18px;
  background: var(--catalogue-surface-raised);
}

.modal-image-wrap img {
  max-width: 100%;
  max-height: 330px;
  object-fit: contain;
}

.modal-details {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 4px;
}

.modal-details h2 {
  margin: 8px 0 10px;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.05;
}

.modal-details > p {
  margin: 0 0 18px;
  color: var(--catalogue-muted);
  line-height: 1.7;
}

.modal-stock,
.modal-supplier-summary {
  min-height: 58px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--catalogue-border-soft);
  border-radius: 12px;
  background: var(--catalogue-surface-raised);
}

.modal-stock {
  margin-bottom: 8px;
}

.modal-stock strong {
  font-size: 24px;
}

.modal-stock span,
.modal-supplier-summary span {
  color: var(--catalogue-muted);
  font-size: 12px;
}

.modal-supplier-list {
  max-height: 220px;
  overflow: auto;
  margin: 10px 0 16px;
  display: grid;
  gap: 7px;
}

.modal-supplier-list > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--catalogue-border-soft);
  border-radius: 10px;
  background: var(--catalogue-surface-raised);
  font-size: 12px;
}

.modal-supplier-list strong {
  white-space: nowrap;
}

.modal-supplier-list small {
  color: var(--catalogue-muted);
  white-space: nowrap;
}

.modal-add-button {
  min-height: 46px;
  margin-top: auto;
  border: 0;
  border-radius: 12px;
  background: var(--sw-button-gradient);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.modal-add-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
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

  .modal-content {
    grid-template-columns: 1fr;
  }

  .modal-image-wrap {
    min-height: 260px;
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

  .supplier-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .supplier-toolbar select {
    width: 100%;
    max-width: none;
  }

  .quantity-control {
    padding-left: 10px;
  }

  .quantity-picker input {
    width: 42px;
  }

  .details-button {
    bottom: 10px;
  }

  .details-modal-backdrop {
    padding: 10px;
  }

  .details-modal {
    max-height: calc(100vh - 20px);
    border-radius: 18px;
  }

  .modal-content {
    gap: 14px;
    padding: 18px;
  }

  .modal-image-wrap {
    min-height: 220px;
  }

  .modal-image-wrap img {
    max-height: 200px;
  }

  .modal-supplier-list > div {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .modal-supplier-list small {
    grid-column: 1 / -1;
  }

  .toast {
    right: 14px;
    bottom: 14px;
  }
}
</style>
