<template>
  <div class="admin-page" :class="theme">

    <!-- HEADER -->
    <section class="admin-header">
      <div>
        <span class="page-label">
          STOCKWELL ADMIN
        </span>

        <h1>
          Control centre.
        </h1>

        <p>
          Manage your products, supplier prices and orders.
        </p>
      </div>

      <div class="admin-status">
        <span class="status-dot"></span>
        System active
      </div>
    </section>


    <!-- MESSAGE -->
    <div
      v-if="message"
      class="message"
    >
      {{ message }}
    </div>


    <!-- STATS -->
    <section class="stats-grid">

      <div class="stat-card">
        <span>PRODUCTS</span>

        <strong>
          {{ stats.products }}
        </strong>

        <small>
          Items in catalogue
        </small>
      </div>


      <div class="stat-card purple">
        <span>SUPPLIERS</span>

        <strong>
          {{ stats.suppliers }}
        </strong>

        <small>
          Price sources
        </small>
      </div>


      <div class="stat-card brown">
        <span>STOKVEL GROUPS</span>

        <strong>
          {{ stats.groups }}
        </strong>

        <small>
          Active groups
        </small>
      </div>


      <div class="stat-card gold">
        <span>ORDERS</span>

        <strong>
          {{ stats.orders }}
        </strong>

        <small>
          Current orders
        </small>
      </div>

    </section>


    <!-- ADD PRODUCT -->
    <section class="admin-section">

      <div class="section-heading">
        <span>
          PRODUCT MANAGEMENT
        </span>

        <h2>
          Add a new product
        </h2>
      </div>


      <form
        class="form-grid"
        @submit.prevent="addProduct"
      >

        <div class="form-field">
          <label>
            Product name
          </label>

          <input
            v-model="newProduct.product_name"
            required
            placeholder="e.g. White Star Maize Meal"
          />
        </div>


        <div class="form-field">
          <label>
            Category
          </label>

          <select
            v-model="newProduct.category"
          >
            <option
              v-for="category in cats"
              :key="category"
            >
              {{ category }}
            </option>
          </select>
        </div>


        <div class="form-field">
          <label>
            Quantity
          </label>

          <input
            v-model.number="newProduct.quantity_available"
            type="number"
            min="0"
          />
        </div>


        <div class="form-field">
          <label>
            Image URL
          </label>

          <input
            v-model="newProduct.image_url"
            placeholder="images/rice.jpg"
          />
        </div>


        <div class="form-field full">
          <label>
            Description
          </label>

          <textarea
            v-model="newProduct.description"
            placeholder="Add a short product description"
          ></textarea>
        </div>


        <div class="form-actions full">
          <button
            class="add-button"
            type="submit"
          >
            <span>+</span>
            Add Product
          </button>
        </div>

      </form>

    </section>


    <!-- PRODUCTS -->
    <section class="admin-section">

      <div class="section-heading">
        <span>
          CATALOGUE
        </span>

        <h2>
          Manage products
        </h2>
      </div>


      <div class="search-box">
        <input
          v-model="productSearch"
          type="text"
          placeholder="Search products..."
        />
      </div>


      <div class="management-list">

        <div
          v-for="product in filteredProducts"
          :key="product.product_id"
          class="management-card"
        >

          <!-- IMAGE -->
          <div class="item-image">
            <img
              :src="getProductImage(product)"
              :alt="product.product_name"
              @error="handleImageError"
            />
          </div>


          <!-- PRODUCT DETAILS -->
          <div class="item-info">

            <span class="product-number">
              #{{ product.product_id }}
            </span>

            <input
              v-model="product.product_name"
              class="edit-input title"
            />

            <input
              v-model="product.category"
              class="edit-input"
            />

          </div>


          <!-- STOCK -->
          <div class="quantity-control">

            <label>
              STOCK
            </label>

            <input
              v-model.number="product.quantity_available"
              type="number"
              min="0"
            />

          </div>


          <!-- ACTIONS -->
          <div class="item-actions">

            <button
              class="update-button"
              @click="updateProductDetails(product)"
            >
              <span>✓</span>
              Save
            </button>

            <button
              class="delete-button"
              @click="removeProduct(product)"
            >
              <span>×</span>
              Delete
            </button>

          </div>

        </div>

      </div>

    </section>


    <!-- SUPPLIER PRICES -->
    <section class="admin-section">

      <div class="section-heading">

        <span>
          SUPPLIER PRICES
        </span>

        <h2>
          Compare supplier prices
        </h2>

      </div>


      <!-- ADD SUPPLIER -->
      <form
        class="supplier-form"
        @submit.prevent="addSupplier"
      >

        <div class="form-field">

          <label>
            Product
          </label>

          <select
            v-model.number="newSupplierPrice.product_id"
            required
          >

            <option
              v-for="product in products"
              :key="product.product_id"
              :value="product.product_id"
            >
              {{ product.product_name }}
            </option>

          </select>

        </div>


        <div class="form-field">

          <label>
            Supplier
          </label>

          <input
            v-model="newSupplierPrice.supplier_name"
            required
            placeholder="Makro / Boxer / Local Wholesaler"
          />

        </div>


        <div class="form-field">

          <label>
            Price
          </label>

          <input
            v-model.number="newSupplierPrice.price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
          />

        </div>


        <div class="form-field">

          <label>
            Minimum quantity
          </label>

          <input
            v-model.number="newSupplierPrice.minimum_quantity"
            type="number"
            min="10"
          />

        </div>


        <button
          class="add-button supplier-add"
          type="submit"
        >
          <span>+</span>
          Add Price
        </button>

      </form>


      <!-- SUPPLIER LIST -->
      <div class="search-box">

        <input
          v-model="supplierSearch"
          type="text"
          placeholder="Search suppliers..."
        />

      </div>


      <div class="supplier-management">

        <div
          v-for="price in filteredSuppliers"
          :key="price.supplier_price_id"
          class="supplier-card"
        >

          <div class="supplier-product">

            <small>
              PRODUCT #{{ price.product_id }}
            </small>

            <input
              v-model="price.supplier_name"
              class="edit-input"
            />

          </div>


          <div class="supplier-field">

            <label>
              PRICE
            </label>

            <div class="price-box">

              <span>R</span>

              <input
                v-model.number="price.price"
                type="number"
                step="0.01"
              />

            </div>

          </div>


          <div class="supplier-field">

            <label>
              MIN QTY
            </label>

            <input
              v-model.number="price.minimum_quantity"
              class="price-input"
              type="number"
              min="10"
            />

          </div>


          <div class="supplier-actions">

            <button
              class="update-button"
              @click="updateSupplier(price)"
            >
              ✓ Save
            </button>

            <button
              class="delete-button"
              @click="removeSupplier(price)"
            >
              × Delete
            </button>

          </div>

        </div>

      </div>

    </section>


    <!-- ORDERS -->
    <section class="admin-section">

      <div class="section-heading">

        <span>
          ORDER MANAGEMENT
        </span>

        <h2>
          Recent orders
        </h2>

      </div>

      <div
        v-if="orders.length"
        class="orders-list"
      >

        <div
          v-for="order in orders"
          :key="order.order_id || order.id"
          class="order-row"
        >

          <div>

            <span class="order-number">
              Order #{{ order.order_id || order.id }}
            </span>

          </div>

          <span class="order-status">
            {{ order.status || "Pending" }}
          </span>

        </div>

      </div>


      <div
        v-else
        class="empty-state"
      >

        <div class="empty-icon">
          📦
        </div>

        <strong>
          No orders yet
        </strong>

        <p>
          Orders from stokvel groups will appear here.
        </p>

      </div>

    </section>

  </div>
