<template>
  <main class="admin-page">
    <header class="admin-header">
      <div>
        <span class="eyebrow">STOCKWELL ADMIN</span>
        <h1>Company control centre</h1>
        <p>Manage StockWell across every Stokvel, product, order and delivery.</p>
      </div>
      <button class="logout" @click="logout">Log out</button>
    </header>

    <div v-if="message" class="message">{{ message }}</div>

    <section class="stats-grid">
      <article v-for="card in statCards" :key="card.label" class="stat-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <section class="panel">
      <div class="panel-heading"><div><span class="eyebrow">CATALOGUE</span><h2>Products & inventory</h2></div><button @click="showProductForm = !showProductForm">{{ showProductForm ? 'Close' : '+ Add product' }}</button></div>
      <form v-if="showProductForm" class="form-grid" @submit.prevent="addProduct">
        <input v-model="newProduct.product_name" required placeholder="Product name" />
        <input v-model="newProduct.category" placeholder="Category" />
        <input v-model.number="newProduct.quantity_available" type="number" min="0" placeholder="Stock" />
        <input v-model="newProduct.image_url" placeholder="Image URL" />
        <textarea v-model="newProduct.description" placeholder="Description"></textarea>
        <button type="submit">Create product</button>
      </form>
      <div class="search"><input v-model="productSearch" placeholder="Search products..." /></div>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
        <tr v-for="product in filteredProducts" :key="product.product_id">
          <td><input v-model="product.product_name" /></td><td><input v-model="product.category" /></td>
          <td><input v-model.number="product.quantity_available" type="number" min="0" /></td>
          <td class="actions"><button @click="saveProduct(product)">Save</button><button class="danger" @click="removeProduct(product)">Delete</button></td>
        </tr>
      </tbody></table></div>
    </section>

    <section class="panel">
      <div class="panel-heading"><div><span class="eyebrow">SUPPLIERS</span><h2>Supplier prices</h2></div></div>
      <form class="form-grid compact" @submit.prevent="addSupplier">
        <select v-model.number="newSupplier.product_id" required><option v-for="product in products" :key="product.product_id" :value="product.product_id">{{ product.product_name }}</option></select>
        <input v-model="newSupplier.supplier_name" required placeholder="Supplier" /><input v-model.number="newSupplier.price" required type="number" min="0" step="0.01" placeholder="Price" /><input v-model.number="newSupplier.minimum_quantity" type="number" min="1" placeholder="Minimum qty" /><button type="submit">Add price</button>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Supplier</th><th>Price</th><th>Min qty</th><th>Actions</th></tr></thead><tbody>
        <tr v-for="item in supplierPrices" :key="item.supplier_price_id"><td>{{ item.product_name }}</td><td><input v-model="item.supplier_name" /></td><td><input v-model.number="item.price" type="number" step="0.01" /></td><td><input v-model.number="item.minimum_quantity" type="number" min="1" /></td><td class="actions"><button @click="saveSupplier(item)">Save</button><button class="danger" @click="removeSupplier(item)">Delete</button></td></tr>
      </tbody></table></div>
    </section>

    <section class="two-col">
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">STOKVELS</span><h2>All groups</h2></div></div><div class="list"><article v-for="group in stokvels" :key="group.stokvel_id"><strong>{{ group.stokvel_name }}</strong><span>{{ group.member_count }} members · Chairperson: {{ group.chairperson_name }}</span></article></div></section>
      <section class="panel"><div class="panel-heading"><div><span class="eyebrow">USERS</span><h2>All users</h2></div></div><div class="list"><article v-for="user in users" :key="user.user_id"><strong>{{ user.full_name }}</strong><span>{{ user.email }} · {{ user.role }}{{ user.stokvels ? ' · ' + user.stokvels : '' }}</span></article></div></section>
    </section>

    <section class="panel"><div class="panel-heading"><div><span class="eyebrow">ORDERS</span><h2>Company-wide orders</h2></div></div><div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Stokvel</th><th>Total</th><th>Status</th><th>Delivery</th></tr></thead><tbody>
      <tr v-for="order in orders" :key="order.order_id"><td>#{{ order.order_id }}</td><td>{{ order.customer_name || '—' }}</td><td>{{ order.stokvel_name || '—' }}</td><td>R {{ Number(order.total_amount).toFixed(2) }}</td><td><select :value="order.order_status" @change="setOrderStatus(order, $event.target.value)"><option v-for="status in orderStatuses" :key="status">{{ status }}</option></select></td><td>{{ order.delivery_status || '—' }}</td></tr>
    </tbody></table></div></section>

    <section class="panel"><div class="panel-heading"><div><span class="eyebrow">DELIVERIES</span><h2>Delivery operations</h2></div></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Address</th><th>Driver</th><th>Status</th><th>Date</th></tr></thead><tbody>
      <tr v-for="delivery in deliveries" :key="delivery.delivery_id"><td>#{{ delivery.delivery_id }}</td><td>{{ delivery.delivery_address }}</td><td>{{ delivery.driver_name || '—' }}</td><td><select :value="delivery.delivery_status" @change="setDeliveryStatus(delivery, $event.target.value)"><option v-for="status in deliveryStatuses" :key="status">{{ status }}</option></select></td><td>{{ formatDate(delivery.delivery_date) }}</td></tr>
    </tbody></table></div></section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getAdminDashboard, getAdminUsers, getAdminStokvels, getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct,
  getAdminSupplierPrices, createAdminSupplierPrice, updateAdminSupplierPrice, deleteAdminSupplierPrice,
  getAdminOrders, updateAdminOrderStatus, getAdminDeliveries, updateAdminDelivery,
} from "../services/api.js";

