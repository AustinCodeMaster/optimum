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

// PATCH /api/received/:id - allows admin to correct a received payment
router.patch(
   "/:id",  // this is the id placeholder
   authenticateToken,
   authorizeRole("admin"),

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
      date_received
      }  = req.body;

      //check that all required fields are provided
      if (
        !patient_name ||
        !doctor_name ||
        !lab_number ||
        !amount ||
        !payment_method ||
        !date_received
      ) {
        return res.status(400).json({
            message: "Please provide all the required fields"
        });
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
      try {
        const result = await pool.query(
           `UPDATE received
            SET patient_name = ?,
                doctor_name = ?,
                lab_number = ?,
                amount = ?,
                payment_method = ?,
                receipt_number = ?,
                mpesa_transaction_number = ?,
                date_received = ?
            WHERE received_id = ?`,
            [
                patient_name,
                doctor_name,
                lab_number,
                amount,
                payment_method,
                receipt_number || null,
                mpesa_transaction_number || null,
                date_received,
                receivedId
            ] 
        );
        
        // If no record was updated, the received payment ID does not exist
        //affectedRows tells us how many rows the UPDATE affected
        if(result.affectedRows === 0) {
            return res.status(404).json({
                message: "Received payment not found"
            });
        }

        //send success response
        res.status(200).json({
            message: "Payment updated successfully"
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error"
        });
      }
   }   
);

module.exports = router;