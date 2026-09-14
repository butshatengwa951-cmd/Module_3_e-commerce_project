<template>

  <div class="catalogue-page" :class="theme">

    <!-- TOP INTRO -->
    <section class="catalogue-hero">

      <div>

        <div class="eyebrow">
          STOCKWELL MARKET
        </div>

        <h1>
          Groceries for
          <span>your group.</span>
        </h1>

        <p>
          Compare supplier prices, choose your best deal
          and build your stokvel's bulk basket.
        </p>

      </div>

      <div class="basket-summary">

        <span>GROUP BASKET</span>

        <strong>{{ basketCount }}</strong>

        <small>items added</small>

        <RouterLink to="/cart">
          View basket →
        </RouterLink>

      </div>

    </section>


    <!-- SHOP TOOLBAR -->
    <section class="shop-toolbar">

      <button
        class="category-button"
        @click="showCategories = !showCategories"
      >
        <span>☰</span>

        Categories

        <b>
          {{ showCategories ? "↑" : "↓" }}
        </b>
      </button>


      <div class="search-box">

        <span>⌕</span>

        <input
          v-model="search"
          type="text"
          placeholder="Search groceries..."
        />

      </div>


      <select v-model="sortOption">

        <option value="default">
          Recommended
        </option>

        <option value="price-low">
          Price: Low to High
        </option>

        <option value="price-high">
          Price: High to Low
        </option>

        <option value="name">
          Name A-Z
        </option>

      </select>

    </section>


    <!-- CATEGORY DROPDOWN -->
    <transition name="category-slide">

      <section
        v-if="showCategories"
        class="category-panel"
      >

        <div class="category-title">

          <span>CATEGORIES</span>

          <small>
            Choose what your group needs
          </small>

        </div>


        <div class="category-list">

          <button
            v-for="category in categories"
            :key="category"
            :class="{
              active: selectedCategory === category
            }"
            @click="selectCategory(category)"
          >

            <span class="category-icon">
              {{ getCategoryIcon(category) }}
            </span>

            <span>
              {{ category }}
            </span>

          </button>

        </div>

      </section>

    </transition>


    <!-- ACTIVE FILTER -->
    <div
      v-if="selectedCategory !== 'All Products'"
      class="active-filter"
    >

      Showing:

      <strong>
        {{ selectedCategory }}
      </strong>

      <button @click="selectedCategory = 'All Products'">
        ×
      </button>

    </div>


    <!-- PRODUCT AREA -->
    <main class="products-area">

      <div
        v-if="message"
        class="toast"
      >
        {{ message }}
      </div>


      <div
        v-if="loading"
        class="state"
      >
        <div class="loader"></div>

        <p>Loading StockWell groceries...</p>
      </div>


      <div
        v-else-if="errorMessage"
        class="state error"
      >
        <strong>We couldn't load the catalogue.</strong>

        <p>{{ errorMessage }}</p>

      </div>


      <div
        v-else-if="filteredProducts.length"
        class="product-grid"
      >

        <article
          v-for="product in filteredProducts"
          :key="product.product_id"
          class="product-card"
        >

          <!-- IMAGE -->
          <div class="product-image">

            <span
              v-if="getSaving(product) > 0"
              class="deal-badge"
            >
              BEST DEAL
            </span>

            <span class="bulk-badge">
              10+
            </span>

            <img
              :src="getProductImage(product)"
              :alt="product.product_name"
              @error="handleImageError"
            />

          </div>


          <!-- INFO -->
          <div class="product-info">

            <span class="category-label">
              {{ product.category }}
            </span>

            <h2>
              {{ product.product_name }}
            </h2>

            <p class="description">
              {{ product.description || "Quality household essential." }}
            </p>


            <!-- PRICE -->
            <div class="price-row">

              <div>

                <small>
                  Best group price
                </small>

                <strong>
                  R{{ getLowestPrice(product).toFixed(2) }}
                </strong>

              </div>

              <div
                v-if="getSaving(product) > 0"
                class="saving"
              >
                Save R{{ getSaving(product).toFixed(2) }}
              </div>

            </div>


            <!-- SUPPLIER -->
            <div class="best-supplier">

              <span>BEST SUPPLIER</span>

              <strong>
                {{ getCheapestSupplier(product) || "Price unavailable" }}
              </strong>

            </div>


            <!-- STOCK -->
            <div class="stock-row">

              <span>
                {{ product.quantity_available }} available
              </span>

              <span
                :class="
                  product.quantity_available > 20
                    ? 'in-stock'
                    : 'low-stock'
                "
              >
                {{
                  product.quantity_available > 20
                    ? "IN STOCK"
                    : "LOW STOCK"
                }}
              </span>

            </div>


            <!-- COMPARE -->
            <button
              class="compare-button"
              @click="toggleProduct(product.product_id)"
            >

              Compare suppliers

              <span>
                {{
                  expandedProduct === product.product_id
                    ? "↑"
                    : "↓"
                }}
              </span>

            </button>


            <!-- SUPPLIERS -->
            <div
              v-if="expandedProduct === product.product_id"
              class="supplier-list"
            >

              <div
                v-for="supplier in product.supplier_prices"
                :key="supplier.supplier_price_id"
                class="supplier-row"
                :class="{
                  cheapest:
                    Number(supplier.price) ===
                    getLowestPrice(product)
                }"
              >

                <div>

                  <strong>
                    {{ supplier.supplier_name }}
                  </strong>

                  <small>
                    Minimum {{ supplier.minimum_quantity }}
                  </small>

                </div>

                <span>
                  R{{ Number(supplier.price).toFixed(2) }}
                </span>

              </div>

            </div>


            <!-- ADD -->
            <button
              class="add-button"
              @click="addToBasket(product)"
            >

              <span>+</span>

              Add to Group Basket

            </button>

          </div>

        </article>

      </div>


      <!-- NO PRODUCTS -->
      <div
        v-else
        class="empty-state"
      >

        <div>🧺</div>

        <h2>No groceries found</h2>

        <p>
          Try another search or category.
        </p>

        <button
          @click="resetFilters"
        >
          Show all products
        </button>

      </div>

    </main>

  </div>

