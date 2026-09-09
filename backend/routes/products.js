
const express=require('express');const r=express.Router();const {pool}=require('../config/db');
r.get('/',async(req,res)=>{
  try{
    const [rows]=await pool.query(`
      SELECT p.product_id as id, p.product_name as name, p.product_name, p.description, p.category, p.image_url, p.quantity_available as stock,
             (SELECT MIN(price) FROM supplier_prices sp WHERE sp.product_id=p.product_id) as price
      FROM products p ORDER BY p.product_id ASC`);
    res.json(rows);
  }catch(e){res.status(500).json({error:e.message});}
});
module.exports=r;
