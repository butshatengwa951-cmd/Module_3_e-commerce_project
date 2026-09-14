import express from "express";

import {
  getSupplierPrices,
  getSupplierPrice,
  getProductPrices,
  addSupplierPrice,
  editSupplierPrice,
  removeSupplierPrice,
} from "../controllers/supplierPriceController.js";

const router = express.Router();

router.get("/", getSupplierPrices);
router.get("/product/:productId", getProductPrices);
router.get("/:id", getSupplierPrice);
router.post("/", addSupplierPrice);
router.put("/:id", editSupplierPrice);
router.delete("/:id", removeSupplierPrice);

export default router;
