//This imports prepares the router to use express,MariaDB, JWT authentication and RBAC
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

const router = express.Router();

//GET/api/transactions which reads records from the transaction history database view
router.get(
    "/", // creates the endpoint for retreiving transactions
    authenticateToken,
    authorizeRole("staff","admin"),
    async (req, res) => {
        
        //req.query is used to read the filter values sent in the URL
        //they are called query parameter start_date end_date payment_method etc
         const { type, 
                 start_date, 
                 end_date, 
                 payment_method, 
                 expenditure_type,
                 search,
                 page

          } =req.query;  

          //validate transaction type
          if (type && type !== "received" && type !=="expense") {
              return res.status(400).json({
                message: "Invalid transaction type"
              });
          }

          //validate payment method
          if(
            payment_method &&
            payment_method !== "cash" &&
            payment_method !== "mpesa"
          ) {
            return res.status(400).json({
                message: "Invalid payment method"
            });
          }
          
          //validate expenditure type
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

          //validate start_date
          if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
            return res.status(400).json({
                message: "Invalid start date"
            });
          }

          //validate end date
          if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
             return res.status(400).json({
                 message: "Invalid end date"
            });
          }

          //make sure the start date is not after the end date
          if (start_date && end_date && start_date > end_date) {
             return res.status(400).json({
                 message: "Start date cannot be after end date"
            });
          }
          //convert the page query parameter into a number.
          //If no page is provided, default to page 1
          const requestedPage = Number(page);

          //check that the page is a positive integer
          //if it is invalid use page 1 instead
          const pageNumber =
                Number.isInteger(requestedPage) && requestedPage > 0
                ? requestedPage
                : 1;

          // set the maximum number of transactions returned per page.
          const limit = 10;

          //calculate how many records the database should skip.
          const offset = (pageNumber - 1) * limit;

        try {
              //sql query reads from transaction_hisory view 
                let sql = `
                   SELECT * FROM transaction_history
                   WHERE 1 = 1
                 `;

                 const params = [];  //create an empty parameter array that will hold the values that we want to safely pass into SQL query
                 
                 //if the user supplied a transaction type, add a conditio  to the SQL
                 if (type) {
                    sql += " AND type = ?";
                    params.push(type);  //If we select lets say expense it adds it to the array expense above
                 }
                
                 // filter by the start date
                 if (start_date) {
                    sql += " AND transaction_date >= ?";
                    params.push(start_date);
                 }

                 //filter by end date
                 if (end_date) {
                    sql += " AND transaction_date <= ?";
                    params.push(end_date);
                 }

                 //filter for the payment method
                 if (payment_method) {
                    sql += " AND payment_method = ?";
                    params.push(payment_method);
                 }
                 
                 //filter by the expenditure tyoe
                 if (expenditure_type) {
                    sql += " AND expenditure_type = ?";
                    params.push(expenditure_type);
                 }

                 //filter by search
                 //LIKE allows MARIADB to search for a text rather than requiring an exact match
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
                
                 //count how many transactions match the above filters
                 const countSql = sql.replace(
                    "SELECT * FROM transaction_history",
                    "SELECT COUNT(*) AS total FROM transaction_history"
                 );

                 const countRows = await pool.query(countSql, params);

                 const totalRecords = Number(countRows[0].total);

                 //calculate the total number of pages

                 const totalPages = Math.ceil(totalRecords / limit);
                //Sort the transactions from newest to oldest
                //limit the record retuned and the offest controlls how many records are skipped
                 sql += " ORDER BY transaction_date DESC, created_at DESC LIMIT ? OFFSET ?";  ///sort the transactions

                 //Add the pagination values to the parameter array
                 params.push(limit, offset);

                 const rows = await pool.query(sql, params);  //extecute the query




            res.status(200).json({
                data: rows,
                pagination: {
                    currentPage: pageNumber,
                    limit: limit,
                    totalRecords: totalRecords,
                    totalPages: totalPages
                }
            });  // sends the results back to the client

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message : "Server error"
            });
        }
    }
);
module.exports =  router;