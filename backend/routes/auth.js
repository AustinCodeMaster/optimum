const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");

const router = express.Router();

router.post("/login", async (req,res) =>{
   const {username, password } = req.body;

   try {
    const rows = await pool.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
    );

    if (rows.length === 0) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }
    const user = rows[0];

    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    res.json({
            message: "Login successful",
            user_id: user.user_id,
            username: user.username,
            role: user.role
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
   }
});

module.exports = router;