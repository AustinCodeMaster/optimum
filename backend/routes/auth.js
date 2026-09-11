//import packages needed for authentication
//this file handles user login by verifyinh credentials,generating a JWT and return the users details
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");

//create an express router for authentication routes
const router = express.Router();

//handle POST requests to /api/auth/login
router.post("/login", async (req,res) =>{

    // Get th username and password sent in the request body
   const {username, password } = req.body;

   try {
    //search the database for a user with the provided username
    const rows = await pool.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
    );
    
    // Return an error if the username does not exist
    if (rows.length === 0) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    //GET the first user returned by the database
    const user = rows[0];
    
    //Compare the entered password with the stored bcrypt hash
    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    //return an error if the password is incorrect
    if (!passwordMatch) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }
    
    //Generate a signed JWT containing the user's ID and role
    //The token expries after one hour
    const token = jwt.sign(
        {
            user_id: user.user_id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h"}
    );
    
    res.json({
            message: "Login successful",
            token: token,
            user: {
                user_id: user.user_id,
                firstname: user.firstname,
                last_name: user.last_name,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
   }
});

//export the router so it can be used in index.js
module.exports = router;