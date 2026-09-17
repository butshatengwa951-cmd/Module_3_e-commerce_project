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

      <label class="price-filter">
        <span>Up to R</span>
        <input v-model.number="maxPrice" type="number" min="0" step="1" placeholder="Any" aria-label="Maximum price" />
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

    <div v-if="hasActiveFilters" class="active-filter">
      <span>Filters:</span>
      <strong v-if="selectedCategory !== 'All Products'">{{ selectedCategory }}</strong>
      <strong v-if="search">“{{ search }}”</strong>
      <strong v-if="maxPrice">Up to R{{ Number(maxPrice).toFixed(0) }}</strong>
      <button type="button" aria-label="Clear filters" @click="resetFilters">×</button>
    </div>

    <main class="products-area">
      <div v-if="message" class="toast" role="status" aria-live="polite">{{ message }}</div>

      <div v-if="loading" class="state">
        <div class="loader"></div>
        <p>Loading StockWell groceries...</p>
      </div>

      <div v-else-if="errorMessage" class="state error">
        <strong>We couldn't load the catalogue.</strong>
        <p>{{ errorMessage }}</p>
        <button class="retry-button" type="button" @click="loadCatalogue">Try again</button>
      </div>

      <template v-else-if="visibleProducts.length">
        <div class="product-grid">
          <article v-for="product in visibleProducts" :key="product.product_id" class="product-card">
            <div class="product-image">
              <span v-if="getSaving(product) > 0" class="deal-badge">BEST DEAL</span>
              <span v-if="getMinimumQuantity(product) > 1" class="bulk-badge">MIN {{ getMinimumQuantity(product) }}</span>
              <span v-else class="bulk-badge">1+</span>
              <img :src="getProductImage(product)" :alt="product.product_name" @error="handleImageError" />
            </div>

            <div class="product-info">
              <span class="category-label">{{ product.category || "General" }}</span>
              <h2>{{ product.product_name }}</h2>
              <p class="description">{{ product.description || "Quality household essential." }}</p>

              <div class="price-row">
                <div class="price-block">
                  <small>Best group price / unit</small>
                  <strong v-if="getBestSupplier(product)">R{{ Number(getBestSupplier(product).price).toFixed(2) }}</strong>
                  <strong v-else>Unavailable</strong>
                </div>
                <div v-if="getSaving(product) > 0" class="saving">Save up to R{{ getSaving(product).toFixed(2) }} / unit</div>
              </div>

              <div class="best-supplier">
                <span>{{ getPreferredSupplier(product) ? "SELECTED SUPPLIER" : "BEST SUPPLIER" }} FOR {{ getPurchaseQuantity(product) }} UNIT{{ getPurchaseQuantity(product) === 1 ? '' : 'S' }}</span>
                <strong>{{ getBestSupplier(product)?.supplier_name || "No supplier meets this quantity" }}</strong>
              </div>

              <div class="stock-row">
                <span>{{ product.quantity_available }} available</span>
                <span :class="getStockClass(product)">{{ getStockLabel(product) }}</span>
              </div>

              <div v-if="getBasketQuantity(product) > 0" class="basket-status">
                <span>In your basket</span>
                <strong>{{ getBasketQuantity(product) }}</strong>
              </div>

              <div class="quantity-control" :class="{ disabled: product.quantity_available < 1 }">
                <span>Quantity</span>
                <div class="quantity-picker">
                  <button type="button" aria-label="Decrease quantity" :disabled="getPurchaseQuantity(product) <= getMinimumSelectableQuantity(product)" @click="changeQuantity(product, -1)">−</button>
                  <input
                    :value="getPurchaseQuantity(product)"
                    type="number"
                    :min="Math.max(1, getMinimumSelectableQuantity(product))"
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
                  :class="{ cheapest: getBestSupplier(product)?.supplier_price_id === supplier.supplier_price_id, selected: selectedSuppliers[product.product_id] === supplier.supplier_price_id, unavailable: !isSupplierEligible(product, supplier) }"
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
                      :aria-label="`Use ${supplier.supplier_name} for ${product.product_name}`"
                      @click="addSupplierToBasket(product, supplier)"
                    >
                      {{ isSupplierEligible(product, supplier) ? (selectedSuppliers[product.product_id] === supplier.supplier_price_id ? `Add ${getPurchaseQuantity(product)}` : "Use & Add") : `Min ${supplier.minimum_quantity || 1}` }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="card-action-spacer" aria-hidden="true"></div>
              <button class="add-button" type="button" :disabled="!canAddProduct(product)" @click="addToBasket(product)">
                <span aria-hidden="true">+</span>
                {{ product.quantity_available < 1 ? "Out of Stock" : canAddProduct(product) ? `Add ${getPurchaseQuantity(product)} to Group Basket` : getMinimumSelectableQuantity(product) > 1 ? `Select ${getMinimumSelectableQuantity(product)}+ units` : "No eligible supplier" }}
              </button>
            </div>
          </article>
        </div>

        <div v-if="visibleCount < filteredProducts.length" class="load-more-wrap">
          <p>Showing {{ visibleProducts.length }} of {{ filteredProducts.length }} products</p>
          <button class="load-more-button" type="button" @click="loadMore">Load more groceries</button>
        </div>
      </template>

      <div v-else class="empty-state">
        <div>🧺</div>
        <h2>No groceries found</h2>
        <p>Try another search, category or price.</p>
        <button type="button" @click="resetFilters">Show all products</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
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
const maxPrice = ref(null);
const expandedProduct = ref(null);
const requestedQuantities = ref({});
const supplierSort = ref({});
const selectedSuppliers = ref(loadStoredSuppliers());
const basketQuantities = ref({});
const loading = ref(true);
const errorMessage = ref("");
const message = ref("");
const showCategories = ref(false);
const isAuthenticated = ref(false);
const basketCount = ref(0);
const toastTimer = ref(null);
const visibleCount = ref(12);

const imageFallback = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&h=700&fit=crop";
const supplierStorageKey = "stockwellSelectedSuppliers";

function loadStoredSuppliers() {
  try {
    return JSON.parse(localStorage.getItem(supplierStorageKey) || "{}");
  } catch {
    return {};
  }
}

function persistSelectedSupplier(productId, supplierPriceId) {
  selectedSuppliers.value = { ...selectedSuppliers.value, [productId]: supplierPriceId };
  localStorage.setItem(supplierStorageKey, JSON.stringify(selectedSuppliers.value));
}

function syncAuth() {
  isAuthenticated.value = Boolean(localStorage.getItem("token") || localStorage.getItem("sw_token"));
}

function getCartProductId(item) {
  return item.product_id || item.product?.product_id || item.product?.id || item.id;
}

async function syncCloudBasket() {
  if (!isAuthenticated.value) {
    basketCount.value = 0;
    basketQuantities.value = {};
    return;
  }

  try {
    const response = await getCart();
    const quantities = {};
    basketCount.value = (response.items || []).reduce((total, item) => {
      const quantity = Number(item.quantity || 0);
      const productId = getCartProductId(item);
      if (productId != null) quantities[productId] = (quantities[productId] || 0) + quantity;
      return total + quantity;
    }, 0);
    basketQuantities.value = quantities;
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
      basketQuantities.value = {};
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
  maxPrice.value = null;
  visibleCount.value = 12;
}

function getProductImage(product) {
  if (product.image_url) return product.image_url;

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
  return imageFallback;
}

function handleImageError(event) {
  if (event.target.src !== imageFallback) event.target.src = imageFallback;
}

function getMinimumQuantity(product) {
  if (!product.supplier_prices?.length) return 1;
  return Math.min(...product.supplier_prices.map((supplier) => Number(supplier.minimum_quantity || 1)));
}

function getMinimumSelectableQuantity(product) {
  const stock = Number(product.quantity_available || 0);
  if (stock <= 0 || !product.supplier_prices?.length) return stock > 0 ? 1 : 0;

  const possibleMinimums = product.supplier_prices
    .map((supplier) => Number(supplier.minimum_quantity || 1))
    .filter((minimum) => Number.isFinite(minimum) && minimum >= 1 && minimum <= stock);

  return possibleMinimums.length ? Math.min(...possibleMinimums) : 1;
}

function getPurchaseQuantity(product) {
  const stock = Number(product.quantity_available || 0);
  if (stock <= 0) return 0;

  const current = Number(requestedQuantities.value[product.product_id]);
  const fallback = getMinimumSelectableQuantity(product);
  if (!Number.isFinite(current) || current < fallback) return Math.min(fallback, stock);
  return Math.min(Math.round(current), stock);
}

function setPurchaseQuantity(product, value) {
  const stock = Number(product.quantity_available || 0);
  if (!stock) {
    requestedQuantities.value[product.product_id] = 0;
    return;
  }

  const minimum = getMinimumSelectableQuantity(product);
  const parsed = Number(value);
  const quantity = Number.isFinite(parsed) ? Math.round(parsed) : minimum;
  requestedQuantities.value[product.product_id] = Math.min(Math.max(quantity, minimum), stock);
}

function changeQuantity(product, delta) {
  setPurchaseQuantity(product, getPurchaseQuantity(product) + delta);
}

function getEligibleSuppliers(product) {
  const quantity = getPurchaseQuantity(product);
  const stock = Number(product.quantity_available || 0);
  return (product.supplier_prices || []).filter((supplier) => {
    const minimum = Number(supplier.minimum_quantity || 1);
    return stock >= quantity && minimum <= quantity;
  });
}

function getPreferredSupplier(product) {
  const selectedId = selectedSuppliers.value[product.product_id];
  return getEligibleSuppliers(product).find((supplier) => supplier.supplier_price_id === selectedId) || null;
}

function getBestSupplier(product) {
  const preferred = getPreferredSupplier(product);
  if (preferred) return preferred;
  return [...getEligibleSuppliers(product)].sort((a, b) => Number(a.price) - Number(b.price))[0] || null;
}

function getLowestPrice(product) {
  const prices = getEligibleSuppliers(product).map((supplier) => Number(supplier.price));
  return prices.length ? Math.min(...prices) : 0;
}

function getHighestPrice(product) {
  const prices = getEligibleSuppliers(product).map((supplier) => Number(supplier.price));
  return prices.length ? Math.max(...prices) : 0;
}

function getSaving(product) {
  const lowest = getLowestPrice(product);
  const highest = getHighestPrice(product);
  return highest > lowest ? highest - lowest : 0;
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

function getStockClass(product) {
  const stock = Number(product.quantity_available || 0);
  return stock > 20 ? "in-stock" : stock > 0 ? "low-stock" : "out-of-stock";
}

function getStockLabel(product) {
  const stock = Number(product.quantity_available || 0);
  return stock > 20 ? "IN STOCK" : stock > 0 ? "LOW STOCK" : "OUT OF STOCK";
}

function getBasketQuantity(product) {
  return Number(basketQuantities.value[product.product_id] || 0);
}

function toggleProduct(id) {
  expandedProduct.value = expandedProduct.value === id ? null : id;
}

function showBasketMessage(text, duration = 3000) {
  message.value = text;
  window.clearTimeout(toastTimer.value);
  toastTimer.value = window.setTimeout(() => {
    message.value = "";
  }, duration);
}

async function refreshProductStock(product) {
  const response = await getProducts();
  const latestProducts = Array.isArray(response) ? response : response.products || [];
  const latest = latestProducts.find((item) => item.product_id === product.product_id);

  if (!latest) return product;

  const index = products.value.findIndex((item) => item.product_id === product.product_id);
  if (index !== -1) products.value[index] = latest;
  initialiseProductState(latest, false);
  return latest;
}

async function addProductToBasket(product, supplier) {
  const quantity = getPurchaseQuantity(product);
  await addCartItem({
    product_id: product.product_id,
    supplier_price_id: supplier.supplier_price_id,
    quantity,
  });
  await syncCloudBasket();
  window.dispatchEvent(new CustomEvent("basket-updated", { detail: basketCount.value }));
  showBasketMessage(`${quantity} × ${product.product_name} added from ${supplier.supplier_name} at R${Number(supplier.price).toFixed(2)} each.`);
}

async function addToBasket(product) {
  syncAuth();
  if (!isAuthenticated.value) {
    showBasketMessage("Please join or log in before adding items to your group basket.", 3500);
    return;
  }

  try {
    const latest = await refreshProductStock(product);
    const supplier = getBestSupplier(latest);
    if (!supplier) {
      showBasketMessage("This item is no longer available for the selected quantity. Please adjust the quantity.", 3500);
      return;
    }
    await addProductToBasket(latest, supplier);
  } catch (error) {
    console.error("Cloud basket add failed:", error);
    if ([400, 409, 422].includes(error.response?.status)) {
      await loadCatalogue(false);
    }
    showBasketMessage(error.response?.data?.message || "We could not add this product to the group basket. Stock may have changed.", 4000);
  }
}

async function addSupplierToBasket(product, supplier) {
  syncAuth();
  if (!isAuthenticated.value) {
    showBasketMessage("Please join or log in before adding items to your group basket.", 3500);
    return;
  }

  const minimum = Number(supplier.minimum_quantity || 1);
  if (!isSupplierEligible(product, supplier)) {
    showBasketMessage(`This supplier requires at least ${minimum} unit${minimum === 1 ? "" : "s"}.`, 3500);
    if (Number(product.quantity_available || 0) >= minimum) setPurchaseQuantity(product, minimum);
    return;
  }

  persistSelectedSupplier(product.product_id, supplier.supplier_price_id);

  try {
    const latest = await refreshProductStock(product);
    const latestSupplier = (latest.supplier_prices || []).find((item) => item.supplier_price_id === supplier.supplier_price_id);
    if (!latestSupplier || !isSupplierEligible(latest, latestSupplier)) {
      showBasketMessage("That supplier option is no longer available for the selected quantity.", 3500);
      return;
    }
    await addProductToBasket(latest, latestSupplier);
  } catch (error) {
    console.error("Supplier basket add failed:", error);
    if ([400, 409, 422].includes(error.response?.status)) await loadCatalogue(false);
    showBasketMessage(error.response?.data?.message || "We could not add this supplier option. Stock may have changed.", 4000);
  }
}

const categories = computed(() => {
  const unique = new Set(products.value.map((product) => String(product.category || "").trim()).filter(Boolean));
  return ["All Products", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
});

const hasActiveFilters = computed(() => Boolean(search.value || selectedCategory.value !== "All Products" || maxPrice.value));

const filteredProducts = computed(() => {
  let result = products.value.filter((product) => {
    const name = String(product.product_name || "").toLowerCase();
    const category = String(product.category || "");
    const price = Number(getBestSupplier(product)?.price ?? Infinity);
    const matchesSearch = name.includes(search.value.trim().toLowerCase());
    const matchesCategory = selectedCategory.value === "All Products" || category === selectedCategory.value;
    const matchesPrice = !maxPrice.value || (Number.isFinite(price) && price <= Number(maxPrice.value));
    return matchesSearch && matchesCategory && matchesPrice;
  });

  if (sortOption.value === "price-low") result = [...result].sort((a, b) => (getBestSupplier(a)?.price ?? Infinity) - (getBestSupplier(b)?.price ?? Infinity));
  if (sortOption.value === "price-high") result = [...result].sort((a, b) => (getBestSupplier(b)?.price ?? -Infinity) - (getBestSupplier(a)?.price ?? -Infinity));
  if (sortOption.value === "name") result = [...result].sort((a, b) => String(a.product_name).localeCompare(String(b.product_name)));
  return result;
});

const visibleProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value));

function initialiseProductState(product, preserveQuantity = true) {
  const stock = Number(product.quantity_available || 0);
  const minimum = stock > 0 ? getMinimumSelectableQuantity(product) : 0;
  if (!preserveQuantity || !requestedQuantities.value[product.product_id]) requestedQuantities.value[product.product_id] = minimum;
  supplierSort.value[product.product_id] ||= "price-low";
}

async function loadCatalogue(showLoader = true) {
  if (showLoader) {
    loading.value = true;
    errorMessage.value = "";
  }

  try {
    const response = await getProducts();
    products.value = Array.isArray(response) ? response : response.products || [];
    products.value.forEach((product) => initialiseProductState(product));
  } catch (error) {
    console.error("Catalogue loading failed:", error);
    errorMessage.value = "Please make sure the StockWell API is running and try again.";
  } finally {
    if (showLoader) loading.value = false;
  }
}

function loadMore() {
  visibleCount.value += 12;
}

function handleAuthChange() {
  syncAuth();
  syncCloudBasket();
}

function handleBasketChange() {
  syncCloudBasket();
}

watch([search, selectedCategory, maxPrice, sortOption], () => {
  visibleCount.value = 12;
});

onMounted(async () => {
  syncAuth();
  await loadCatalogue();
  await syncCloudBasket();

  window.addEventListener("login-completed", handleAuthChange);
  window.addEventListener("auth-updated", handleAuthChange);
  window.addEventListener("basket-updated", handleBasketChange);
  window.addEventListener("cart-state-updated", handleBasketChange);
  window.addEventListener("storage", handleBasketChange);
});

onUnmounted(() => {
  window.clearTimeout(toastTimer.value);
  window.removeEventListener("login-completed", handleAuthChange);
  window.removeEventListener("auth-updated", handleAuthChange);
  window.removeEventListener("basket-updated", handleBasketChange);
  window.removeEventListener("cart-state-updated", handleBasketChange);
  window.removeEventListener("storage", handleBasketChange);
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
  width: 100%;
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
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 10px;
}

.shop-toolbar button,
.shop-toolbar select,
.price-filter,
.search-box,
.category-list button,
.add-button,
.compare-button,
.empty-state button,
.retry-button,
.load-more-button {
  min-height: 46px;
  border: 1px solid var(--catalogue-border);
  border-radius: 12px;
  font: inherit;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.category-button,
.shop-toolbar select,
.price-filter {
  padding: 12px 15px;
  background: var(--catalogue-surface-raised);
  color: var(--sw-page-text);
  cursor: pointer;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 126px;
}

.price-filter span {
  color: var(--catalogue-muted);
  font-size: 12px;
}

.price-filter input {
  width: 72px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--sw-page-text);
  font: inherit;
}

.category-button:hover,
.shop-toolbar select:hover,
.price-filter:hover,
.category-list button:hover,
.compare-button:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--sw-gold-500) 55%, var(--catalogue-border));
  background: var(--catalogue-surface-raised);
}