</template>


<script setup>

import {
  computed,
  onMounted,
  ref
} from "vue";

import {
  getProducts
} from "../services/api.js";


defineProps({
  theme: {
    type: String,
    default: "light"
  }
});


const products = ref([]);

const search = ref("");

const selectedCategory = ref("All Products");

const sortOption = ref("default");

const expandedProduct = ref(null);

const loading = ref(true);

const errorMessage = ref("");

const message = ref("");

const showCategories = ref(false);

const basketCount = ref(
  Number(localStorage.getItem("basketCount") || 0)
);


const categories = [
  "All Products",
  "Staples",
  "Cooking Essentials",
  "Food",
  "Canned Food",
  "Spices",
  "Breakfast",
  "Beverages"
];


function getCategoryIcon(category) {

  const icons = {
    "All Products": "🛍️",
    "Staples": "🌾",
    "Cooking Essentials": "🍳",
    "Food": "🍎",
    "Canned Food": "🥫",
    "Spices": "🌶️",
    "Breakfast": "🥣",
    "Beverages": "☕"
  };

  return icons[category] || "🛍️";
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

  if (!product.image_url) {

    return getFallbackImage(product);

  }


  if (product.image_url.startsWith("http")) {

    return product.image_url;

  }


  if (product.image_url.startsWith("/")) {

    return product.image_url;

  }


  return `/${product.image_url}`;

}


function getFallbackImage(product) {

  const name =
    product.product_name.toLowerCase();


  if (name.includes("rice")) {

    return "https://ibb.co/x8KP6fPj";

  }


  if (
    name.includes("oil")
  
  ) {

    return "https://ibb.co/LXFJKGV2";

  }


  if (
    name.includes("maize") ||
    name.includes("porridge")
  ) {

    return "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=700&h=700&fit=crop";

  }

}




function getLowestPrice(product) {

  if (
    !product.supplier_prices ||
    !product.supplier_prices.length
  ) {

    return 0;

  }


  return Math.min(
    ...product.supplier_prices.map(
      supplier => Number(supplier.price)
    )
  );

}


function getHighestPrice(product) {

  if (
    !product.supplier_prices ||
    !product.supplier_prices.length
  ) {

    return 0;

  }


  return Math.max(
    ...product.supplier_prices.map(
      supplier => Number(supplier.price)
    )
  );

}


function getSaving(product) {

  if (
    !product.supplier_prices ||
    product.supplier_prices.length < 2
  ) {

    return 0;

  }


  return (
    getHighestPrice(product) -
    getLowestPrice(product)
  );

}


