
const {pool}=require('../config/db');
exports.getDelivery=async(req,res)=>{
  try{
    const {id}=req.params; // tracking_number
    const [orders]=await pool.query('SELECT * FROM orders WHERE tracking_number=?',[id]);
    if(!orders.length) return res.status(404).json({error:'Tracking not found - pay first at /pay'});
    const order=orders[0];
    const [delRows]=await pool.query('SELECT * FROM deliveries WHERE tracking_number=? OR order_id=?',[id, order.id]);
    const delivery=delRows[0]||{progress:42, estimated_text:'Tomorrow by 18:00', status:'shipped'};
    const [logs]=await pool.query('SELECT * FROM delivery_logs WHERE delivery_id=? ORDER BY created_at DESC',[delivery.id]);
    const [items]=await pool.query(`
      SELECT oie.product_id, oie.qty, oie.price, p.product_name as name
      FROM order_items_ecom oie LEFT JOIN products p ON p.product_id=oie.product_id
      WHERE oie.order_id=?`,[order.id]);
    const steps=[
      {label:'ORDERED',done:true},{label:'PAID',done:order.status!=='pending'},
      {label:'SHIPPED',done:delivery.progress>=40},{label:'IN TRANSIT',done:delivery.progress>=60},
      {label:'OUT FOR DELIVERY',done:delivery.progress>=85},{label:'DELIVERED',done:delivery.progress>=100}
    ];
    res.json({
      id:order.tracking_number,
      tracking_number:order.tracking_number,
      status:delivery.status||order.status,
      progress:delivery.progress||42,
      eta:delivery.estimated_text||'Tomorrow by 18:00',
      courier:delivery.courier||'StockWell Express ZA',
      address:delivery.delivery_address||order.delivery_address,
      total:order.final_amount||order.total_amount,
      member_name:order.member_name,
      items:items.map(i=>i.name),
      raw_items:items,
      timeline_raw:logs.map(l=>({title:l.title,desc:l.description,date:l.created_at,tag:l.tag})),
      steps,
      delivery_id:delivery.id
    });
  }catch(e){res.status(500).json({error:e.message});}
};
exports.updateProgress=async(req,res)=>{
  try{
    const {id}=req.params;const {progress}=req.body;
    let status='shipped'; if(progress>=100) status='delivered'; else if(progress>=85) status='out_for_delivery'; else if(progress>=60) status='in_transit';
    await pool.query('UPDATE deliveries SET progress=?, status=? WHERE tracking_number=?',[progress,status,id]);
    res.json({ok:true,progress,status});
  }catch(e){res.status(500).json({error:e.message});}
};
