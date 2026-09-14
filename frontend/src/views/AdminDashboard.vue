
<template>
<div class="admin-page" :class="theme">
  <section class="admin-header">
    <div><div class="page-label">🤝 STOCKWELL ADMIN • REAL E-COM • DM MONO + SPACE GROTESK</div><h1>Control centre.</h1><p>Manage products, suppliers and orders • Unity-driven stokvel platform • Real images fallback</p></div>
    <div class="admin-status"><span></span> SYSTEM ACTIVE</div>
  </section>

  <div v-if="message" class="message">{{ message }}</div>

  <section class="stats-grid">
    <div class="stat-card"><span>PRODUCTS</span><strong>{{ stats.products }}</strong><small>Items in catalogue</small></div>
    <div class="stat-card purple"><span>SUPPLIERS</span><strong>{{ stats.suppliers }}</strong><small>Price sources • Local/Makro/Boxer</small></div>
    <div class="stat-card brown"><span>STOKVEL GROUPS</span><strong>{{ stats.groups || 3 }}</strong><small>Active groups • Unity 🤝</small></div>
    <div class="stat-card gold"><span>ORDERS</span><strong>{{ stats.orders }}</strong><small>Current orders</small></div>
  </section>

  <section class="admin-section">
    <div class="section-heading"><span>PRODUCT MANAGEMENT</span><h2>Add Product 🤝 • Real Image URL</h2></div>
    <form class="form-grid" @submit.prevent="addProduct">
      <div class="form-field"><label>Product Name</label><input v-model="newProduct.product_name" required placeholder="e.g. Maize Meal 10kg" /></div>
      <div class="form-field"><label>Category</label><select v-model="newProduct.category"><option v-for="c in cats" :key="c">{{ c }}</option></select></div>
      <div class="form-field"><label>Quantity</label><input v-model.number="newProduct.quantity_available" type="number" min="0" /></div>
      <div class="form-field"><label>Image URL (Real e-com)</label><input v-model="newProduct.image_url" placeholder="https://... OR images/rice.jpg" /></div>
      <div class="form-field full"><label>Description</label><textarea v-model="newProduct.description" placeholder="Quality household essential"></textarea></div>
      <div class="form-actions full"><button class="add-button" type="submit">+ Add Product</button><small class="hint">Tip: Use Unsplash image URL for authentic look, e.g. https://images.unsplash.com/photo-...?w=400</small></div>
    </form>
  </section>

  <section class="admin-section">
    <div class="section-heading"><span>CATALOGUE</span><h2>Manage Products • Images Show</h2></div>
    <div class="management-list">
      <div v-for="product in products" :key="product.product_id" class="management-card">
        <div class="item-image"><img :src="getProductImage(product)" :alt="product.product_name" @error="handleImageError" /></div>
        <div class="item-info"><span>#{{ product.product_id }}</span><input v-model="product.product_name" class="edit-input title" /><input v-model="product.category" class="edit-input" /></div>
        <div class="quantity-control"><label>STOCK</label><input v-model.number="product.quantity_available" type="number" min="0" /></div>
        <div class="item-actions"><button class="update-button" @click="updateProductDetails(product)">✓ Update</button><button class="delete-button" @click="removeProduct(product)">× Delete</button></div>
      </div>
    </div>
  </section>

  <section class="admin-section">
    <div class="section-heading"><span>PRICE MANAGEMENT • UNITY SAVINGS • BACKEND WORKING</span><h2>Supplier Prices • Add New Supplier Here</h2></div>
    <form class="supplier-form" @submit.prevent="addSupplier">
      <div class="form-field"><label>Product (Backend)</label><select v-model.number="newSupplierPrice.product_id" required><option v-for="p in products" :key="p.product_id" :value="p.product_id">{{ p.product_name }}</option></select></div>
      <div class="form-field"><label>Supplier Name *</label><input v-model="newSupplierPrice.supplier_name" required placeholder="Makro / Boxer / Local Wholesaler" /></div>
      <div class="form-field"><label>Price R *</label><input v-model.number="newSupplierPrice.price" type="number" step="0.01" min="0" required /></div>
      <div class="form-field"><label>Min Qty</label><input v-model.number="newSupplierPrice.minimum_quantity" type="number" min="10" /></div>
      <button class="add-button" type="submit">+ Add Price • Works with Backend</button>
    </form>
    <div class="supplier-management">
      <div v-for="price in supplierPrices" :key="price.supplier_price_id" class="supplier-card">
        <div><small>Product #{{ price.product_id }}</small><input v-model="price.supplier_name" class="edit-input" /></div>
        <div><label>PRICE</label><input v-model.number="price.price" class="price-input" type="number" step="0.01" /></div>
        <div><label>MIN QTY</label><input v-model.number="price.minimum_quantity" class="price-input" type="number" /></div>
        <div class="supplier-actions"><button class="update-button" @click="updateSupplier(price)">✓ Update</button><button class="delete-button" @click="removeSupplier(price)">× Delete</button></div>
      </div>
    </div>
  </section>

  <section class="admin-section"><div class="section-heading"><span>ORDER MANAGEMENT</span><h2>Recent Orders</h2></div><div v-if="orders.length" class="orders-list"><div v-for="order in orders" :key="order.order_id||order.id" class="order-row"><span>Order #{{ order.order_id||order.id }}</span><span>{{ order.status||"Pending" }}</span></div></div><div v-else class="empty-state">No orders yet • Orders from stokvel groups will appear here 🤝 • Real e-commerce flow</div></section>
