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

              <div
                class="basket-status"
                :class="{ empty: getBasketQuantity(product) === 0 }"
                :aria-hidden="getBasketQuantity(product) === 0 ? 'true' : undefined"
              >
                <span>In your basket</span>
                <strong>{{ getBasketQuantity(product) }}</strong>
              </div>

              <div class="quantity-control" :class="{ disabled: product.quantity_available < 1 }">
                <span>Quantity</span>
                <div class="quantity-picker">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    :disabled="getPurchaseQuantity(product) <= getMinimumSelectableQuantity(product)"
                    @click="changeQuantity(product, -1)"
                  >−</button>
                  <input
                    :value="getPurchaseQuantity(product)"
                    type="number"
                    :min="Math.max(1, getMinimumSelectableQuantity(product))"
                    :max="Math.max(1, Number(product.quantity_available || 0))"
                    aria-label="Purchase quantity"
                    :disabled="product.quantity_available < 1"
                    @change="setPurchaseQuantity(product, $event.target.value)"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    :disabled="getPurchaseQuantity(product) >= Number(product.quantity_available || 0) || product.quantity_available < 1"
                    @click="changeQuantity(product, 1)"
                  >+</button>
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
                  :class="{ cheapest: getBestSupplier(product)?.supplier_price_id === supplier.supplier_price_id, selected: isSupplierSelected(product, supplier), unavailable: !isSupplierEligible(product, supplier) }"
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
                      {{ isSupplierEligible(product, supplier) ? (isSupplierSelected(product, supplier) ? `Add ${getPurchaseQuantity(product)}` : "Use & Add") : `Min ${supplier.minimum_quantity || 1}` }}
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

const supplierStorageKey = "stockwellSelectedSuppliers";
const imageFallback = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&h=700&fit=crop";

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

