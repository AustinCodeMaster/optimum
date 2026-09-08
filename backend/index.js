const authRoutes = require("./routes/auth");
const express = require("express"); //Import the express package
const pool = require("./db");

const app = express();  // create the application


app.use(express.json());// enables express to read JSON
app.use("/api/auth", authRoutes);
//app.get() when a get request is made to this path,run this function
app.get("/", (req,res) => {
    res.send("Optimum Diagnostocs API is running");
});

app.get("/db-test", async (req,res) =>{
      try{
        const rows = await pool.query("SELECT 1 AS result");
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).send("Database connection failed");
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});