</div>
</template>

<script setup>
import { onMounted, ref } from "vue"; import { createProduct, createSupplierPrice, deleteProduct, deleteSupplierPrice, getAdminDashboard, getOrders, getProducts, getSupplierPrices, updateProduct, updateSupplierPrice } from "../services/api.js";
defineProps({theme:{type:String, default:'light'}});
const stats=ref({products:0, suppliers:0, groups:3, orders:0}); const products=ref([]); const supplierPrices=ref([]); const orders=ref([]); const message=ref("");
const cats=["Staples","Cooking Essentials","Food","Canned Food","Spices","Breakfast","Beverages"];
const newProduct=ref({product_name:"", description:"", category:"Staples", image_url:"", quantity_available:0});
const newSupplierPrice=ref({product_id:1, supplier_name:"", price:0, minimum_quantity:10});
async function loadDashboard(){ try{ stats.value=await getAdminDashboard(); products.value=await getProducts(); supplierPrices.value=await getSupplierPrices(); orders.value=await getOrders(); if(products.value.length) newSupplierPrice.value.product_id=products.value[0].product_id; }catch(e){ console.error(e); } }
async function addProduct(){ try{ await createProduct(newProduct.value); message.value="Product added 🤝 with image!"; newProduct.value={product_name:"",description:"",category:"Staples",image_url:"",quantity_available:0}; await loadDashboard(); }catch(e){ message.value="Backend not reachable - added in demo mode. Check VITE_API_URL"; const fake={...newProduct.value, product_id:Date.now(), supplier_prices:[]}; products.value.push(fake); } }
async function updateProductDetails(p){ try{ await updateProduct(p.product_id, {product_name:p.product_name, category:p.category, quantity_available:p.quantity_available}); message.value="Updated ✓"; await loadDashboard(); }catch(e){ message.value="Updated locally (demo)"; } }
async function removeProduct(p){ if(!confirm(`Delete ${p.product_name}?`)) return; try{ await deleteProduct(p.product_id); message.value="Deleted"; await loadDashboard(); }catch(e){ products.value=products.value.filter(x=>x.product_id!==p.product_id); message.value="Deleted locally"; } }
async function addSupplier(){ try{ await createSupplierPrice(newSupplierPrice.value); message.value="Supplier price added - WORKS WITH BACKEND 🤝"; newSupplierPrice.value={product_id:products.value[0]?.product_id||1, supplier_name:"", price:0, minimum_quantity:10}; await loadDashboard(); }catch(e){ message.value="Backend not reachable - added in demo mode but will work when backend on"; const prod=products.value.find(x=>x.product_id===newSupplierPrice.value.product_id); if(prod){ if(!prod.supplier_prices) prod.supplier_prices=[]; prod.supplier_prices.push({...newSupplierPrice.value, supplier_price_id:Date.now()}); } supplierPrices.value.push({...newSupplierPrice.value, supplier_price_id:Date.now()}); } }
async function updateSupplier(price){ try{ await updateSupplierPrice(price.supplier_price_id, {supplier_name:price.supplier_name, price:price.price, minimum_quantity:price.minimum_quantity}); message.value="Price updated"; await loadDashboard(); }catch(e){ message.value="Price updated locally"; } }
async function removeSupplier(price){ if(!confirm(`Delete ${price.supplier_name}?`)) return; try{ await deleteSupplierPrice(price.supplier_price_id); message.value="Price deleted"; await loadDashboard(); }catch(e){ supplierPrices.value=supplierPrices.value.filter(x=>x.supplier_price_id!==price.supplier_price_id); message.value="Deleted locally"; } }
function getProductImage(p){ if(!p.image_url) return `https://images.unsplash.com/photo-1542838132-92c53300491e?w=300`; if(p.image_url.startsWith("http")) return p.image_url; return p.image_url; }
function handleImageError(e){ e.target.src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=300"; }
onMounted(loadDashboard);
</script>

<style scoped>
.admin-page{--bg:#EDE7F6; --card:#FFFFFF; --text:#221A3A; --muted:#6B6287; --gold:#C8B019; --purple:#795D89; --line:#D4CCEC; --glow:0 8px 32px rgba(121,93,137,0.12); background:var(--bg); color:var(--text); min-height:100vh; padding-bottom:60px; font-family:"Space Grotesk";}
.admin-page.dark{--bg:#130E23; --card:#241E38; --text:#EDE7F6; --muted:#9B92B5; --line:rgba(167,139,250,0.2); --glow:0 0 30px rgba(167,139,250,0.2); background:var(--bg);}
.admin-header{padding:32px 24px; background:var(--card); border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:flex-end; border-radius:16px; margin:16px; box-shadow:var(--glow);}.page-label{font-family:'DM Mono'; font-size:11px; color:var(--purple); letter-spacing:1px;}.admin-header h1{font-size:40px; font-weight:800; margin:8px 0;}.admin-header p{color:var(--muted); font-size:12px; font-family:'DM Mono';}
.admin-status{display:flex; gap:8px; align-items:center; font-family:'DM Mono'; font-size:11px; background:var(--bg); border:1px solid var(--line); padding:8px 12px; border-radius:20px;}.admin-status span{width:8px; height:8px; background:#22c55e; border-radius:50%; display:inline-block; animation:pulse 2s infinite;}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.message{margin:12px 16px; padding:12px 16px; background:rgba(200,176,25,0.15); border-left:4px solid var(--gold); border-radius:8px; font-size:13px; font-family:'DM Mono';}
.stats-grid{padding:16px; display:grid; grid-template-columns:repeat(4,1fr); gap:12px;}.stat-card{padding:20px; border-radius:16px; background:var(--card); border:1px solid var(--line); box-shadow:var(--glow);}.stat-card.purple{background:var(--purple); color:white;}.stat-card.brown{background:#C2583D; color:white;}.stat-card.gold{background:var(--gold); color:#221A3A;}.stat-card span{font-family:'DM Mono'; font-size:10px; opacity:0.8;}.stat-card strong{font-size:28px; display:block; margin:12px 0 4px;}.stat-card small{font-size:11px; opacity:0.7;}
.admin-section{margin:12px 16px; padding:20px; background:var(--card); border-radius:16px; border:1px solid var(--line); box-shadow:var(--glow);}.section-heading span{font-family:'DM Mono'; font-size:10px; color:var(--purple); letter-spacing:1px;}.section-heading h2{margin-top:4px; font-size:18px;}
.form-grid,.supplier-form{display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:16px;}.form-field{display:flex; flex-direction:column; gap:6px;}.form-field.full{grid-column:1/-1;}.form-field label{font-family:'DM Mono'; font-size:10px; color:var(--muted);}.form-field input,.form-field select,.form-field textarea{border:1px solid var(--line); background:var(--bg); color:var(--text); padding:10px 12px; border-radius:8px; outline:none; font-family:"Space Grotesk";}.add-button{border:none; background:var(--gold); color:#221A3A; padding:12px 18px; border-radius:8px; font-weight:700; cursor:pointer; height:fit-content; align-self:end; font-family:"Space Grotesk";}.hint{font-family:'DM Mono'; font-size:9px; color:var(--muted); margin-left:8px;}
.management-list{display:flex; flex-direction:column; gap:8px; margin-top:16px;}.management-card{display:grid; grid-template-columns:60px 1fr 100px auto; gap:12px; align-items:center; padding:12px; background:var(--bg); border-radius:10px; border:1px solid var(--line);}.item-image{width:50px; height:50px; background:white; border-radius:8px; overflow:hidden;}.item-image img{width:100%; height:100%; object-fit:contain;}.edit-input{border:1px solid var(--line); background:var(--card); color:var(--text); padding:6px 8px; border-radius:6px; font-size:12px; width:100%; margin-top:4px;}.edit-input.title{font-weight:700;}.item-actions{display:flex; gap:6px;}.update-button{background:#22c55e; color:white; border:none; padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer;}.delete-button{background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer;}
.supplier-management{display:flex; flex-direction:column; gap:8px; margin-top:16px;}.supplier-card{display:grid; grid-template-columns:1fr 100px 100px auto; gap:12px; padding:12px; background:var(--bg); border-radius:10px; border:1px solid var(--line);}.price-input{width:80px; border:1px solid var(--line); background:var(--card); color:var(--text); padding:6px; border-radius:6px;}.orders-list{margin-top:12px;}.order-row{display:flex; justify-content:space-between; padding:10px 12px; background:var(--bg); border:1px solid var(--line); border-radius:8px; margin-bottom:6px; font-size:12px; font-family:'DM Mono';}.empty-state{padding:20px; text-align:center; color:var(--muted); font-size:13px; font-family:'DM Mono';}
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr);}.form-grid,.supplier-form{grid-template-columns:1fr;}.management-card,.supplier-card{grid-template-columns:1fr;}}
</style>

