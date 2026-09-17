import { getMemberDashboardData } from "../models/Dashboard.js";
import { findUserById } from "../models/User.js";

export const getProfile = async (req, res) => {
    try {
        const user = await findUserById(req.user.user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile."
        });
    }
};

export const getMemberDashboard = async (req, res) => {
    try {
        const dashboard = await getMemberDashboardData(req.user.user_id);

        if (!dashboard) {
            return res.status(404).json({
                success: false,
                message: "You are not currently linked to a Stokvel."
            });
        }

        return res.status(200).json({
            success: true,
            ...dashboard
        });
    } catch (error) {
        console.error("Get member dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve member dashboard."
        });
    }
};