.category-button:focus-visible,
.shop-toolbar select:focus-visible,
.search-box:focus-within,
.price-filter:focus-within,
.category-list button:focus-visible,
.compare-button:focus-visible,
.add-button:focus-visible,
.supplier-add-button:focus-visible,
.empty-state button:focus-visible,
.retry-button:focus-visible,
.load-more-button:focus-visible,
.active-filter button:focus-visible,
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: var(--catalogue-muted);
  font-size: 14px;
}

.active-filter strong {
  color: var(--sw-page-text);
}

.active-filter button {
  margin-left: auto;
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
  align-items: stretch;
}

.product-card {
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100%;
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
  width: auto;
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

.price-block {
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
  white-space: nowrap;
}

.saving {
  flex: 0 0 auto;
  max-width: 48%;
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

.in-stock {
  color: #2f9e62;
  font-weight: 700;
}

.low-stock,
.out-of-stock {
  color: var(--sw-red-600);
  font-weight: 700;
}

.basket-status {
  min-height: 36px;
  margin-bottom: 8px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid color-mix(in srgb, var(--sw-gold-500) 35%, var(--catalogue-border-soft));
  border-radius: 10px;
  background: color-mix(in srgb, var(--sw-gold-500) 8%, var(--catalogue-surface));
  color: var(--catalogue-muted);
  font-size: 12px;
}

.basket-status strong {
  color: var(--sw-gold-500);
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

.card-action-spacer {
  min-height: 0;
  flex: 1 1 auto;
}

.add-button {
  min-height: 46px;
  height: 46px;
  flex: 0 0 46px;
  margin-top: 8px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-color: transparent;
  background: var(--sw-button-gradient);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.add-button:hover:not(:disabled),
.empty-state button:hover,
.retry-button:hover,
.load-more-button:hover,
.supplier-add-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--catalogue-shadow);
}

.supplier-list {
  margin-top: 0;
  margin-bottom: 0;
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

.supplier-row.cheapest,
.supplier-row.selected {
  border-color: var(--sw-gold-500);
  background: color-mix(in srgb, var(--sw-gold-500) 8%, var(--catalogue-surface));
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
.empty-state p,
.load-more-wrap p {
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

.empty-state button,
.retry-button,
.load-more-button {
  padding: 10px 15px;
  border-color: transparent;
  background: var(--sw-button-gradient);
  color: #fff;
  cursor: pointer;
}

.load-more-wrap {
  margin-top: 24px;
  display: grid;
  place-items: center;
  gap: 10px;
}

.load-more-button {
  min-width: 210px;
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

.loader {
  width: 34px;
  height: 34px;
  border: 3px solid var(--catalogue-border);
  border-top-color: var(--sw-gold-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

@media (max-width: 1000px) {
  .shop-toolbar {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .price-filter {
    grid-column: 1 / 3;
    justify-content: center;
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

  .price-filter {
    grid-column: auto;
    justify-content: flex-start;
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
    gap: 8px;
  }

  .saving {
    max-width: 42%;
    font-size: 11px;
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

  .add-button {
    min-height: 48px;
    height: 48px;
    font-size: 12px;
  }

  .toast {
    right: 14px;
    bottom: 14px;
  }
}
</style>
