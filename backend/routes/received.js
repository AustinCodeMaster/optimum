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
            date_received
        } = req.body;  //gets the paymnet details sent from postman or later from react

        //Check that the required fields are provided
        if (
            !patient_name ||
            !doctor_name ||
            !lab_number ||
            !amount ||
            !payment_method ||
            !date_received  
        ) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
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
                   user_id
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    patient_name,
                    doctor_name,
                    lab_number,
                    amount,
                    payment_method,
                    receipt_number || null,
                    mpesa_transaction_number || null,
                    date_received,
                    req.user.user_id  //records which loggedin staff user saved it
                ]
            );

            res.status(201).json({  //201 means a new record was successfully created
                message: "Payment recorded successfully",
                received_id: Number(result.insertId) //gives you the ID of the new received payment
            });
        } catch(error) {
            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

module.exports = router