</template>


<script setup>

import {
  computed,
  onMounted,
  ref
} from "vue";

import {
  createProduct,
  createSupplierPrice,
  deleteProduct,
  deleteSupplierPrice,
  getAdminDashboard,
  getOrders,
  getProducts,
  getSupplierPrices,
  updateProduct,
  updateSupplierPrice
} from "../services/api.js";

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






defineProps({
  theme: {
    type: String,
    default: "light"
  }
});


/* =========================
   DATA
========================= */

const products = ref([]);

const supplierPrices = ref([]);

const orders = ref([]);

const message = ref("");

const dashboardGroups = ref(0);


/* =========================
   SEARCH
========================= */

const productSearch = ref("");

const supplierSearch = ref("");


/* =========================
   FILTERED PRODUCTS
========================= */

const filteredProducts = computed(() => {

  const search = productSearch.value
    .toLowerCase()
    .trim();

  return products.value.filter((product) => {

    return (
      product.product_name
        ?.toLowerCase()
        .includes(search)

      ||

      product.category
        ?.toLowerCase()
        .includes(search)
    );

  });

});




function getProductImage(product) {
  const name = product.product_name.toLowerCase();

  if (name.includes("white star")) {
    return whiteStar;
  }

  if (name.includes("tastic rice")) {
    return rice;
  }

  if (name.includes("sunfoil")) {
    return sunfoil;
  }

  if (name.includes("iwisa")) {
    return maizeMeal;
  }

  if (name.includes("all gold")) {
    return tomatoSauce;
  }

  if (name.includes("koo")) {
    return beans;
  }

  if (name.includes("pakco")) {
    return curryPowder;
  }

  if (name.includes("ace")) {
    return instant;
  }

  if (name.includes("crosse")) {
    return mayonnaise;
  }

  if (name.includes("huletts")) {
    return hulets;
  }

  if (name.includes("ricoffy")) {
    return ricoffy;
  }

  if (name.includes("kellogg")) {
    return cornflakes;
  }

  return "";
}
/* =========================
   FILTERED SUPPLIERS
========================= */