const router = useRouter();
const message = ref("");
const stats = ref({});
const users = ref([]); const stokvels = ref([]); const products = ref([]); const supplierPrices = ref([]); const orders = ref([]); const deliveries = ref([]);
const productSearch = ref(""); const showProductForm = ref(false);
const newProduct = ref({ product_name: "", description: "", category: "Staples", image_url: "", quantity_available: 0 });
const newSupplier = ref({ product_id: null, supplier_name: "", price: 0, minimum_quantity: 10 });
const orderStatuses = ["Pending", "Confirmed", "Processing", "Completed", "Cancelled"];
const deliveryStatuses = ["Pending", "In Transit", "Delivered", "Cancelled"];
const statCards = computed(() => [
  { label: "Users", value: stats.value.users ?? 0 }, { label: "Stokvels", value: stats.value.stokvels ?? 0 },
  { label: "Products", value: stats.value.products ?? 0 }, { label: "Orders", value: stats.value.orders ?? 0 },
  { label: "Low stock", value: stats.value.low_stock ?? 0 }, { label: "Revenue", value: `R ${Number(stats.value.revenue || 0).toFixed(2)}` },
]);
const filteredProducts = computed(() => { const q = productSearch.value.toLowerCase().trim(); return products.value.filter(p => !q || `${p.product_name} ${p.category}`.toLowerCase().includes(q)); });
const notify = (text) => { message.value = text; window.setTimeout(() => { if (message.value === text) message.value = ""; }, 3500); };
async function load() { try { const [d,u,s,p,sp,o,del] = await Promise.all([getAdminDashboard(),getAdminUsers(),getAdminStokvels(),getAdminProducts(),getAdminSupplierPrices(),getAdminOrders(),getAdminDeliveries()]); stats.value=d.stats||{}; users.value=u.users||[]; stokvels.value=s.stokvels||[]; products.value=p.products||[]; supplierPrices.value=sp.supplierPrices||[]; orders.value=o.orders||[]; deliveries.value=del.deliveries||[]; if (!newSupplier.value.product_id && products.value[0]) newSupplier.value.product_id=products.value[0].product_id; } catch (error) { if (error.response?.status === 401 || error.response?.status === 403) router.replace("/"); else notify(error.response?.data?.message || "Unable to load admin data."); } }
async function addProduct() { try { const r=await createAdminProduct(newProduct.value); products.value.unshift(r.product); newProduct.value={ product_name:"",description:"",category:"Staples",image_url:"",quantity_available:0 }; showProductForm.value=false; notify("Product created."); await refreshStats(); } catch(e){ notify(e.response?.data?.message||"Unable to create product."); } }
async function saveProduct(p) { try { const r=await updateAdminProduct(p.product_id,p); Object.assign(p,r.product); notify("Product saved."); } catch(e){ notify(e.response?.data?.message||"Unable to save product."); } }
async function removeProduct(p) { if(!window.confirm(`Delete ${p.product_name}?`)) return; try { await deleteAdminProduct(p.product_id); products.value=products.value.filter(x=>x.product_id!==p.product_id); notify("Product deleted."); await refreshStats(); } catch(e){ notify(e.response?.data?.message||"Unable to delete product."); } }
async function addSupplier() { try { const r=await createAdminSupplierPrice(newSupplier.value); supplierPrices.value.unshift(r.supplierPrice); newSupplier.value={ product_id: products.value[0]?.product_id || null,supplier_name:"",price:0,minimum_quantity:10 }; notify("Supplier price added."); await refreshStats(); } catch(e){ notify(e.response?.data?.message||"Unable to add supplier price."); } }
async function saveSupplier(item) { try { const r=await updateAdminSupplierPrice(item.supplier_price_id,item); Object.assign(item,r.supplierPrice); notify("Supplier price saved."); } catch(e){ notify(e.response?.data?.message||"Unable to save supplier price."); } }
async function removeSupplier(item) { if(!window.confirm("Delete this supplier price?")) return; try { await deleteAdminSupplierPrice(item.supplier_price_id); supplierPrices.value=supplierPrices.value.filter(x=>x.supplier_price_id!==item.supplier_price_id); notify("Supplier price deleted."); } catch(e){ notify(e.response?.data?.message||"Unable to delete supplier price."); } }
async function setOrderStatus(order,status) { try { await updateAdminOrderStatus(order.order_id,status); order.order_status=status; notify(`Order #${order.order_id} updated.`); await refreshStats(); } catch(e){ notify(e.response?.data?.message||"Unable to update order."); } }
async function setDeliveryStatus(delivery,status) { try { await updateAdminDelivery(delivery.delivery_id,{delivery_status:status}); delivery.delivery_status=status; notify(`Delivery #${delivery.delivery_id} updated.`); await refreshStats(); } catch(e){ notify(e.response?.data?.message||"Unable to update delivery."); } }
async function refreshStats() { const r=await getAdminDashboard(); stats.value=r.stats||{}; }
function formatDate(value){ if(!value) return "—"; return new Date(value).toLocaleDateString(); }
function logout(){ localStorage.removeItem("token"); localStorage.removeItem("sw_token"); localStorage.removeItem("user"); localStorage.removeItem("stokvel"); router.push("/login-signup"); }
onMounted(load);
</script>

