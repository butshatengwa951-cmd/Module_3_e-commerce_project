import axios from "axios";


// =====================================
// BACKEND URL
// =====================================

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:4040";


const api = axios.create({

    baseURL: API_URL,

    headers: {
        "Content-Type": "application/json"
    }

});


// =====================================
// PRODUCTS
// =====================================

export async function getProducts() {

    const { data } =
        await api.get("/products");

    return data;

}


export async function createProduct(product) {

    const { data } =
        await api.post(
            "/products",
            product
        );

    return data;

}


export async function updateProduct(
    id,
    product
) {

    const { data } =
        await api.put(
            `/products/${id}`,
            product
        );

    return data;

}


export async function deleteProduct(id) {

    const { data } =
        await api.delete(
            `/products/${id}`
        );

    return data;

}


// =====================================
// SUPPLIER PRICES
// =====================================

export async function getSupplierPrices() {

    const { data } =
        await api.get(
            "/supplier-prices"
        );

    return data;

}


export async function createSupplierPrice(
    supplierPrice
) {

    const { data } =
        await api.post(
            "/supplier-prices",
            supplierPrice
        );

    return data;

}


export async function updateSupplierPrice(
    id,
    supplierPrice
) {

    const { data } =
        await api.put(
            `/supplier-prices/${id}`,
            supplierPrice
        );

    return data;

}


export async function deleteSupplierPrice(
    id
) {

    const { data } =
        await api.delete(
            `/supplier-prices/${id}`
        );

    return data;

}


// =====================================
// ADMIN DASHBOARD
// =====================================

export async function getAdminDashboard() {

    const { data } =
        await api.get(
            "/dashboard/admin"
        );

    return data;

}


// =====================================
// MEMBER DASHBOARD
// =====================================

export async function getMemberDashboard() {

    const { data } =
        await api.get(
            "/dashboard/member"
        );

    return data;

}


// =====================================
// ORDERS
// =====================================

export async function getOrders() {

    const { data } =
        await api.get(
            "/dashboard/orders"
        );

    return data;

}


// =====================================
// CONTRIBUTIONS
// =====================================

export async function addContribution(
    contribution
) {

    const { data } =
        await api.post(
            "/dashboard/contributions",
            contribution
        );

    return data;

}


export default api;