const filteredSuppliers = computed(() => {

  const search = supplierSearch.value
    .toLowerCase()
    .trim();

  return supplierPrices.value.filter((price) => {

    return (
      price.supplier_name
        ?.toLowerCase()
        .includes(search)

      ||

      String(price.product_id)
        .includes(search)
    );

  });

});


/* =========================
   UNIQUE SUPPLIERS
========================= */

const uniqueSuppliers = computed(() => {

  const supplierNames = supplierPrices.value
    .map((price) => price.supplier_name)
    .filter(Boolean);

  return [
    ...new Set(supplierNames)
  ];

});


/* =========================
   STATS
========================= */

const stats = computed(() => {

  return {
    products: products.value.length,

    suppliers: uniqueSuppliers.value.length,

    groups: dashboardGroups.value,

    orders: orders.value.length
  };

});


/* =========================
   CATEGORIES
========================= */

const cats = [
  "Staples",
  "Cooking Essentials",
  "Food",
  "Canned Food",
  "Spices",
  "Breakfast",
  "Beverages"
];


/* =========================
   NEW PRODUCT
========================= */

const newProduct = ref({

  product_name: "",

  description: "",

  category: "Staples",

  image_url: "",

  quantity_available: 0

});


/* =========================
   NEW SUPPLIER PRICE
========================= */

const newSupplierPrice = ref({

  product_id: 1,

  supplier_name: "",

  price: 0,

  minimum_quantity: 10

});


