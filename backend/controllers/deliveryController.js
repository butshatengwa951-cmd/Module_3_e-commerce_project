import {pool} from "../config/db.js";

// :id can be either a Butsha-dev tracking number (SW-XXXXXXXX-ZA) or a bare
// order_details.order_id - the latter is what a link coming from the
// catalogue/cart branches would actually have, since they only know the
// shared order id, not Butsha-dev's tracking code.
async function findOrder(id) {
  const [byTracking] = await pool.query(
    `SELECT od.* FROM order_details od
     JOIN deliveries d ON d.order_id = od.order_id
     WHERE d.tracking_number = ?`,
    [id],
  );
  if (byTracking.length) return byTracking[0];

  if (/^\d+$/.test(String(id))) {
    const [byId] = await pool.query(
      "SELECT * FROM order_details WHERE order_id = ?",
      [id],
    );
    if (byId.length) return byId[0];
  }
  return null;
}

export async function getDelivery(req, res) {
  try {
    const { id } = req.params;
    const order = await findOrder(id);
    if (!order)
      return res
        .status(404)
        .json({ error: "Tracking not found - pay first at /pay" });

    // Shared delivery_details row (address/transport/status) - readable by
    // any branch via order_details.delivery_id.
    const [detRows] = await pool.query(
      "SELECT * FROM delivery_details WHERE delivery_id = ?",
      [order.delivery_id],
    );
    const details = detRows[0] || {};

    // Butsha-dev's richer progress/courier/timeline layer, linked by order_id.
    const [delRows] = await pool.query(
      "SELECT * FROM deliveries WHERE order_id = ?",
      [order.order_id],
    );
    const delivery = delRows[0] || {
      progress: 42,
      estimated_text: "Tomorrow by 18:00",
      status: "shipped",
      tracking_number: `SW-ORDER-${order.order_id}`,
      courier: "StockWell Express ZA",
    };

    const [logs] = await pool.query(
      "SELECT * FROM delivery_logs WHERE delivery_id = ? ORDER BY created_at DESC",
      [delivery.id || 0],
    );

    // Items via the shared order_items/products/supplier_prices join - the
    // same query shape Cial-dev's cart uses.
    const [items] = await pool.query(
      `SELECT oi.product_id, oi.quantity as qty, oi.unit_price as price, p.product_name as name
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [order.order_id],
    );

    const progress = delivery.progress ?? 42;
    const steps = [
      { label: "ORDERED", done: true },
      { label: "PAID", done: order.order_status !== "Pending" },
      { label: "SHIPPED", done: progress >= 40 },
      { label: "IN TRANSIT", done: progress >= 60 },
      { label: "OUT FOR DELIVERY", done: progress >= 85 },
      { label: "DELIVERED", done: progress >= 100 },
    ];

    res.json({
      id: delivery.tracking_number,
      order_id: order.order_id,
      tracking_number: delivery.tracking_number,
      status: delivery.status || details.delivery_status || order.order_status,
      progress,
      eta: delivery.estimated_text || "Tomorrow by 18:00",
      courier: delivery.courier || "StockWell Express ZA",
      address: details.delivery_address || delivery.delivery_address,
      total: order.total_amount,
      member_name: req.query.member_name || "",
      items: items.map((i) => i.name),
      raw_items: items,
      timeline_raw: logs.map((l) => ({
        title: l.title,
        desc: l.description,
        date: l.created_at,
        tag: l.tag,
      })),
      steps,
      delivery_id: delivery.id,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function updateProgress(req, res) {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    const order = await findOrder(id);
    if (!order) return res.status(404).json({ error: "Tracking not found" });

    let status = "shipped";
    let sharedStatus = "In Transit";
    if (progress >= 100) {
      status = "delivered";
      sharedStatus = "Delivered";
    } else if (progress >= 85) {
      status = "out_for_delivery";
      sharedStatus = "In Transit";
    } else if (progress >= 60) {
      status = "in_transit";
      sharedStatus = "In Transit";
    } else {
      sharedStatus = "Pending";
    }

    await pool.query(
      "UPDATE deliveries SET progress=?, status=? WHERE order_id=?",
      [progress, status, order.order_id],
    );
    // Mirror the coarse status onto the shared delivery_details row too,
    // so anything built on the catalogue/cart branches sees it change.
    if (order.delivery_id) {
      await pool.query(
        "UPDATE delivery_details SET delivery_status=? WHERE delivery_id=?",
        [sharedStatus, order.delivery_id],
      );
    }
    res.json({ ok: true, progress, status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