function loadStoredSuppliers() {
  try {
    const stored = JSON.parse(localStorage.getItem(supplierStorageKey) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function persistSelectedSupplier(productId, supplierPriceId) {
  selectedSuppliers.value = { ...selectedSuppliers.value, [productId]: supplierPriceId };
  localStorage.setItem(supplierStorageKey, JSON.stringify(selectedSuppliers.value));
}

function supplierIdsMatch(first, second) {
  return first != null && second != null && String(first) === String(second);
}

function isSupplierSelected(product, supplier) {
  return supplierIdsMatch(selectedSuppliers.value[product.product_id], supplier.supplier_price_id);
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
    const cartItems = Array.isArray(response.items) ? response.items : [];
    // The basket badge counts distinct cart lines, not units.
    // Example: 10 Huletts Sugar = 1 item in the cart.
    basketCount.value = cartItems.length;
    cartItems.forEach((item) => {
      const quantity = Number(item.quantity || 0);
      const productId = getCartProductId(item);
      if (productId != null) quantities[productId] = (quantities[productId] || 0) + quantity;
    });
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
  const name = String(product.product_name || "").toLowerCase();
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
  return getEligibleSuppliers(product).find((supplier) => supplierIdsMatch(supplier.supplier_price_id, selectedId)) || null;
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
  const latest = latestProducts.find((item) => supplierIdsMatch(item.product_id, product.product_id));

  if (!latest) return product;

  const index = products.value.findIndex((item) => supplierIdsMatch(item.product_id, product.product_id));
  if (index !== -1) products.value[index] = latest;

  // Keep the user's requested quantity when refreshing live stock.
  initialiseProductState(latest, true);
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
  window.dispatchEvent(new CustomEvent("basket-updated", { detail: { itemCount: basketCount.value } }));
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
    if ([400, 409, 422].includes(error.response?.status)) await loadCatalogue(false);
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

  try {
    const latest = await refreshProductStock(product);
    const latestSupplier = (latest.supplier_prices || []).find((item) => supplierIdsMatch(item.supplier_price_id, supplier.supplier_price_id));
    if (!latestSupplier || !isSupplierEligible(latest, latestSupplier)) {
      showBasketMessage("That supplier option is no longer available for the selected quantity.", 3500);
      return;
    }

    await addProductToBasket(latest, latestSupplier);

    // Only remember the supplier after the actual add succeeds.
    persistSelectedSupplier(latest.product_id, latestSupplier.supplier_price_id);
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
  const existing = requestedQuantities.value[product.product_id];

  if (!preserveQuantity || existing == null || !Number.isFinite(Number(existing))) {
    requestedQuantities.value[product.product_id] = minimum;
  } else if (stock > 0) {
    requestedQuantities.value[product.product_id] = Math.min(Math.max(Number(existing), minimum), stock);
  } else {
    requestedQuantities.value[product.product_id] = 0;
  }

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
.catalogue-page{
  min-height:100vh;
  padding:48px 30px 70px;
  background:var(--sw-page-background);
  color:var(--sw-page-text);
  font-family:var(--sw-font-body);
}
.catalogue-page *,
.catalogue-page *::before,
.catalogue-page *::after{box-sizing:border-box}

.catalogue-hero,
.shop-toolbar,
.category-panel,
.active-filter,
.products-area{
  width:100%;
  max-width:1200px;
  margin-inline:auto;
}

.catalogue-hero{
  margin-bottom:28px;
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:30px;
}
.eyebrow,
.category-title>span,
.basket-summary>span,
.best-supplier>span{
  margin:0;
  color:var(--sw-purple-700);
  font-family:var(--sw-font-mono,"DM Mono",monospace);
  font-size:10px;
  font-weight:700;
  letter-spacing:.13em;
  text-transform:uppercase;
}
.catalogue-hero h1{
  margin:12px 0;
  font-family:var(--sw-font-heading);
  font-size:clamp(40px,6vw,65px);
  line-height:.95;
  letter-spacing:-.055em;
}
.catalogue-hero h1 span{color:var(--sw-purple-700)}
.hero-copy{
  max-width:520px;
  margin:0;
  color:var(--sw-page-text-soft);
  font-size:13px;
  line-height:1.65;
}

.basket-summary{
  min-width:190px;
  padding:20px;
  background:var(--sw-page-surface);
  border:1px solid var(--sw-input-border);
  border-radius:16px;
}
.basket-summary strong{
  display:inline-block;
  margin:6px 5px 0 0;
  font-family:var(--sw-font-heading);
  font-size:35px;
  line-height:1;
}
.basket-summary small{
  color:var(--sw-page-text-soft);
  font-size:10px;
}
.basket-summary a{
  display:block;
  margin-top:12px;
  color:var(--sw-purple-700);
  font-size:11px;
  font-weight:700;
  text-decoration:none;
}
.basket-summary a:hover{text-decoration:underline;text-underline-offset:3px}

.shop-toolbar{
  margin-bottom:20px;
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto auto;
  gap:10px;
}
.category-button,
.shop-toolbar select,
.price-filter,
.search-box{
  min-height:44px;
  border:1px solid var(--sw-input-border);
  border-radius:11px;
  background:var(--sw-page-surface);
  color:var(--sw-page-text);
}
.category-button{
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px 16px;
  cursor:pointer;
  font:700 12px var(--sw-font-body);
}
.category-button b{margin-left:8px;color:var(--sw-gold-500)}
.search-box{
  display:flex;
  align-items:center;
  gap:10px;
  padding:0 13px;
}
.search-box>span{color:var(--sw-purple-700);font-size:18px}
.search-box input{
  width:100%;
  border:0;
  outline:0;
  background:transparent;
  color:var(--sw-page-text);
  padding:12px 0;
  font:12px var(--sw-font-body);
}
.search-box input::placeholder{color:var(--sw-page-text-muted)}
.price-filter{
  display:flex;
  align-items:center;
  gap:5px;
  min-width:126px;
  padding:0 12px;
}
.price-filter span{color:var(--sw-page-text-soft);font-size:11px}
.price-filter input{
  width:72px;
  border:0;
  outline:0;
  background:transparent;
  color:var(--sw-page-text);
  font:11px var(--sw-font-body);
}
.shop-toolbar select{
  min-width:145px;
  padding:0 12px;
  cursor:pointer;
  font:11px var(--sw-font-body);
}
.category-button:hover,
.shop-toolbar select:hover,
.price-filter:hover,
.search-box:focus-within{border-color:var(--sw-purple-700)}

.category-panel{
  margin:0 auto 20px;
  padding:20px;
  background:var(--sw-page-surface);
  border:1px solid var(--sw-input-border);
  border-radius:16px;
}
.category-title{margin-bottom:15px}
.category-title small{
  display:block;
  margin-top:4px;
  color:var(--sw-page-text-soft);
  font-size:10px;
}
.category-list{display:flex;flex-wrap:wrap;gap:8px}
.category-list button{
  display:flex;
  align-items:center;
  gap:7px;
  padding:9px 13px;
  background:var(--sw-page-background);
  color:var(--sw-page-text);
  border:1px solid var(--sw-input-border);
  border-radius:10px;
  cursor:pointer;
  font:11px var(--sw-font-body);
}
.category-list button.active{
  background:var(--sw-gold-500);
  border-color:var(--sw-gold-500);
  color:var(--sw-purple-900);
  font-weight:700;
}
.category-icon{font-size:15px}

.active-filter{
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:8px;
  margin:0 auto 20px;
  padding:8px 2px;
  color:var(--sw-page-text-soft);
  font:10px var(--sw-font-mono,"DM Mono",monospace);
}
.active-filter strong{color:var(--sw-purple-700)}
.active-filter button{
  margin-left:auto;
  border:0;
  background:transparent;
  color:var(--sw-orange-600);
  cursor:pointer;
  font-size:16px;
}

.product-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:18px;
}
.product-card{
  position:relative;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  min-width:0;
  background:var(--sw-page-surface);
  border:1px solid var(--sw-input-border);
  border-radius:17px;
  transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
}
.product-card:hover{
  transform:translateY(-4px);
  border-color:var(--sw-purple-700);
  box-shadow:var(--sw-card-shadow-hover,var(--sw-card-shadow));
}
.product-image{
  position:relative;
  height:230px;
  display:grid;
  place-items:center;
  padding:20px;
  background:var(--sw-page-background);
  border-bottom:1px solid var(--sw-input-border);
}
.product-image img{
  width:85%;
  height:85%;
  object-fit:contain;
  transition:transform .2s ease;
}
.product-card:hover .product-image img{transform:scale(1.04)}
.deal-badge,
.bulk-badge{
  position:absolute;
  top:12px;
  z-index:2;
  padding:6px 8px;
  border-radius:7px;
  font:700 8px var(--sw-font-mono,"DM Mono",monospace);
  letter-spacing:.04em;
}
.deal-badge{left:12px;background:var(--sw-gold-500);color:var(--sw-purple-900)}
.bulk-badge{right:12px;background:var(--sw-purple-900);color:#fff}

.product-info{
  min-width:0;
  padding:18px;
  display:flex;
  flex-direction:column;
}
.category-label{
  color:var(--sw-purple-700);
  font:9px var(--sw-font-mono,"DM Mono",monospace);
  text-transform:uppercase;
}
.product-info h2{
  margin:7px 0;
  min-height:36px;
  font:700 15px/1.25 var(--sw-font-body);
}
.description{
  min-height:31px;
  margin:0;
  overflow:hidden;
  color:var(--sw-page-text-soft);
  font-size:10px;
  line-height:1.5;
}

.price-row{
  min-height:62px;
  margin-top:14px;
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:10px;
}
.price-block small,
.price-row small{
  display:block;
  color:var(--sw-page-text-soft);
  font:8px var(--sw-font-mono,"DM Mono",monospace);
}
.price-row strong{
  display:block;
  margin-top:3px;
  font-family:var(--sw-font-heading);
  font-size:21px;
  white-space:nowrap;
}
.saving{
  padding:5px 7px;
  border-radius:6px;
  background:color-mix(in srgb,#22c55e 12%,var(--sw-page-surface));
  color:#168348;
  font-size:9px;
  font-weight:700;
  text-align:right;
}

.best-supplier{
  display:grid;
  gap:5px;
  margin-top:14px;
  padding:10px;
  background:var(--sw-page-background);
  border-radius:9px;
}
.best-supplier>span{
  color:var(--sw-page-text-soft);
  font-size:8px;
}
.best-supplier strong{
  color:var(--sw-purple-700);
  font-size:10px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.stock-row{
  display:flex;
  justify-content:space-between;
  gap:10px;
  margin:13px 0;
  color:var(--sw-page-text-soft);
  font:8px var(--sw-font-mono,"DM Mono",monospace);
}
.in-stock{color:#168348;font-weight:700}
.low-stock,.out-of-stock{color:var(--sw-red-600);font-weight:700}

.basket-status{
  min-height:34px;
  margin-bottom:8px;
  padding:8px 10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  border:1px solid var(--sw-input-border);
  border-radius:9px;
  background:var(--sw-page-background);
  color:var(--sw-page-text-soft);
  font-size:10px;
}
.basket-status.empty{visibility:hidden;pointer-events:none}
.basket-status strong{color:var(--sw-gold-500)}

.quantity-control{
  min-height:44px;
  margin-bottom:8px;
  padding:6px 8px 6px 10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border:1px solid var(--sw-input-border);
  border-radius:10px;
  background:var(--sw-page-background);
  color:var(--sw-page-text-soft);
  font-size:10px;
}
.quantity-picker{display:inline-flex;align-items:center;gap:5px}
.quantity-picker button{
  width:30px;
  height:30px;
  border:1px solid var(--sw-input-border);
  border-radius:8px;
  background:var(--sw-page-surface);
  color:var(--sw-page-text);
  cursor:pointer;
  font:700 12px var(--sw-font-body);
}
.quantity-picker input{
  width:42px;
  height:30px;
  border:1px solid var(--sw-input-border);
  border-radius:8px;
  background:var(--sw-page-surface);
  color:var(--sw-page-text);
  text-align:center;
  font:12px var(--sw-font-body);
}
.quantity-picker button:disabled,
.quantity-picker input:disabled{opacity:.45;cursor:not-allowed}

.compare-button{
  width:100%;
  min-height:42px;
  margin-bottom:8px;
  padding:9px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  border:1px solid var(--sw-input-border);
  background:transparent;
  color:var(--sw-page-text);
  border-radius:9px;
  cursor:pointer;
  font:10px var(--sw-font-body);
}
.compare-button span{color:var(--sw-gold-500)}

.supplier-list{
  margin-top:2px;
  display:grid;
  gap:7px;
}
.supplier-toolbar{
  padding:7px 9px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border:1px solid var(--sw-input-border);
  border-radius:9px;
  background:var(--sw-page-background);
  color:var(--sw-page-text-soft);
  font-size:9px;
}
.supplier-toolbar select{
  max-width:160px;
  border:0;
  outline:0;
  background:transparent;
  color:var(--sw-page-text);
  font:9px var(--sw-font-body);
}
.supplier-row{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  align-items:center;
  gap:10px;
  padding:9px;
  border:1px solid var(--sw-input-border);
  border-radius:9px;
  background:var(--sw-page-background);
}
.supplier-row.cheapest,
.supplier-row.selected{
  background:color-mix(in srgb,var(--sw-gold-500) 10%,var(--sw-page-background));
  border-color:var(--sw-gold-500);
}
.supplier-details{min-width:0;display:grid;gap:2px}
.supplier-details strong{font-size:10px}
.supplier-details small{color:var(--sw-page-text-soft);font-size:8px}
.supplier-action{display:grid;justify-items:end;gap:6px}
.supplier-action>span{font-size:10px;font-weight:700}
.supplier-add-button{
  min-height:29px;
  padding:6px 9px;
  border:1px solid var(--sw-input-border);
  border-radius:7px;
  background:var(--sw-page-surface);
  color:var(--sw-page-text);
  cursor:pointer;
  font:700 9px var(--sw-font-body);
}
.supplier-add-button:disabled{opacity:.45;cursor:not-allowed}

.card-action-spacer{flex:1 1 auto;min-height:10px}
.add-button{
  width:100%;
  min-height:44px;
  margin-top:10px;
  padding:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  border:0;
  border-radius:10px;
  background:var(--sw-purple-900);
  color:#fff;
  cursor:pointer;
  font:700 11px var(--sw-font-body);
}
.add-button span{color:var(--sw-gold-500);font-size:15px}
.add-button:hover:not(:disabled){
  background:var(--sw-gold-500);
  color:var(--sw-purple-900);
}
.add-button:disabled,
.compare-button:disabled{opacity:.5;cursor:not-allowed}

.toast{
  position:fixed;
  right:20px;
  top:90px;
  z-index:100;
  max-width:min(420px,calc(100vw - 32px));
  padding:13px 17px;
  background:var(--sw-purple-900);
  color:#fff;
  border-left:4px solid var(--sw-gold-500);
  border-radius:8px;
  font-size:11px;
  box-shadow:var(--sw-card-shadow);
}

.state,
.empty-state{
  min-height:260px;
  padding:60px 20px;
  display:grid;
  place-items:center;
  align-content:center;
  gap:8px;
  text-align:center;
  border:1px solid var(--sw-input-border);
  border-radius:16px;
  background:var(--sw-page-surface);
}
.state{color:var(--sw-page-text-soft)}
.state p,
.empty-state p{margin:0;color:var(--sw-page-text-soft);font-size:12px}
.loader{
  width:30px;
  height:30px;
  margin:auto;
  border:3px solid var(--sw-input-border);
  border-top-color:var(--sw-gold-500);
  border-radius:50%;
  animation:spin .8s linear infinite;
}
.empty-state>div{font-size:45px}
.empty-state h2{margin:0}
.empty-state button,
.retry-button,
.load-more-button{
  margin-top:10px;
  padding:10px 15px;
  border:0;
  border-radius:9px;
  background:var(--sw-gold-500);
  color:var(--sw-purple-900);
  cursor:pointer;
  font:700 10px var(--sw-font-body);
}
.load-more-wrap{
  margin-top:22px;
  display:grid;
  place-items:center;
  gap:10px;
}
.load-more-wrap p{
  margin:0;
  color:var(--sw-page-text-soft);
  font-size:11px;
}
.load-more-button{min-width:190px}

.category-slide-enter-active,
.category-slide-leave-active{transition:all .2s ease}
.category-slide-enter-from,
.category-slide-leave-to{opacity:0;transform:translateY(-8px)}
@keyframes spin{to{transform:rotate(360deg)}}

@media (max-width:950px){
  .product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .shop-toolbar{grid-template-columns:auto minmax(0,1fr) auto}
  .price-filter{grid-column:1/-1}
}
@media (max-width:750px){
  .catalogue-page{padding:40px 20px 60px}
  .catalogue-hero{flex-direction:column;align-items:flex-start}
  .basket-summary{width:100%}
  .shop-toolbar{grid-template-columns:1fr}
  .price-filter{grid-column:auto}
}
@media (max-width:600px){
  .catalogue-page{padding:30px 16px 50px}
  .product-grid{grid-template-columns:1fr}
  .product-image{height:250px}
  .catalogue-hero h1{font-size:clamp(38px,13vw,54px)}
  .category-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .category-list button{width:100%}
  .price-row{align-items:flex-start}
  .saving{max-width:45%;font-size:8px}
  .supplier-row{grid-template-columns:minmax(0,1fr)}
  .supplier-action{grid-template-columns:auto auto;justify-items:stretch;align-items:center}
  .supplier-toolbar{align-items:flex-start;flex-direction:column}
  .supplier-toolbar select{width:100%;max-width:none}
}
</style>
