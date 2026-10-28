//we import to this file to use Express , MariaDB , JWT authentication, and RBAC
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

//this creates a separate router where you can define related API endpoints.
const router = express.Router();

router.post(   //creates the endpoint for recording a payment
    "/", 
    authenticateToken,  //checks the JWT
    authorizeRole("staff"),  //makes sure that only the staff can use it
    async (req, res) => {
        const {
            patient_name,
            doctor_name,
            lab_number,
            amount,
            payment_method,
            receipt_number,
            mpesa_transaction_number,
            date_received,
            received_type,
            request_id
        } = req.body;  //gets the paymnet details sent from postman or later from react

        //Check that the required fields are provided
        if (
            !amount ||
            !payment_method ||
            !date_received ||
            !received_type 
        ) {
            return res.status(400).json({
                 message: "Please provide all required fields"
            });
        }

        if (
            received_type !== "patient_payment" &&
            received_type !== "owner_funding"
        ) {
            return res.status(400).json({
                message: "Invalid received type"
            });
        }
        
        if (received_type === "patient_payment") {
         if (!patient_name || !doctor_name || !lab_number) {
        return res.status(400).json({
            message: "Patient name, doctor name and lab number are required"
            });
           }
        }
        //Amount must be greater that 0 and the amount is an integer
        if (!Number.isInteger(amount) || amount <=0) {
            return res.status(400).json({
                message: "Amount must be a positive integer"
            });
        }
        
        //Check that the payment method is valid
        if (payment_method !== "cash" && payment_method  !== "mpesa") {
            return res.status(400).json({
               message: "Payment method must be cash or mpesa"
            });
        }

        //Cash requires a receipt number and no mpesa transaction  number
        if (payment_method === "cash") {
            if(!receipt_number || mpesa_transaction_number) {
                return res.status(400).json({
                  message: "Cash requires a receipt number only"
                });
            }
        }

        //Mpesa  requires a transaction number and no  receipt number
        if(payment_method === "mpesa") {
            if(!mpesa_transaction_number || receipt_number) {
                return res.status(400).json({
                   message : "Mpesa requires transaction number only"
                });
            }
        }
        
        //insert into the database
        try {
            const result = await pool.query(
                `INSERT INTO received
                (
                   patient_name,
                   doctor_name,
                   lab_number,
                   amount,
                   payment_method,
                   receipt_number,
                   mpesa_transaction_number,
                   date_received,
                   user_id,
                   received_type,
                   request_id
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                   received_type === "patient_payment" ? patient_name : null,
                   received_type === "patient_payment" ? doctor_name : null,
                   received_type === "patient_payment" ? lab_number : null,
                   amount,
                   payment_method,
                   receipt_number || null,
                   mpesa_transaction_number || null,
                   date_received,
                   req.user.user_id, //records which loggedin staff user saved it
                   received_type,
                   request_id || null
                ]
            );

            res.status(201).json({  //201 means a new record was successfully created
                message: "Payment recorded successfully",
                received_id: Number(result.insertId) //gives you the ID of the new received payment
            });
        } catch(error) {
            console.error(error);
              if (
                error.code === "ER_DUP_ENTRY" &&
                error.errno === 1062 &&
                request_id
            ) {
                const rows = await pool.query(
                    `SELECT received_id
                     FROM received
                     WHERE request_id = ? AND user_id = ?`,
                    [request_id, req.user.user_id]
                );

                if (rows.length > 0) {
                    return res.status(200).json({
                        message: "Payment already recorded",
                        received_id: Number(rows[0].received_id)
                    });
                }
            }
            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// PATCH /api/received/:id - allows admin to correct a received payment
router.patch(
   "/:id",  // this is the id placeholder
   authenticateToken,
   authorizeRole("admin", "staff"),

   //this is the function that express runs whenever someone makes a request to that route
   async (req, res) => {

    //converst the receivedId into a  number from the URL
    const receivedId = Number(req.params.id);
    
    //check that the received payment ID is a valid positive integer
    if (!Number.isInteger(receivedId) || receivedId <= 0) {
        return res.status(400).json({
            message: "Invalid received payment ID"
        });
    }
    const {
      patient_name,
      doctor_name,
      lab_number,
      amount,
      payment_method,
      receipt_number,
      mpesa_transaction_number,
      date_received,
      received_type
      }  = req.body;

      //check that all required fields are provided
      if (
           !amount ||
           !payment_method ||
           !date_received ||
           !received_type
       ) {
        return res.status(400).json({
            message: "Please provide all the required fields"
        });
      }
       if (
            received_type !== "patient_payment" &&
            received_type !== "owner_funding"
          ) {
              return res.status(400).json({
               message: "Invalid received type"
        });
      }
              if (received_type === "patient_payment") {
    if (!patient_name || !doctor_name || !lab_number) {
        return res.status(400).json({
            message: "Patient name, doctor name and lab number are required"
        });
    }
}
      //validate the  amount
      if (!Number.isInteger(amount) || amount <=0) {
        return res.status(400).json({
            message : "Amount must be a positive integer"
        });
      }

      //validate the payment method
      if(payment_method !== "cash" && payment_method !== "mpesa") {
        return res.status(400).json({
            message: "Payment method must be cash or mpesa"
        });
      }

      //enusure that cash require receipt number and mpesa require transaction_number
      if(payment_method === "cash") {
        if(!receipt_number || mpesa_transaction_number) {
            return res.status(400).json({
                 message: "Cash requires receipt number only"
            });
        }
      }
      if(payment_method === "mpesa") {
        if(!mpesa_transaction_number || receipt_number) {
            return res.status(400).json({
                message: "Mpesa requires transaction number only"
            });
        }
      }
              let connection;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Lock the active payment while editing
            const rows = await connection.query(
                `SELECT * FROM received
                 WHERE received_id = ? AND deleted_at IS NULL
                 FOR UPDATE`,
                [receivedId]
            );

            if (rows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Received payment not found"
                });
            }

            const oldReceived = rows[0];

            // Staff can only edit payments they created
            if (
                req.user.role === "staff" &&
                oldReceived.user_id !== req.user.user_id
            ) {
                await connection.rollback();

                return res.status(403).json({
                    message: "You can only edit your own payments"
                });
            }

            await connection.query(
                `UPDATE received
                 SET patient_name = ?,
                     doctor_name = ?,
                     lab_number = ?,
                     amount = ?,
                     payment_method = ?,
                     receipt_number = ?,
                     mpesa_transaction_number = ?,
                     date_received = ?,
                     received_type = ?,
                     updated_at = NOW(),
                     updated_by = ?
                 WHERE received_id = ?
                   AND deleted_at IS NULL
                   AND (? = 'admin' OR user_id = ?)`,
                [
                    received_type === "patient_payment" ? patient_name : null,
                    received_type === "patient_payment" ? doctor_name : null,
                    received_type === "patient_payment" ? lab_number : null,
                    amount,
                    payment_method,
                    receipt_number || null,
                    mpesa_transaction_number || null,
                    date_received,
                    received_type,
                    req.user.user_id,
                    receivedId,
                    req.user.role,
                    req.user.user_id
                ]
            );

            // Read the saved values for the audit entry
            const updatedRows = await connection.query(
                `SELECT * FROM received WHERE received_id = ?`,
                [receivedId]
            );

            await connection.query(
                `INSERT INTO audit_log
                 (entity, entity_id, action, changed_by, old_values, new_values)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    "received",
                    receivedId,
                    "edit",
                    req.user.user_id,
                    JSON.stringify(oldReceived),
                    JSON.stringify(updatedRows[0])
                ]
            );

            // Save the payment change and audit entry together
            await connection.commit();

            return res.status(200).json({
                message: "Payment updated successfully"
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                    console.error("Payment update rollback failed");
                }
            }

            console.error(
                "Payment update failed",
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
// DELETE /api/received/:id - admin soft deletes a payment
router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {
        const receivedId = Number(req.params.id);

        if (!Number.isSafeInteger(receivedId) || receivedId <= 0) {
            return res.status(400).json({
                message: "Invalid received payment ID"
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

            // Lock the active payment during deletion
            const rows = await connection.query(
                `SELECT * FROM received
                 WHERE received_id = ? AND deleted_at IS NULL
                 FOR UPDATE`,
                [receivedId]
            );

            if (rows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Payment not found or already deleted"
                });
            }

            // Mark the payment as deleted without removing it
            const result = await connection.query(
                `UPDATE received
                 SET deleted_at = NOW(),
                     deleted_by = ?,
                     delete_reason = ?
                 WHERE received_id = ?
                   AND deleted_at IS NULL`,
                [req.user.user_id, deleteReason, receivedId]
            );

            if (result.affectedRows !== 1) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Payment not found or already deleted"
                });
            }

            // Save the audit entry in the same transaction
            await connection.query(
                `INSERT INTO audit_log
                 (entity, entity_id, action, changed_by, old_values, reason)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    "received",
                    receivedId,
                    "delete",
                    req.user.user_id,
                    JSON.stringify(rows[0]),
                    deleteReason
                ]
            );

            await connection.commit();

            return res.status(200).json({
                message: "Payment deleted successfully"
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                    console.error("Payment deletion rollback failed");
                }
            }

            console.error(
                "Payment deletion failed",
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