/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

  try {

    /*
      Products and supplier prices are loaded
      separately so that one failed dashboard
      endpoint does not stop the rest of the
      Admin page from loading.
    */

    products.value = await getProducts();

    supplierPrices.value =
      await getSupplierPrices();


    /*
      Load admin statistics.
    */

    try {

      const dashboard =
        await getAdminDashboard();

      dashboardGroups.value =
        Number(dashboard.groups) || 0;

    } catch (error) {

      console.warn(
        "Admin dashboard statistics unavailable:",
        error
      );

      dashboardGroups.value = 0;

    }


    /*
      Load orders separately.
    */

    try {

      orders.value =
        await getOrders();

    } catch (error) {

      console.warn(
        "Orders could not be loaded:",
        error
      );

      orders.value = [];

    }


    /*
      Select the first product for the
      Add Supplier Price form.
    */

    if (products.value.length) {

      newSupplierPrice.value.product_id =
        products.value[0].product_id;

    }

    message.value = "";

  } catch (error) {

    console.error(error);

    message.value =
      "Could not connect to the StockWell backend.";

  }

}


/* =========================
   ADD PRODUCT
========================= */

async function addProduct() {

  try {

    await createProduct(
      newProduct.value
    );


    message.value =
      "Product added successfully.";


    newProduct.value = {

      product_name: "",

      description: "",

      category: "Staples",

      image_url: "",

      quantity_available: 0

    };


    await loadDashboard();

  } catch (error) {

    console.error(error);

    message.value =
      "Could not add product.";

  }

}


/* =========================
   UPDATE PRODUCT
========================= */

async function updateProductDetails(product) {

  try {

    await updateProduct(

      product.product_id,

      {

        product_name:
          product.product_name,

        category:
          product.category,

        quantity_available:
          product.quantity_available

      }

    );


    message.value =
      "Product updated successfully.";


    await loadDashboard();

  } catch (error) {

    console.error(error);

    message.value =
      "Could not update product.";

  }

}


/* =========================
   DELETE PRODUCT
========================= */

async function removeProduct(product) {

  if (
    !confirm(
      `Delete ${product.product_name}?`
    )
  ) {

    return;

  }


  try {

    await deleteProduct(
      product.product_id
    );


    message.value =
      "Product deleted successfully.";


    await loadDashboard();

  } catch (error) {

    console.error(error);

    message.value =
      "Could not delete product.";

  }

}


/* =========================
   ADD SUPPLIER
========================= */

async function addSupplier() {

  try {

    await createSupplierPrice(
      newSupplierPrice.value
    );


    message.value =
      "Supplier price added successfully.";


    newSupplierPrice.value = {

      product_id:
        products.value[0]?.product_id || 1,

      supplier_name: "",

      price: 0,

      minimum_quantity: 10

    };


    await loadDashboard();

  } catch (error) {

    console.error(error);

    message.value =
      "Could not add supplier price.";

  }

}


/* =========================
   UPDATE SUPPLIER
========================= */

async function updateSupplier(price) {

  try {

    await updateSupplierPrice(

      price.supplier_price_id,

      {

        supplier_name:
          price.supplier_name,

        price:
          price.price,

        minimum_quantity:
          price.minimum_quantity

      }

    );


    message.value =
      "Supplier price updated successfully.";


    await loadDashboard();

  } catch (error) {

    console.error(error);

    message.value =
      "Could not update supplier price.";

  }

}


/* =========================
   DELETE SUPPLIER
========================= */

async function removeSupplier(price) {

  if (
    !confirm(
      `Delete ${price.supplier_name}?`
    )
  ) {

    return;

  }


  try {

    await deleteSupplierPrice(
      price.supplier_price_id
    );


    message.value =
      "Supplier price deleted successfully.";


    await loadDashboard();

  } catch (error) {

    console.error(error);

    message.value =
      "Could not delete supplier price.";

  }

}


/* =========================
   IMAGE ERROR
========================= */

function handleImageError(event) {

  event.target.src =
    "/images/product-placeholder.jpg";

}


onMounted(loadDashboard);

</script>


<style scoped>

/* =========================
   PAGE
========================= */

