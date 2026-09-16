import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  getItemsByOrderId,
  getOrCreatePendingCartByStokvelId,
} from "./models/Items.js";
import {
  getOrderCon,
  getOrderByIdCon,
  postOrderCon,
  updateOrderToConfirmedCon,
  updateOrderToCancelledCon,
} from "./controllers/orderController.js";
import {
  getItemsByOrderIdCon,
  postOrderItemsCon,
  updateOrderItemQtyCon,
  deleteOrderItemCon,
} from "./controllers/items.js";

dotenv.config({ override: true });

const app = express();
app.use(cors());
app.use(express.json());

//Get order details
app.get("/order_details", getOrderCon);
app.get("/api/order_details", getOrderCon);

//Get order by order ID
app.get("/order_details/:order_id", getOrderByIdCon);
app.get("/api/order_details/:order_id", getOrderByIdCon);

//Add an order
app.post("/order_details", postOrderCon);

//Update order status
app.patch("/order_details/:order_id/Confirmed", updateOrderToConfirmedCon);
app.patch("/order_details/:order_id/Cancelled", updateOrderToCancelledCon);

//View order items by order ID
app.get("/order_details/:order_id/items", getItemsByOrderIdCon);

app.get("/api/stokvels/:stokvelId/cart", async (req, res) => {
  try {
    const stokvelId = Number(req.params.stokvelId);
    const { orderId, items } =
      await getOrCreatePendingCartByStokvelId(stokvelId);

    res.json({
      success: "Request successful: Cart retrieved",
      items,
      order_id: orderId,
      stokvel_id: stokvelId,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.put("/api/order-items/:order_item_id", updateOrderItemQtyCon);
app.delete("/api/order-items/:order_item_id", deleteOrderItemCon);
app.put("/api/orders/:order_id/confirm", updateOrderToConfirmedCon);

//Add to order items
app.post("/order_details/:order_id/items", postOrderItemsCon);
app.post("/order_items", postOrderItemsCon);

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Live on ${PORT}`);
});
