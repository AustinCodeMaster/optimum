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
            request_id
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
                  user_id,
                  request_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    amount,
                    expenditure_type,
                    description,
                    destination || null,
                    receipt_id || null,
                    date_of_expense,
                    req.user.user_id,
                    request_id || null
                ]
            );

            res.status(201).json({
                message: "Expense recorded successfully",
                expense_id: Number(result.insertId)
            });
        } catch (error) {
            console.error(error);

            if (
                error.code === "ER_DUP_ENTRY" &&
                error.errno === 1062 &&
                request_id
            ) {
                const rows = await pool.query(
                    `SELECT expense_id
                     FROM expense
                     WHERE request_id = ? AND user_id = ?`,
                    [request_id, req.user.user_id]
                );

                if (rows.length > 0) {
                    return res.status(200).json({
                        message: "Expense already recorded",
                        expense_id: Number(rows[0].expense_id)
                    });
                }
            }

            res.status(500).json({
                message: "Server error"
            });
        }
    }

);

//PATCH /api/expense/:id this allows admin to correct an expense
router.patch(
    "/:id",
    authenticateToken,
    authorizeRole("admin", "staff"),
    async (req, res) => {

        //gets the expenseId from the URL and converts it to a number
        const expenseId = Number(req.params.id);

        //Check that expense ID is a valid positive integer
        if (!Number.isInteger(expenseId)  || expenseId <= 0) {
            return res.status(400).json({
                message: "Invalid expense ID"
            });
        }

        const {
            amount,
            expenditure_type,
            description,
            destination,
            receipt_id,
            date_of_expense
        }  = req.body  //this contains the data that was sent tp our API in the request body

        //check all required fileds are provided
        if (
            !amount ||
            !expenditure_type ||
            !description ||
            !date_of_expense
        ) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
        }

        //vaidate the amount it must be a positve integer
        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive integer"
            });
        }

        //validate the expenditure type
        if (
            expenditure_type !== "transport" &&
            expenditure_type !== "supplies" &&
            expenditure_type !== "other"
        ) {
            return res.status(400).json({
                message: "Expenditure type must be trnasport, Supplies, or other"
            });
        }

        // transport requires a destination and no recipt Id
        if (expenditure_type === "transport") {
            if(!destination || receipt_id) {
                return res.status(400).json({
                    message: "Transport requires a destination only"
                });
            }
        }
        
        // suplies requires a recepit id only not destination
        if(expenditure_type === "supplies") {
            if(!receipt_id || destination) {
                return res.status(400).json({
                   message: "Supplies requires a receipt_id only"
             });
            }
        }

        //other must not have a destination
        //A receipt ID is optional
        if (expenditure_type === "other") {
            if (destination) {
                return res.status(400).json({
                    message: "Other expenses must not have a destination"
                });
            }
        }

        // UPDATE expense query
                try {
            const rows = await pool.query(
                `SELECT * FROM expense
                 WHERE expense_id = ? AND deleted_at IS NULL`,
                [expenseId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    message: "Expense not found"
                });
            }

            const oldExpense = rows[0];

            if (req.user.role === "staff" && oldExpense.user_id !== req.user.user_id) {
                return res.status(403).json({
                    message: "You can only edit your own expenses"
                });
            }

            const result = await pool.query(
                `UPDATE expense
                SET amount = ?,
                    expenditure_type = ?,
                    description = ?,
                    destination = ?,
                    receipt_id = ?,
                    date_of_expense = ?,
                    updated_at = NOW(),
                    updated_by = ?
                WHERE expense_id = ? `,

                [
                    amount,
                    expenditure_type,
                    description,
                    destination || null,
                    receipt_id || null,
                    date_of_expense,
                    req.user.user_id,
                    expenseId
                ]
            );
            //check whether the expesnse actually exists
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Expense not found"
                });
            }
           //record the edit in the audit log
           await pool.query(
             `INSERT INTO audit_log
             (entity, entity_id, action, changed_by, old_values, new_values)
             VALUES (?, ?, ?, ?, ?, ?)`,
             [
                "expense",
                 expenseId,
                 "edit",
                 req.user.user_id,
                 JSON.stringify(oldExpense),
                 JSON.stringify({
                        amount,
                        expenditure_type,
                        description,
                        destination: destination || null,
                        receipt_id: receipt_id || null,
                        date_of_expense
                    })
             ]
           );
           
            //succesaful correction
            res.status(200).json({
                message: "Expense updated successfully"
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