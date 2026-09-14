import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../models/Product.js";

// GET ALL
export const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get products",
    });
  }
};

// GET ONE
export const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get product",
    });
  }
};

// CREATE
export const addProduct = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Please send product data",
      });
    }

    const {
      product_name,
      description,
      category,
      image_url,
      quantity_available,
    } = req.body;

    if (!product_name || !category || quantity_available === undefined) {
      return res.status(400).json({
        message: "Product name, category and quantity are required",
      });
    }

    const product_id = await createProduct(
      product_name,
      description,
      category,
      image_url,
      quantity_available,
    );

    res.status(201).json({
      message: "Product created successfully",
      product_id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

// UPDATE
export const editProduct = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Please send product data",
      });
    }

    const oldProduct = await getProductById(req.params.id);

    if (!oldProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      product_name,
      description,
      category,
      image_url,
      quantity_available,
    } = req.body;

    await updateProduct(
      req.params.id,
      product_name || oldProduct.product_name,
      description || oldProduct.description,
      category || oldProduct.category,
      image_url || oldProduct.image_url,
      quantity_available ?? oldProduct.quantity_available,
    );

    res.json({
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update product",
    });
  }
};

// DELETE
export const removeProduct = async (req, res) => {
  try {
    await deleteProduct(req.params.id);

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};
