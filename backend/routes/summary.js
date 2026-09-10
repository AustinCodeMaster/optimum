//Import express, MariaDB connection pool, JWT authenticationnand RBAC
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

//create express router
const router = express.Router();

//get /api/summary - reteives the financial summary
router.get(
    "/",
    authenticateToken,
    authorizeRole("staff", "admin"),
    async (req, res) => {
       try {

        //SUM(amount) adds all the amounts together 
        //COALESCE means if there are no records and SUM() is null use 0 instead
        //the pool.query sends the below sql to MariaDB and stores the result in rows
        const rows = await pool.query(`
            SELECT
            (SELECT COALESCE(SUM(amount), 0) FROM received) AS total_received,
            (SELECT COALESCE(SUM(amount), 0) FROM expense)  AS total_expenses
            `);

            const totalReceived = Number(rows[0].total_received);
            const totalExpenses = Number(rows[0].total_expenses);

            const currentBalance = totalReceived - totalExpenses;

            res.status(200).json({
                total_received: totalReceived,
                total_expenses: totalExpenses,
                current_balance: currentBalance
            });
       } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
        }
    }
    
);

module.exports = router;