.admin-page {

  --bg: #EDE7F6;

  --card: #FFFFFF;

  --text: #130E23;

  --muted: #716980;

  --gold: #C8B019;

  --purple: #795D89;

  --brown: #C2583D;

  --line: #DED8E8;

  min-height: 100vh;

  background: var(--bg);

  color: var(--text);

  padding-bottom: 60px;

  font-family:
    "Space Grotesk",
    sans-serif;

}


/* =========================
   DARK MODE
========================= */

.admin-page.dark {

  --bg: #130E23;

  --card: #211A32;

  --text: #F4EFF8;

  --muted: #AAA1B8;

  --line: rgba(255,255,255,0.1);

}


/* =========================
   HEADER
========================= */

.admin-header {

  max-width: 1400px;

  margin: auto;

  padding: 50px 40px 35px;

  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 30px;

}


.page-label {

  display: block;

  margin-bottom: 12px;

  color: var(--purple);

  font-family:
    "DM Mono",
    monospace;

  font-size: 10px;

  letter-spacing: 2px;

}


.admin-header h1 {

  margin: 0;

  font-size: 44px;

  line-height: 1;

  letter-spacing: -1.5px;

}


.admin-header p {

  margin: 12px 0 0;

  color: var(--muted);

  font-size: 14px;

}


.admin-status {

  display: flex;

  align-items: center;

  gap: 8px;

  padding: 9px 15px;

  border: 1px solid var(--line);

  border-radius: 30px;

  background: var(--card);

  font-family:
    "DM Mono",
    monospace;

  font-size: 10px;

}


.status-dot {

  width: 8px;

  height: 8px;

  border-radius: 50%;

  background: #22c55e;

}


/* =========================
   MESSAGE
========================= */

.message {

  max-width: 1400px;

  margin: 0 auto 15px;

  padding: 12px 16px;

  border-left: 4px solid var(--gold);

  border-radius: 8px;

  background:
    rgba(200,176,25,0.12);

  font-size: 12px;

}


/* =========================
   STATS
========================= */

.stats-grid {

  max-width: 1400px;

  margin: auto;

  padding: 0 40px;

  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 15px;

}


.stat-card {

  padding: 22px;

  border: 1px solid var(--line);

  border-radius: 16px;

  background: var(--card);

}


.stat-card.purple {

  background: var(--purple);

  color: white;

  border-color: transparent;

}


.stat-card.brown {

  background: var(--brown);

  color: white;

  border-color: transparent;

}


.stat-card.gold {

  background: var(--gold);

  color: #130E23;

  border-color: transparent;

}


.stat-card span {

  font-family:
    "DM Mono",
    monospace;

  font-size: 9px;

  opacity: 0.7;

}


.stat-card strong {

  display: block;

  margin: 10px 0 5px;

  font-size: 28px;

}


.stat-card small {

  font-size: 11px;

  opacity: 0.65;

}


/* =========================
   SECTIONS
========================= */

.admin-section {

  max-width: 1400px;

  margin: 18px auto 0;

  padding: 25px 40px;

}


.section-heading {

  margin-bottom: 18px;

}


.section-heading span {

  color: var(--purple);

  font-family:
    "DM Mono",
    monospace;

  font-size: 10px;

  letter-spacing: 1.5px;

}


.section-heading h2 {

  margin: 6px 0 0;

  font-size: 22px;

}


/* =========================
   SEARCH
========================= */

.search-box {

  margin-bottom: 14px;

}


.search-box input {

  width: 100%;

  box-sizing: border-box;

  padding: 11px 12px;

  border: 1px solid var(--line);

  border-radius: 9px;

  outline: none;

  background: var(--card);

  color: var(--text);

  font-family:
    "Space Grotesk",
    sans-serif;

  font-size: 12px;

}


/* =========================
   FORMS
========================= */

.form-grid {

  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 14px;

  padding: 22px;

  border: 1px solid var(--line);

  border-radius: 16px;

  background: var(--card);

}


.form-field {

  display: flex;

  flex-direction: column;

  gap: 7px;

}


