// Imports Express, database connection, authentication middleware and role middleware
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();

// GET /api/statement
// Generates statement data based on the selected filters
router.get(
    "/",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {

        // Read filters sent in the URL
        const {
            type,
            start_date,
            end_date,
            payment_method,
            expenditure_type,
            search
        } = req.query;

        // Validate transaction type
        if (
            type &&
            type !== "received" &&
            type !== "expense"
        ) {
            return res.status(400).json({
                message: "Invalid transaction type"
            });
        }

        // Validate payment method
        if (
            payment_method &&
            payment_method !== "cash" &&
            payment_method !== "mpesa"
        ) {
            return res.status(400).json({
                message: "Invalid payment method"
            });
        }

        // Validate expenditure type
        if (
            expenditure_type &&
            expenditure_type !== "transport" &&
            expenditure_type !== "supplies" &&
            expenditure_type !== "other"
        ) {
            return res.status(400).json({
                message: "Invalid expenditure type"
            });
        }

        // Validate start date format
        if (
            start_date &&
            !/^\d{4}-\d{2}-\d{2}$/.test(start_date)
        ) {
            return res.status(400).json({
                message: "Invalid start date"
            });
        }

        // Validate end date format
        if (
            end_date &&
            !/^\d{4}-\d{2}-\d{2}$/.test(end_date)
        ) {
            return res.status(400).json({
                message: "Invalid end date"
            });
        }

        // Make sure start date does not come after end date
        if (
            start_date &&
            end_date &&
            start_date > end_date
        ) {
            return res.status(400).json({
                message: "Start date cannot be after end date"
            });
        }

        try {

            // Start with all transactions from the transaction_history view
            let sql = `
                SELECT * FROM transaction_history
                WHERE 1 = 1
            `;

            // Holds values that will safely replace ? placeholders in SQL
            const params = [];

            // Filter by transaction type
            if (type) {
                sql += " AND type = ?";
                params.push(type);
            }

            // Filter by start date
            if (start_date) {
                sql += " AND transaction_date >= ?";
                params.push(start_date);
            }

            // Filter by end date
            if (end_date) {
                sql += " AND transaction_date <= ?";
                params.push(end_date);
            }

            // Filter by payment method
            if (payment_method) {
                sql += " AND payment_method = ?";
                params.push(payment_method);
            }

            // Filter by expenditure type
            if (expenditure_type) {
                sql += " AND expenditure_type = ?";
                params.push(expenditure_type);
            }

            // Search across transaction details
            if (search) {
                sql += ` AND (
                    patient_name LIKE ?
                    OR doctor_name LIKE ?
                    OR lab_number LIKE ?
                    OR receipt_number LIKE ?
                    OR mpesa_transaction_number LIKE ?
                    OR description LIKE ?
                    OR destination LIKE ?
                    OR receipt_id LIKE ?
                )`;

                const searchValue = `%${search}%`;

                params.push(
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue,
                    searchValue
                );
            }

            // Sort statement transactions from oldest to newest
            // No LIMIT or OFFSET because statement must contain all matching transactions
            sql += `
                ORDER BY transaction_date ASC, created_at ASC
            `;

            // Execute the query
            const rows = await pool.query(sql, params);

            // Variables used to calculate statement totals
            let totalReceived = 0;
            let totalExpenses = 0;

            // Go through every matching transaction
            rows.forEach(transaction => {

                // Add received payments to total received
                if (transaction.type === "received") {
                    totalReceived += Number(transaction.amount);
                }

                // Add expenses to total expenses
                if (transaction.type === "expense") {
                    totalExpenses += Number(transaction.amount);
                }
            });

            // Calculate the net amount for this statement
            const netAmount = totalReceived - totalExpenses;

            // Send all statement data back to the frontend
            res.status(200).json({
                transactions: rows,
                total_received: totalReceived,
                total_expenses: totalExpenses,
                net_amount: netAmount
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