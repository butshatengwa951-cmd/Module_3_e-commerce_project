import {
    getAllStokvels,
    findStokvelById
} from "../models/Stokvel.js";


export const getAllStokvelsController = async (req, res) => {
    try {
        const stokvels = await getAllStokvels();

        return res.status(200).json({
            success: true,
            stokvels
        });

    } catch (error) {
        console.error("Failed to get stokvels!");
        console.error(error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve stokvels."
        });
    }
};


export const getStokvelByIdController = async (req, res) => {
    try {
        const stokvelId = Number(req.params.id);

        if (!Number.isInteger(stokvelId) || stokvelId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid stokvel ID."
            });
        }

        const stokvel = await findStokvelById(stokvelId);

        if (!stokvel) {
            return res.status(404).json({
                success: false,
                message: "Stokvel not found."
            });
        }

        return res.status(200).json({
            success: true,
            stokvel
        });

    } catch (error) {
        console.error("Failed to get stokvel!");
        console.error(error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve stokvel."
        });
    }
};