.form-field.full {

  grid-column: 1 / -1;

}


.form-field label {

  color: var(--muted);

  font-family:
    "DM Mono",
    monospace;

  font-size: 9px;

}


.form-field input,

.form-field select,

.form-field textarea {

  width: 100%;

  box-sizing: border-box;

  padding: 11px 12px;

  border: 1px solid var(--line);

  border-radius: 9px;

  outline: none;

  background: var(--bg);

  color: var(--text);

  font-family:
    "Space Grotesk",
    sans-serif;

  font-size: 12px;

}


.form-field textarea {

  min-height: 80px;

  resize: vertical;

}


/* =========================
   ADD BUTTON
========================= */

.form-actions {

  display: flex;

  align-items: center;

}


.add-button {

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  padding: 12px 18px;

  border: none;

  border-radius: 10px;

  background: var(--gold);

  color: #130E23;

  font-family:
    "Space Grotesk",
    sans-serif;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.25s ease;

}


.add-button:hover {

  transform: translateY(-2px);

}


.add-button span {

  font-size: 18px;

}


/* =========================
   PRODUCTS
========================= */

.management-list {

  display: flex;

  flex-direction: column;

  gap: 10px;

}


.management-card {

  display: grid;

  grid-template-columns:
    70px 1fr 110px auto;

  align-items: center;

  gap: 18px;

  padding: 14px;

  border: 1px solid var(--line);

  border-radius: 14px;

  background: var(--card);

}


.item-image {

  width: 65px;

  height: 65px;

  overflow: hidden;

  border-radius: 10px;

  background: white;

}


.item-image img {

  width: 100%;

  height: 100%;

  object-fit: contain;

}


.product-number {

  display: block;

  margin-bottom: 5px;

  color: var(--muted);

  font-family:
    "DM Mono",
    monospace;

  font-size: 9px;

}


.edit-input {

  width: 100%;

  box-sizing: border-box;

  margin-top: 4px;

  padding: 7px 9px;

  border: 1px solid var(--line);

  border-radius: 7px;

  outline: none;

  background: var(--bg);

  color: var(--text);

  font-family:
    "Space Grotesk",
    sans-serif;

  font-size: 11px;

}


.edit-input.title {

  font-size: 13px;

  font-weight: 700;

}


/* =========================
   STOCK
========================= */

.quantity-control {

  display: flex;

  flex-direction: column;

  gap: 6px;

}


.quantity-control label,

.supplier-field label {

  color: var(--muted);

  font-family:
    "DM Mono",
    monospace;

  font-size: 9px;

}


.quantity-control input,

.price-input {

  width: 100%;

  box-sizing: border-box;

  padding: 8px;

  border: 1px solid var(--line);

  border-radius: 7px;

  outline: none;

  background: var(--bg);

  color: var(--text);

}


/* =========================
   ACTION BUTTONS
========================= */

.item-actions,

.supplier-actions {

  display: flex;

  align-items: center;

  gap: 7px;

}


.update-button,

.delete-button {

  display: flex;

  align-items: center;

  gap: 5px;

  padding: 9px 12px;

  border: none;

  border-radius: 8px;

  font-family:
    "Space Grotesk",
    sans-serif;

  font-size: 10px;

  font-weight: 600;

  cursor: pointer;

  transition: 0.2s ease;

}


.update-button {

  background:
    rgba(34,197,94,0.12);

  color: #16a34a;

}


.delete-button {

  background:
    rgba(239,68,68,0.1);

  color: #dc2626;

}


.update-button:hover,

.delete-button:hover {

  transform: translateY(-2px);

}


/* =========================
   SUPPLIER FORM
========================= */

.supplier-form {

  display: grid;

  grid-template-columns:
    1.4fr 1fr 0.7fr 0.7fr auto;

  gap: 12px;

  align-items: end;

  padding: 22px;

  border: 1px solid var(--line);

  border-radius: 16px;

  background: var(--card);

}