function getCheapestSupplier(product) {

  if (
    !product.supplier_prices ||
    !product.supplier_prices.length
  ) {

    return "";

  }


  const cheapest =
    product.supplier_prices.reduce(
      (lowest, supplier) => {

        return Number(supplier.price) <
          Number(lowest.price)
          ? supplier
          : lowest;

      }
    );


  return cheapest.supplier_name;

}


function toggleProduct(id) {

  if (expandedProduct.value === id) {

    expandedProduct.value = null;

  } else {

    expandedProduct.value = id;

  }

}


const filteredProducts = computed(() => {

  let result = products.value.filter(product => {

    const matchesSearch =
      product.product_name
        .toLowerCase()
        .includes(search.value.toLowerCase());

    const matchesCategory =
      selectedCategory.value === "All Products" ||
      product.category === selectedCategory.value;

    return matchesSearch && matchesCategory;

  });


  if (sortOption.value === "price-low") {

    result.sort(
      (a, b) =>
        getLowestPrice(a) -
        getLowestPrice(b)
    );

  }


  if (sortOption.value === "price-high") {

    result.sort(
      (a, b) =>
        getLowestPrice(b) -
        getLowestPrice(a)
    );

  }


  if (sortOption.value === "name") {

    result.sort(
      (a, b) =>
        a.product_name.localeCompare(
          b.product_name
        )
    );

  }


  return result;

});


function addToBasket(product) {

  basketCount.value++;

  localStorage.setItem(
    "basketCount",
    basketCount.value
  );


  window.dispatchEvent(
    new CustomEvent(
      "basket-updated",
      {
        detail: basketCount.value
      }
    )
  );


  message.value =
    `${product.product_name} added to your group basket 🤝`;


  setTimeout(() => {

    message.value = "";

  }, 2500);

}


async function loadProducts() {

  try {

    loading.value = true;

    errorMessage.value = "";

    products.value =
      await getProducts();

  } catch (error) {

    console.error(error);

    errorMessage.value =
      "Please make sure your StockWell backend is running.";

  } finally {

    loading.value = false;

  }

}


onMounted(loadProducts);

</script>


<style scoped>

.catalogue-page {

  --bg: #f5f1e8;
  --card: #ffffff;
  --text: #211a2d;
  --muted: #756c80;
  --gold: #c8b019;
  --purple: #795d89;
  --terra: #c2583d;
  --line: #ddd5e3;

  min-height: 100vh;

  background: var(--bg);

  color: var(--text);

  font-family: "Space Grotesk", sans-serif;

}


.catalogue-page.dark {

  --bg: #130e23;
  --card: #211a31;
  --text: #f4eff8;
  --muted: #aaa0b7;
  --line: rgba(255,255,255,0.12);

}


/* INTRO */

.catalogue-hero {

  max-width: 1200px;

  margin: auto;

  padding: 55px 30px 35px;

  display: flex;

  justify-content: space-between;

  align-items: end;

  gap: 30px;

}


.eyebrow {

  color: var(--purple);

  font-family: "DM Mono", monospace;

  font-size: 10px;

  letter-spacing: 1.5px;

}


.catalogue-hero h1 {

  font-size: clamp(40px, 6vw, 65px);

  line-height: .95;

  letter-spacing: -3px;

  margin: 12px 0;

}


.catalogue-hero h1 span {

  color: var(--purple);

}


.catalogue-hero p {

  max-width: 520px;

  color: var(--muted);

  font-size: 13px;

  line-height: 1.6;

}


.basket-summary {

  min-width: 190px;

  padding: 20px;

  background: var(--card);

  border: 1px solid var(--line);

  border-radius: 16px;

}


.basket-summary span {

  display: block;

  font-family: "DM Mono", monospace;

  font-size: 9px;

  color: var(--muted);

}


.basket-summary strong {

  display: inline-block;

  font-size: 35px;

  margin: 6px 5px 0 0;

}


.basket-summary small {

  color: var(--muted);

  font-size: 10px;

}


.basket-summary a {

  display: block;

  margin-top: 12px;

  color: var(--purple);

  font-size: 11px;

  font-weight: 700;

  text-decoration: none;

}


/* TOOLBAR */

.shop-toolbar {

  max-width: 1200px;

  margin: auto;

  padding: 0 30px 20px;

  display: grid;

  grid-template-columns: auto 1fr auto;

  gap: 10px;

}


.category-button {

  display: flex;

  align-items: center;

  gap: 10px;

  border: 1px solid var(--line);

  background: var(--card);

  color: var(--text);

  border-radius: 11px;

  padding: 12px 16px;

  cursor: pointer;

  font-size: 12px;

  font-weight: 700;

}


