import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getDashboard,
  getUsers,
  getStokvels,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSupplierPrices,
  createSupplierPrice,
  updateSupplierPrice,
  deleteSupplierPrice,
  getOrders,
  updateOrderStatus,
  getDeliveries,
  updateDelivery,
} from "../controllers/adminController.js";
import {
  getManagedUsers,
  updateUserRole,
  getStokvelMembers,
  addStokvelMember,
  removeStokvelMember,
  getAdminAnalytics,
  getAuditLog,
} from "../controllers/adminManagementController.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/stokvels", getStokvels);
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/supplier-prices", getSupplierPrices);
router.post("/supplier-prices", createSupplierPrice);
router.put("/supplier-prices/:id", updateSupplierPrice);
router.delete("/supplier-prices/:id", deleteSupplierPrice);
router.get("/orders", getOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/deliveries", getDeliveries);
router.patch("/deliveries/:id", updateDelivery);

// Additional company administration controls.
router.get("/management/users", getManagedUsers);
router.patch("/management/users/:id/role", updateUserRole);
router.get("/management/stokvels/:id/members", getStokvelMembers);
router.post("/management/stokvels/:id/members", addStokvelMember);
router.delete("/management/stokvels/:id/members/:userId", removeStokvelMember);
router.get("/analytics", getAdminAnalytics);
router.get("/audit-log", getAuditLog);

export default router;
