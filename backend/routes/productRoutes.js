import express from "express";

import {
  getProducts,
  getProduct,
  addProduct,
  editProduct,
  removeProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Public catalogue reads.
router.get("/", getProducts);
router.get("/:id", getProduct);

// Administrative product mutations will be protected when the admin
// authentication middleware is integrated later in the project.
router.post("/", addProduct);
router.put("/:id", editProduct);
router.patch("/:id", editProduct);
router.delete("/:id", removeProduct);

export default router;
