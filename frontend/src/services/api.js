
import axios from "axios";

// CHANGE THIS to your backend URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4040/";

const api = axios.create({ baseURL: API_URL, headers: { "Content-Type": "application/json" } });

// ---- PRODUCTS ----
export async function getProducts() {
  try { const { data } = await api.get("/products"); return data; }
  catch { // fallback demo data if backend down
    return [
      { product_id:1, product_name:"Maize Meal 10kg", category:"Staples", quantity_available:120, image_url:"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", description:"Premium maize meal for families", supplier_prices:[{supplier_price_id:1, supplier_name:"Makro", price:89.99, minimum_quantity:10},{supplier_price_id:2, supplier_name:"Boxer", price:95.50},{supplier_price_id:3, supplier_name:"Local Wholesaler", price:85.00}] },
      { product_id:2, product_name:"Sunflower Oil 2L", category:"Cooking Essentials", quantity_available:80, image_url:"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400", description:"Pure sunflower oil", supplier_prices:[{supplier_price_id:4, supplier_name:"Makro", price:65.00},{supplier_price_id:5, supplier_name:"Boxer", price:69.99}] },
      { product_id:3, product_name:"Rice 5kg", category:"Staples", quantity_available:60, image_url:"https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400", description:"Long grain rice", supplier_prices:[{supplier_price_id:6, supplier_name:"Makro", price:120.00},{supplier_price_id:7, supplier_name:"Local Wholesaler", price:110.00}] },
    ];
  }
}
export const createProduct = (d) => api.post("/products", d).then(r=>r.data);
export const updateProduct = (id,d) => api.put(`/products/${id}`, d).then(r=>r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r=>r.data);

// ---- SUPPLIERS ----
export async function getSupplierPrices() {
  try { const { data } = await api.get("/supplier-prices"); return data; }
  catch { const prods=await getProducts(); return prods.flatMap(p=>p.supplier_prices||[]); }
}
export const createSupplierPrice = (d) => api.post("/supplier-prices", d).then(r=>r.data);
export const updateSupplierPrice = (id,d) => api.put(`/supplier-prices/${id}`, d).then(r=>r.data);
export const deleteSupplierPrice = (id) => api.delete(`/supplier-prices/${id}`).then(r=>r.data);

// ---- DASHBOARD ----
export async function getAdminDashboard(){ try{ const {data}=await api.get("/admin/dashboard"); return data; } catch{ return {products:12, suppliers:8, groups:3, orders:24}; } }
export async function getMemberDashboard(){ try{ const {data}=await api.get("/member/dashboard"); return data; } catch{ return { group:{stokvel_name:"Eastleigh Savers"}, members:[{user_id:1, full_name:"Nomsa Dlamini", contribution_amount:120},{user_id:2, full_name:"Thabo Molefe", contribution_amount:150}], contributionTotal:720 }; } }
export async function getOrders(){ try{ const {data}=await api.get("/orders"); return data; } catch{ return []; } }
export const addContribution = (d) => api.post("/contributions", d).then(r=>r.data);

