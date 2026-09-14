import {
  getItemsByOrderId,
  postOrderItems,
  updateOrderItemQuantity,
  deleteOrderItem,
} from "../models/Items.js";

//View order items by order ID
export const getItemsByOrderIdCon = async (req, res) => {
  try {
    const order_id = req.params.order_id;
    const items = await getItemsByOrderId(order_id);
    res.json({
      success: "Request successful: Order items retrieved",
      data: items,
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ error: "Failed to fetch order items" });
  }
};

export const updateOrderItemQtyCon = async (req, res) => {
  try {
    const order_item_id = req.params.order_item_id;
    const { quantity } = req.body;

    if (!order_item_id || quantity == null || Number(quantity) < 1) {
      return res.status(400).json({ error: "A valid quantity is required" });
    }

    const result = await updateOrderItemQuantity(
      order_item_id,
      Number(quantity),
    );
    res.json({
      success: "Request successful: Order item updated",
      data: result,
    });
  } catch (error) {
    console.error("Error updating order item:", error);
    res.status(500).json({ error: "Failed to update order item" });
  }
};

export const deleteOrderItemCon = async (req, res) => {
  try {
    const order_item_id = req.params.order_item_id;
    const result = await deleteOrderItem(order_item_id);
    res.json({
      success: "Request successful: Order item deleted",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting order item:", error);
    res.status(500).json({ error: "Failed to delete order item" });
  }
};

//Add to order items
export const postOrderItemsCon = async (req, res) => {
  try {
    const order_id = req.params.order_id ?? req.body.order_id;
    const {
      product_id,
      supplier_price_id,
      item_name,
      item_quantity,
      quantity = item_quantity,
    } = req.body;

    if (!order_id || (!product_id && !item_name) || quantity == null) {
      return res.status(400).json({
        error: "order_id, product_id or item_name, and quantity are required",
      });
    }

    const new_item = await postOrderItems({
      order_id,
      product_id,
      supplier_price_id,
      item_name,
      quantity,
    });
    res.json({
      success: "Request successful: Order item added",
      data: new_item,
    });
  } catch (error) {
    console.error("Error adding order item:", error);
    res.status(500).json({ error: "Failed to add order item" });
  }
};
