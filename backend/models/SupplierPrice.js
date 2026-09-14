import db from "../config/db.js";


// Get all supplier prices
export const getAllSupplierPrices = async () => {

    const [rows] = await db.query(`
        SELECT
            supplier_price_id,
            product_id,
            supplier_name,
            price,
            minimum_quantity
        FROM supplier_prices
        ORDER BY product_id, price
    `);

    return rows;
};


// Get one supplier price
export const getSupplierPriceById = async (id) => {

    const [rows] = await db.query(`
        SELECT *
        FROM supplier_prices
        WHERE supplier_price_id = ?
    `, [id]);

    return rows[0];
};


// Get prices for one product
export const getPricesByProduct = async (product_id) => {

    const [rows] = await db.query(`
        SELECT
            supplier_price_id,
            product_id,
            supplier_name,
            price,
            minimum_quantity
        FROM supplier_prices
        WHERE product_id = ?
        ORDER BY price ASC
    `, [product_id]);

    return rows;
};


// Add supplier price
export const createSupplierPrice = async (
    product_id,
    supplier_name,
    price,
    minimum_quantity
) => {

    const [result] = await db.query(`
        INSERT INTO supplier_prices
        (
            product_id,
            supplier_name,
            price,
            minimum_quantity
        )
        VALUES (?, ?, ?, ?)
    `, [
        product_id,
        supplier_name,
        price,
        minimum_quantity
    ]);

    return result.insertId;
};


// Update supplier price
export const updateSupplierPrice = async (
    id,
    supplier_name,
    price,
    minimum_quantity
) => {

    const [result] = await db.query(`
        UPDATE supplier_prices
        SET
            supplier_name = ?,
            price = ?,
            minimum_quantity = ?
        WHERE supplier_price_id = ?
    `, [
        supplier_name,
        price,
        minimum_quantity,
        id
    ]);

    return result;
};


// Delete supplier price
export const deleteSupplierPrice = async (id) => {

    const [result] = await db.query(`
        DELETE FROM supplier_prices
        WHERE supplier_price_id = ?
    `, [id]);

    return result;
};