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

             // Update the expense and save its audit entry together
        let connection;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Lock the active expense until this transaction finishes
            const rows = await connection.query(
                `SELECT * FROM expense
                 WHERE expense_id = ? AND deleted_at IS NULL
                 FOR UPDATE`,
                [expenseId]
            );

            if (rows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Expense not found"
                });
            }

            const oldExpense = rows[0];

            // Staff can only edit an expense they created
            if (
                req.user.role === "staff" &&
                oldExpense.user_id !== req.user.user_id
            ) {
                await connection.rollback();

                return res.status(403).json({
                    message: "You can only edit your own expenses"
                });
            }

            // Enforce ownership and deletion rules in the UPDATE too
            await connection.query(
                `UPDATE expense
                 SET amount = ?,
                     expenditure_type = ?,
                     description = ?,
                     destination = ?,
                     receipt_id = ?,
                     date_of_expense = ?,
                     updated_at = NOW(),
                     updated_by = ?
                 WHERE expense_id = ?
                   AND deleted_at IS NULL
                   AND (? = 'admin' OR user_id = ?)`,
                [
                    amount,
                    expenditure_type,
                    description,
                    destination || null,
                    receipt_id || null,
                    date_of_expense,
                    req.user.user_id,
                    expenseId,
                    req.user.role,
                    req.user.user_id
                ]
            );

            // Read the saved values for an accurate audit entry
            const updatedRows = await connection.query(
                `SELECT * FROM expense WHERE expense_id = ?`,
                [expenseId]
            );

            await connection.query(
                `INSERT INTO audit_log
                 (
                     entity,
                     entity_id,
                     action,
                     changed_by,
                     old_values,
                     new_values
                 )
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    "expense",
                    expenseId,
                    "edit",
                    req.user.user_id,
                    JSON.stringify(oldExpense),
                    JSON.stringify(updatedRows[0])
                ]
            );

            // Save both the expense change and audit entry
            await connection.commit();

            return res.status(200).json({
                message: "Expense updated successfully"
            });
        } catch (error) {
            // Undo the expense change if any database operation failed
            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                    console.error("Expense update rollback failed");
                }
            }

            console.error(
                "Expense update failed",
                error.code || "UNKNOWN_ERROR"
            );

            return res.status(500).json({
                message: "Server error"
            });
        } finally {
            // Always return the connection to the pool
            if (connection) {
                await connection.release();
            }
        }
    }
);

// DELETE /api/expense/:id - admin soft deletes an expense
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {
        const expenseId = Number(req.params.id);

        if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
            return res.status(400).json({
                message: "Invalid expense ID"
            });
        }

        const reason = req.body?.reason;

        if (
            typeof reason !== "string" ||
            reason.trim().length === 0 ||
            reason.trim().length > 255
        ) {
            return res.status(400).json({
                message: "A reason between 1 and 255 characters is required"
            });
        }

        const deleteReason = reason.trim();
        let connection;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Lock the active expense during deletion
            const rows = await connection.query(
                `SELECT * FROM expense
                 WHERE expense_id = ? AND deleted_at IS NULL
                 FOR UPDATE`,
                [expenseId]
            );

            if (rows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Expense not found or already deleted"
                });
            }

            // Mark the expense as deleted without removing it
            const result = await connection.query(
                `UPDATE expense
                 SET deleted_at = NOW(),
                     deleted_by = ?,
                     delete_reason = ?
                 WHERE expense_id = ?
                   AND deleted_at IS NULL`,
                [req.user.user_id, deleteReason, expenseId]
            );

            if (result.affectedRows !== 1) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Expense not found or already deleted"
                });
            }

            // Save the audit entry in the same transaction
            await connection.query(
                `INSERT INTO audit_log
                 (entity, entity_id, action, changed_by, old_values, reason)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    "expense",
                    expenseId,
                    "delete",
                    req.user.user_id,
                    JSON.stringify(rows[0]),
                    deleteReason
                ]
            );

            await connection.commit();

            return res.status(200).json({
                message: "Expense deleted successfully"
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                    console.error("Expense deletion rollback failed");
                }
            }

            console.error(
                "Expense deletion failed",
                error.code || "UNKNOWN_ERROR"
            );

            return res.status(500).json({
                message: "Server error"
            });
        } finally {
            if (connection) {
                await connection.release();
            }
        }
    }
);
module.exports = router;