.category-button span {

  color: var(--purple);

}


.category-button b {

  margin-left: 8px;

  color: var(--gold);

}


.search-box {

  display: flex;

  align-items: center;

  gap: 10px;

  background: var(--card);

  border: 1px solid var(--line);

  border-radius: 11px;

  padding: 0 13px;

}


.search-box span {

  color: var(--purple);

  font-size: 18px;

}


.search-box input {

  width: 100%;

  border: none;

  outline: none;

  background: transparent;

  color: var(--text);

  padding: 12px 0;

  font-family: "Space Grotesk";

  font-size: 12px;

}


.shop-toolbar select {

  border: 1px solid var(--line);

  background: var(--card);

  color: var(--text);

  border-radius: 11px;

  padding: 0 12px;

  font-family: "Space Grotesk";

  font-size: 11px;

}


/* CATEGORY PANEL */

.category-panel {

  max-width: 1140px;

  margin: 0 auto 20px;

  padding: 20px;

  background: var(--card);

  border: 1px solid var(--line);

  border-radius: 16px;

}


.category-title {

  margin-bottom: 15px;

}


.category-title span {

  display: block;

  font-family: "DM Mono", monospace;

  font-size: 10px;

  color: var(--purple);

  letter-spacing: 1px;

}


.category-title small {

  display: block;

  margin-top: 4px;

  color: var(--muted);

  font-size: 10px;

}


.category-list {

  display: flex;

  flex-wrap: wrap;

  gap: 8px;

}


.category-list button {

  display: flex;

  align-items: center;

  gap: 7px;

  background: var(--bg);

  color: var(--text);

  border: 1px solid var(--line);

  border-radius: 10px;

  padding: 9px 13px;

  cursor: pointer;

  font-size: 11px;

}


.category-list button.active {

  background: var(--gold);

  border-color: var(--gold);

  color: #211a2d;

  font-weight: 700;

}


.category-icon {

  font-size: 15px;

}


.category-slide-enter-active,
.category-slide-leave-active {

  transition: all .2s ease;

}


.category-slide-enter-from,
.category-slide-leave-to {

  opacity: 0;

  transform: translateY(-8px);

}


/* FILTER */

.active-filter {

  max-width: 1140px;

  margin: 0 auto 20px;

  padding: 8px 12px;

  font-family: "DM Mono", monospace;

  font-size: 10px;

  color: var(--muted);

}


.active-filter strong {

  color: var(--purple);

}


.active-filter button {

  margin-left: 8px;

  border: none;

  background: transparent;

  color: var(--terra);

  cursor: pointer;

  font-size: 15px;

}


/* PRODUCTS */

.products-area {

  max-width: 1200px;

  margin: auto;

  padding: 0 30px 70px;

}


.product-grid {

  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 18px;

}


.product-card {

  position: relative;

  overflow: hidden;

  background: var(--card);

  border: 1px solid var(--line);

  border-radius: 17px;

  transition: transform .2s ease, box-shadow .2s ease;

}


.product-card:hover {

  transform: translateY(-5px);

  box-shadow: 0 18px 40px rgba(50, 35, 70, .12);

}


/* PRODUCT IMAGE */

.product-image {

  position: relative;

  height: 230px;

  display: grid;

  place-items: center;

  background: #f8f5ef;

  padding: 20px;

}


.product-image img {

  width: 85%;

  height: 85%;

  object-fit: contain;

  transition: transform .2s ease;

}


.product-card:hover .product-image img {

  transform: scale(1.05);

}


.deal-badge,
.bulk-badge {

  position: absolute;

  top: 12px;

  z-index: 2;

  padding: 6px 8px;

  border-radius: 7px;

  font-family: "DM Mono", monospace;

  font-size: 8px;

  font-weight: 700;

}


.deal-badge {

  left: 12px;

  background: var(--gold);

  color: #211a2d;

}


.bulk-badge {

  right: 12px;

  background: #211a2d;

  color: white;

}


/* INFO */

.product-info {

  padding: 18px;

}


.category-label {

  color: var(--purple);

  font-family: "DM Mono", monospace;

  font-size: 9px;

  text-transform: uppercase;

}


.product-info h2 {

  font-size: 15px;

  margin: 7px 0;

}


.description {

  color: var(--muted);

  font-size: 10px;

  line-height: 1.5;

  min-height: 31px;

}