<style scoped>
.admin-page{min-height:100vh;padding:42px clamp(18px,4vw,64px);background:var(--sw-page-gradient,#f7f8fc);color:var(--sw-page-text,#18202b);font-family:var(--sw-font-body,Arial,sans-serif)}
.admin-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;max-width:1400px;margin:0 auto 28px}.eyebrow{font-size:.72rem;letter-spacing:.16em;font-weight:800;opacity:.65}.admin-header h1{font-size:clamp(2rem,4vw,3.5rem);margin:8px 0}.admin-header p{opacity:.72;margin:0}.logout,.panel-heading button,.form-grid button,.actions button{border:0;border-radius:12px;padding:10px 15px;background:#111827;color:#fff;cursor:pointer}.message{max-width:1400px;margin:0 auto 18px;padding:12px 16px;border-radius:12px;background:#e7f5ec}.stats-grid{max-width:1400px;margin:0 auto 24px;display:grid;grid-template-columns:repeat(6,1fr);gap:14px}.stat-card{padding:20px;border:1px solid rgba(0,0,0,.08);border-radius:18px;background:rgba(255,255,255,.72);box-shadow:0 8px 30px rgba(0,0,0,.05)}.stat-card span{display:block;font-size:.7rem;font-weight:800;letter-spacing:.1em;opacity:.6}.stat-card strong{display:block;font-size:1.65rem;margin-top:8px}.panel{max-width:1400px;margin:0 auto 24px;padding:24px;border:1px solid rgba(0,0,0,.08);border-radius:22px;background:rgba(255,255,255,.76);box-shadow:0 10px 35px rgba(0,0,0,.05)}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}.panel-heading h2{margin:5px 0 0}.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.form-grid.compact{grid-template-columns:2fr 1.4fr 1fr 1fr auto}.form-grid input,.form-grid textarea,.form-grid select,.search input,td input,td select{width:100%;box-sizing:border-box;border:1px solid #d7dce5;border-radius:10px;padding:10px;background:#fff;color:inherit}.form-grid textarea{grid-column:1/-1;min-height:80px}.search{margin-bottom:14px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:720px}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid rgba(0,0,0,.08);vertical-align:middle}th{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;opacity:.6}.actions{display:flex;gap:7px}.actions .danger{background:#9f1239}.two-col{max-width:1400px;margin:0 auto 24px;display:grid;grid-template-columns:1fr 1fr;gap:24px}.two-col .panel{margin:0}.list{display:grid;gap:10px}.list article{padding:14px;border-radius:14px;background:rgba(0,0,0,.035)}.list strong,.list span{display:block}.list span{font-size:.86rem;opacity:.65;margin-top:4px}@media(max-width:1050px){.stats-grid{grid-template-columns:repeat(3,1fr)}.form-grid,.form-grid.compact{grid-template-columns:1fr 1fr}.two-col{grid-template-columns:1fr}}@media(max-width:600px){.admin-page{padding:24px 14px}.admin-header{flex-direction:column}.stats-grid{grid-template-columns:repeat(2,1fr)}.form-grid,.form-grid.compact{grid-template-columns:1fr}.stat-card{padding:15px}.panel{padding:16px}}
</style>
