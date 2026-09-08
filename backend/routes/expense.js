//this prepares the expense route file to use Express,MariaDB,JWT authentication, and RBAC
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/", //the base url where this router is mounted
    authenticateToken,
    authorizeRole("staff"),
    async (req, res) => {
        const {
            amount,
            expenditure_type,
            description,
            destination,
            receipt_id,
            date_of_expense,
        } = req.body;   //gets the expense details by the client
        if (
            !amount ||
            ! expenditure_type ||
            ! description ||
            !date_of_expense
        ) {
            return res.status(400).json({
                message: "please provide all the required fields"
            });
        }

        // Validate the Amount is an integer and the amount is not o or less
        if(!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive Integer"
            });
        }

        //Validate the category to ensure one can submit one of the three categories
        if (
            expenditure_type !== "transport" &&
            expenditure_type !== "supplies" &&
            expenditure_type !== "other"
        ) {
            return res.status(400).json({
               message: "Expenditure type must be transport, supplies, or other"
            });
        }

        //validate destination and receipt ID
        if (expenditure_type === "transport") {
            if(!destination || receipt_id) {
                return res.status(400).json({
                   message: "Transport requires a destination only"
                });
            }
        }

        if (expenditure_type === "supplies") {
            if (!receipt_id || destination) {
                return res.status(400).json({
                    message: "Supplies require a receipt ID only"
                });
            }
        }

        if (expenditure_type === "other") {
            if(destination) {
                return res.status(400).json({
                    message: "Other expenses must not have a destination"
                });
            }
        }

        //insert into the database
        try {
            const result = await pool.query(
                `INSERT INTO expense
                (
                  amount,
                  expenditure_type,
                  description,
                  destination,
                  receipt_id,
                  date_of_expense,
                  user_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    amount,
                    expenditure_type,
                    description,
                    destination || null,
                    receipt_id || null,
                    date_of_expense,
                    req.user.user_id
                ]
            );

            res.status(201).json({
                message: "Expense recorded successfully",
                expense_id: Number(result.insertId)
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