.supplier-add {

  height: 39px;

}


/* =========================
   SUPPLIER LIST
========================= */

.supplier-management {

  display: flex;

  flex-direction: column;

  gap: 9px;

  margin-top: 14px;

}


.supplier-card {

  display: grid;

  grid-template-columns:
    1fr 120px 110px auto;

  align-items: center;

  gap: 15px;

  padding: 14px;

  border: 1px solid var(--line);

  border-radius: 12px;

  background: var(--card);

}


.supplier-product small {

  display: block;

  margin-bottom: 4px;

  color: var(--muted);

  font-family:
    "DM Mono",
    monospace;

  font-size: 8px;

}


.supplier-field {

  display: flex;

  flex-direction: column;

  gap: 6px;

}


.price-box {

  display: flex;

  align-items: center;

  gap: 5px;

}


.price-box input {

  width: 80px;

  padding: 8px;

  border: 1px solid var(--line);

  border-radius: 7px;

  outline: none;

  background: var(--bg);

  color: var(--text);

}


/* =========================
   ORDERS
========================= */

.orders-list {

  display: flex;

  flex-direction: column;

  gap: 8px;

}


.order-row {

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 15px;

  border: 1px solid var(--line);

  border-radius: 12px;

  background: var(--card);

}


.order-number {

  font-size: 12px;

  font-weight: 600;

}


.order-status {

  padding: 6px 11px;

  border-radius: 20px;

  background:
    rgba(200,176,25,0.14);

  color: #927f00;

  font-family:
    "DM Mono",
    monospace;

  font-size: 9px;

}


/* =========================
   EMPTY STATE
========================= */

.empty-state {

  padding: 45px 20px;

  text-align: center;

  border: 1px dashed var(--line);

  border-radius: 14px;

  color: var(--muted);

}


.empty-icon {

  margin-bottom: 10px;

  font-size: 30px;

}


.empty-state strong {

  display: block;

  color: var(--text);

  font-size: 14px;

}


.empty-state p {

  margin: 6px 0 0;

  font-size: 11px;

}


/* =========================
   MOBILE
========================= */

@media (max-width: 1000px) {

  .stats-grid {

    grid-template-columns:
      repeat(2, 1fr);

  }


  .form-grid {

    grid-template-columns:
      repeat(2, 1fr);

  }


  .supplier-form {

    grid-template-columns:
      repeat(2, 1fr);

  }


  .supplier-add {

    width: 100%;

  }


  .management-card {

    grid-template-columns:
      65px 1fr;

  }


  .quantity-control {

    grid-column: 2;

  }


  .item-actions {

    grid-column: 2;

  }


  .supplier-card {

    grid-template-columns:
      1fr 1fr;

  }

}


@media (max-width: 650px) {

  .admin-header {

    padding: 35px 20px 25px;

    align-items: flex-start;

    flex-direction: column;

  }


  .admin-header h1 {

    font-size: 36px;

  }


  .stats-grid {

    padding: 0 20px;

    grid-template-columns: 1fr;

  }


  .admin-section {

    padding: 0 20px;

    margin-top: 25px;

  }


  .form-grid {

    grid-template-columns: 1fr;

    padding: 18px;

  }


  .supplier-form {

    grid-template-columns: 1fr;

    padding: 18px;

  }


  .management-card {

    grid-template-columns:
      55px 1fr;

  }


  .item-image {

    width: 55px;

    height: 55px;

  }


  .quantity-control,

  .item-actions {

    grid-column: 1 / -1;

  }


  .item-actions {

    width: 100%;

  }


  .update-button,

  .delete-button {

    flex: 1;

    justify-content: center;

  }


  .supplier-card {

    grid-template-columns: 1fr;

  }


  .supplier-actions {

    width: 100%;

  }


  .supplier-actions button {

    flex: 1;

    justify-content: center;

  }

}

</style>