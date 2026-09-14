import {
  getOrder,
  getOrderById,
  postOrder,
  updateOrder,
  updateOrderToConfirmed,
  updateOrderToCancelled,
} from "../models/Order.js";

//Get order details
export const getOrderCon = async (req, res) => {
  try {
    const orders = await getOrder();
    res.json({ success: "Orders:", data: orders });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

//Get order by order ID
export const getOrderByIdCon = async (req, res) => {
  try {
    const order_id = req.params.order_id;
    const order = await getOrderById(order_id);
    res.json({ success: "Your order:", data: order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

//Add an order
export const postOrderCon = async (req, res) => {
  try {
    const orderData = req.body;
    const newOrder = await postOrder(orderData);
    res.status(201).json({ success: "Request successful: Order added" });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ error: "Failed to add order" });
  }
};

//Update order status
export const updateOrderCon = async (req, res) => {
  try {
    const order_id = req.params.order_id;
    const { order_status } = req.body;
    const updatedOrder = await updateOrder(order_id, order_status);
    res.json({
      success: "Request successful: Order status updated",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

//Update order status to Confirmed
export const updateOrderToConfirmedCon = async (req, res) => {
  try {
    const order_id = req.params.order_id;
    const updatedOrder = await updateOrderToConfirmed(order_id);
    res.json({
      success: "Request successful: Order confirmed",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

//Update order status to Cancelled
export const updateOrderToCancelledCon = async (req, res) => {
  try {
    const order_id = req.params.order_id;
    const updatedOrder = await updateOrderToCancelled(order_id);
    res.json({
      success: "Request successful: Order cancelled",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};