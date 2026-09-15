import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import db from "./backend/config/db.js";

import productRoutes from "./backend/routes/productRoutes.js";
import supplierPriceRoutes from "./backend/routes/supplierPriceRoutes.js";

dotenv.config();

const app = express();


// ================================
// MIDDLEWARE
// ================================

app.use(cors());

app.use(express.json());


// ================================
// HOME
// ================================

app.get("/", (req, res) => {

    res.json({
        message: "Welcome to the StockWell API"
    });

});


// ================================
// TEST DATABASE
// ================================

app.get("/test-db", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT 1 AS result"
        );

        res.json({
            message: "Database connection successful",
            data: rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Database connection failed"
        });

    }

});


// ================================
// PRODUCT ROUTES
// ================================

app.use("/products", productRoutes);


// ================================
// SUPPLIER PRICE ROUTES
// ================================

app.use(
    "/supplier-prices",
    supplierPriceRoutes
);


// ================================
// ADMIN DASHBOARD
// ================================

app.get("/dashboard/admin", async (req, res) => {

    try {

        const [[productCount]] = await db.query(
            "SELECT COUNT(*) AS total FROM products"
        );


        const [[supplierCount]] = await db.query(
            `
            SELECT COUNT(DISTINCT supplier_name) AS total
            FROM supplier_prices
            `
        );


        const [[groupCount]] = await db.query(
            "SELECT COUNT(*) AS total FROM stokvels"
        );


        const [[orderCount]] = await db.query(
            "SELECT COUNT(*) AS total FROM order_details"
        );


        res.json({

            products: Number(productCount.total),

            suppliers: Number(supplierCount.total),

            groups: Number(groupCount.total),

            orders: Number(orderCount.total)

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load admin dashboard"
        });

    }

});


// ================================
// ORDERS
// ================================

app.get("/dashboard/orders", async (req, res) => {

    try {

        const [orders] = await db.query(
            `
            SELECT *
            FROM order_details
            ORDER BY order_date DESC
            `
        );


        res.json(orders);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load orders"
        });

    }

});


// ================================
// MEMBER DASHBOARD
// ================================

app.get("/dashboard/member", async (req, res) => {

    try {

        // Get the first stokvel for now
        const [[group]] = await db.query(
            `
            SELECT *
            FROM stokvels
            ORDER BY stokvel_id
            LIMIT 1
            `
        );


        // Get members and their total PAID contributions
        const [members] = await db.query(
            `
            SELECT
                u.user_id,
                u.full_name,
                COALESCE(
                    SUM(
                        CASE
                            WHEN mc.payment_status = 'Paid'
                            THEN mc.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS amount

            FROM users u

            INNER JOIN stokvel_members sm
                ON sm.user_id = u.user_id

            LEFT JOIN money_contributions mc
                ON mc.member_name = u.full_name

            WHERE sm.stokvel_id = ?

            GROUP BY
                u.user_id,
                u.full_name

            ORDER BY u.user_id
            `,
            [group?.stokvel_id || 1]
        );


        // Get total PAID contributions
        // for the current stokvel
        const [[contributions]] = await db.query(
            `
            SELECT
                COALESCE(SUM(mc.amount), 0) AS total

            FROM money_contributions mc

            INNER JOIN stokvel_members sm
                ON sm.user_id = (
                    SELECT u.user_id
                    FROM users u
                    WHERE u.full_name = mc.member_name
                    LIMIT 1
                )

            WHERE sm.stokvel_id = ?

            AND mc.payment_status = 'Paid'
            `,
            [group?.stokvel_id || 1]
        );


        res.json({

            group: group || {},

            members: members,

            contributionTotal:
                Number(contributions.total) || 0

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load member dashboard"
        });

    }

});


// ================================
// ADD CONTRIBUTION
// ================================

app.post(
    "/dashboard/contributions",
    async (req, res) => {

        try {

            const {
                card_id,
                member_name,
                amount
            } = req.body;


            // Check required information
            if (
                !card_id ||
                !member_name ||
                !amount
            ) {

                return res.status(400).json({

                    message:
                        "Card, member name and amount are required"

                });

            }


            // Make sure amount is positive
            if (Number(amount) <= 0) {

                return res.status(400).json({

                    message:
                        "Contribution amount must be greater than 0"

                });

            }


            const [result] = await db.query(
                `
                INSERT INTO money_contributions
                (
                    card_id,
                    member_name,
                    amount,
                    payment_status
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    'Paid'
                )
                `,
                [
                    card_id,
                    member_name,
                    amount
                ]
            );


            res.status(201).json({

                message:
                    "Contribution added",

                contribution_id:
                    result.insertId

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "Failed to add contribution"

            });

        }

    }
);


// ================================
// START SERVER
// ================================

const PORT =
    process.env.PORT || 4040;


app.listen(PORT, () => {

    console.log(
        `Server is running on http://localhost:${PORT}`
    );

});