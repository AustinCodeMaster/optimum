require("dotenv").config();

const express = require("express"); //Import the express package
const cors = require("cors");//import used for cors to allow the frontend to communicate with the backend

//These were mainly used for testing directly inside index.js
//const pool = require("./db");
//const authenticateToken = require("./middleware/authMiddleware");
//const authorizeRole = require("./middleware/roleMiddleware");

const authRoutes = require("./routes/auth");
const receivedRoutes = require("./routes/received");
const expenseRoutes = require("./routes/expense");
const transactionRoutes = require("./routes/transactions");
const summaryRoutes = require("./routes/summary");

const app = express();  // create the application

app.use(cors()); //tells express to allows browers requests comming from another origin
app.use(express.json());// enables express to read JSON sent in requests

// the real API routes
app.use("/api/expense", expenseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/received", receivedRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/summary", summaryRoutes );

//app.get() when a get request is made to this path,run this function
//also used to confirm that the API is running
app.get("/", (req,res) => {
    res.send("Optimum Diagnostics API is running");
});

//--------------------OLD TEST ROUTES-------------------

//Test database connection
// app.get("/db-test", async (req,res) =>{
//       try{
//         const rows = await pool.query("SELECT 1 AS result");
//         res.json(rows);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send("Database connection failed");
//     }
// });

//Temporary route to test JWT authentication
// app.get("/api/protected", authenticateToken, (req,res) =>{
//     res.json({
//         message: "You have access to this protected route",
//         user: req.user
//     });
// });

// //Temporary route to test admin-only access
// app.get(
//     "/api/admin-test",
//     authenticateToken,
//     authorizeRole("admin"),
//     (req,res) => {
//         res.json({
//             message: "Welcome Admin",
//             user: req.user
//         });
//     }
//);

// app.listen() starts the server on a port
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});