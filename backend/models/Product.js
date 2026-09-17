import db from "../config/db.js";

function shapeProducts(rows) {
  const products = {};
  rows.forEach((row) => {
    if (!products[row.product_id]) products[row.product_id] = { product_id:row.product_id, product_name:row.product_name, description:row.description, category:row.category, image_url:row.image_url, quantity_available:row.quantity_available, created_at:row.created_at, vote_count:Number(row.vote_count||0), user_voted:Boolean(row.user_voted), is_group_pick:Boolean(row.is_group_pick), supplier_prices:[] };
    if (row.supplier_price_id) products[row.product_id].supplier_prices.push({ supplier_price_id:row.supplier_price_id, supplier_name:row.supplier_name, price:row.price, minimum_quantity:row.minimum_quantity });
  });
  return Object.values(products);
}

export const getAllProducts = async () => {
  const [rows] = await db.query(`SELECT p.*,sp.supplier_price_id,sp.supplier_name,sp.price,sp.minimum_quantity,0 AS vote_count,0 AS user_voted,0 AS is_group_pick FROM products p LEFT JOIN supplier_prices sp ON p.product_id=sp.product_id ORDER BY p.product_id,sp.price`);
  return shapeProducts(rows);
};

// Product voting was removed from the active Stokvel workflow. Keep the
// authenticated group catalogue compatible with the normal catalogue query
// instead of depending on the retired stokvel_product_votes table.
export const getGroupProductsForUser = async () => getAllProducts();

export const getProductById = async (product_id) => {
  const [rows] = await db.query(`SELECT p.*,sp.supplier_price_id,sp.supplier_name,sp.price,sp.minimum_quantity FROM products p LEFT JOIN supplier_prices sp ON p.product_id=sp.product_id WHERE p.product_id=? ORDER BY sp.price`, [product_id]);
  if(!rows.length)return undefined;
  const product={product_id:rows[0].product_id,product_name:rows[0].product_name,description:rows[0].description,category:rows[0].category,image_url:rows[0].image_url,quantity_available:rows[0].quantity_available,created_at:rows[0].created_at,supplier_prices:[]};
  rows.forEach(row=>{if(row.supplier_price_id)product.supplier_prices.push({supplier_price_id:row.supplier_price_id,supplier_name:row.supplier_name,price:row.price,minimum_quantity:row.minimum_quantity})});return product;
};
export const createProduct=async(product_name,description,category,image_url,quantity_available)=>{const[result]=await db.query(`INSERT INTO products (product_name,description,category,image_url,quantity_available) VALUES (?,?,?,?,?)`,[product_name,description,category,image_url,quantity_available]);return result.insertId};
export const updateProduct=async(product_id,product_name,description,category,image_url,quantity_available)=>db.query(`UPDATE products SET product_name=?,description=?,category=?,image_url=?,quantity_available=? WHERE product_id=?`,[product_name,description,category,image_url,quantity_available,product_id]);
export const deleteProduct=async(product_id)=>db.query("DELETE FROM products WHERE product_id=?",[product_id]);
