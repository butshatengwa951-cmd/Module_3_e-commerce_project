import {
    getAllSupplierPrices,
    getSupplierPriceById,
    getPricesByProduct,
    createSupplierPrice,
    updateSupplierPrice,
    deleteSupplierPrice
} from "../models/SupplierPrice.js";


// GET ALL
export const getSupplierPrices = async (req, res) => {

    try {

        const prices = await getAllSupplierPrices();

        res.json(prices);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to get supplier prices"
        });
    }
};


// GET ONE
export const getSupplierPrice = async (req, res) => {

    try {

        const price = await getSupplierPriceById(req.params.id);

        if (!price) {

            return res.status(404).json({
                message: "Supplier price not found"
            });
        }

        res.json(price);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to get supplier price"
        });
    }
};


// GET PRICES FOR PRODUCT
export const getProductPrices = async (req, res) => {

    try {

        const prices = await getPricesByProduct(
            req.params.productId
        );

        res.json(prices);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to get product prices"
        });
    }
};


// CREATE
export const addSupplierPrice = async (req, res) => {

    try {

        const {
            product_id,
            supplier_name,
            price,
            minimum_quantity
        } = req.body;


        const supplier_price_id =
            await createSupplierPrice(
                product_id,
                supplier_name,
                price,
                minimum_quantity
            );


        res.status(201).json({
            message: "Supplier price created successfully",
            supplier_price_id
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to create supplier price"
        });
    }
};


// UPDATE
export const editSupplierPrice = async (req, res) => {

    try {

        const {
            supplier_name,
            price,
            minimum_quantity
        } = req.body;


        await updateSupplierPrice(
            req.params.id,
            supplier_name,
            price,
            minimum_quantity
        );


        res.json({
            message: "Supplier price updated successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update supplier price"
        });
    }
};


// DELETE
export const removeSupplierPrice = async (req, res) => {

    try {

        await deleteSupplierPrice(req.params.id);

        res.json({
            message: "Supplier price deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to delete supplier price"
        });
    }
};