/* PRICE */

.price-row {

  display: flex;

  align-items: end;

  justify-content: space-between;

  margin-top: 14px;

}


.price-row small {

  display: block;

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 8px;

}


.price-row strong {

  display: block;

  font-size: 21px;

  margin-top: 3px;

}


.saving {

  background: rgba(34, 197, 94, .12);

  color: #168348;

  padding: 5px 7px;

  border-radius: 6px;

  font-size: 9px;

  font-weight: 700;

}


/* SUPPLIER */

.best-supplier {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-top: 14px;

  padding: 10px;

  background: var(--bg);

  border-radius: 9px;

}


.best-supplier span {

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 8px;

}


.best-supplier strong {

  color: var(--purple);

  font-size: 10px;

}


/* STOCK */

.stock-row {

  display: flex;

  justify-content: space-between;

  margin: 13px 0;

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 8px;

}


.in-stock {

  color: #168348;

  font-weight: 700;

}


.low-stock {

  color: #d53f35;

  font-weight: 700;

}


/* COMPARE */

.compare-button {

  width: 100%;

  padding: 9px;

  border: 1px solid var(--line);

  background: transparent;

  color: var(--text);

  border-radius: 9px;

  cursor: pointer;

  font-size: 10px;

}


.compare-button span {

  float: right;

  color: var(--gold);

}


/* SUPPLIERS */

.supplier-list {

  margin-top: 7px;

  border: 1px solid var(--line);

  border-radius: 9px;

  overflow: hidden;

}


.supplier-row {

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 9px;

  border-bottom: 1px solid var(--line);

}


.supplier-row:last-child {

  border-bottom: none;

}


.supplier-row.cheapest {

  background: rgba(200,176,25,.13);

}


.supplier-row strong {

  display: block;

  font-size: 10px;

}


.supplier-row small {

  color: var(--muted);

  font-family: "DM Mono", monospace;

  font-size: 8px;

}


.supplier-row > span {

  font-weight: 700;

  font-size: 10px;

}


/* ADD BUTTON */

.add-button {

  width: 100%;

  margin-top: 10px;

  padding: 12px;

  border: none;

  border-radius: 10px;

  background: #211a2d;

  color: white;

  cursor: pointer;

  font-size: 11px;

  font-weight: 700;

  transition: .2s;

}


.add-button span {

  color: var(--gold);

  margin-right: 5px;

  font-size: 15px;

}


.add-button:hover {

  background: var(--gold);

  color: #211a2d;

}


/* TOAST */

.toast {

  position: fixed;

  right: 20px;

  top: 90px;

  z-index: 100;

  padding: 13px 17px;

  background: #211a2d;

  color: white;

  border-left: 4px solid var(--gold);

  border-radius: 8px;

  font-size: 11px;

  box-shadow: 0 10px 30px rgba(0,0,0,.2);

}


/* STATES */

.state {

  padding: 70px;

  text-align: center;

  color: var(--muted);

}


.loader {

  width: 30px;

  height: 30px;

  margin: auto;

  border: 3px solid var(--line);

  border-top-color: var(--gold);

  border-radius: 50%;

  animation: spin .8s linear infinite;

}


@keyframes spin {

  to {
    transform: rotate(360deg);
  }

}


.empty-state {

  padding: 70px 20px;

  text-align: center;

}


.empty-state > div {

  font-size: 45px;

}


.empty-state h2 {

  margin-bottom: 5px;

}


.empty-state p {

  color: var(--muted);

  font-size: 12px;

}


.empty-state button {

  margin-top: 10px;

  padding: 10px 15px;

  background: var(--gold);

  border: none;

  border-radius: 9px;

  cursor: pointer;

  font-weight: 700;

}


/* RESPONSIVE */

@media (max-width: 950px) {

  .product-grid {

    grid-template-columns: repeat(2, 1fr);

  }

}


@media (max-width: 750px) {

  .catalogue-hero {

    flex-direction: column;

    align-items: flex-start;

  }

  .shop-toolbar {

    grid-template-columns: 1fr;

  }

  .shop-toolbar select {

    padding: 12px;

  }

}


@media (max-width: 600px) {

  .product-grid {

    grid-template-columns: 1fr;

  }

  .catalogue-hero {

    padding: 40px 20px 25px;

  }

  .shop-toolbar,
  .products-area {

    padding-left: 20px;
    padding-right: 20px;

  }

  .product-image {

    height: 260px;

  }

}

</style>