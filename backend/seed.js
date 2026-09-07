const bcrypt = require("bcrypt"); //used to has passwords
const pool = require("./db"); //imports the mariaDB connection pool from db.js
//async function allows users to await for operations that take time such as hashing password & communicating with the db
async function seedUsers() {
    try{
        //bcrypt.hash() converts each plain text password into a secure hash
        const maryPassword = await bcrypt.hash(process.env.MARY_PASSWORD, 10);
        const dadPassword = await bcrypt.hash(process.env.DAD_PASSWORD, 10);
        //insert into the database
        await pool.query(
            `INSERT INTO users (firstname, last_name, username, password, role)
            VALUES (?, ?, ?, ?, ?)`,
            ["Mary", "Secretary", "mary", maryPassword, "staff"]
        );

        await pool.query(
            `INSERT INTO users (firstname, last_name, username, password, role)
             VALUES (?, ?, ?, ?, ?)`,
             ["Doctor", "Admin", "dad", dadPassword, "admin"]
        );
        console.log("Users created successfully");
    }catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

seedUsers(); // calls the function seedUsers to execute it