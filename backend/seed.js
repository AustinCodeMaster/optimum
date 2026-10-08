require("dotenv").config();

const bcrypt = require("bcrypt"); // used to hash passwords
const pool = require("./db"); // imports the MariaDB connection pool

async function seedUsers() {
    try {
        // Convert the plain text passwords from .env into secure hashes
        const beatricePassword = await bcrypt.hash(
            process.env.BEATRICE_PASSWORD,
            10
        );

        const francisPassword = await bcrypt.hash(
            process.env.FRANCIS_PASSWORD,
            10
        );

        // Create staff account
        await pool.query(
            `INSERT INTO users (firstname, last_name, username, password, role)
             VALUES (?, ?, ?, ?, ?)`,
            [
                "Beatrice",
                "Secretary",
                "beatrice",
                beatricePassword,
                "staff"
            ]
        );

        // Create admin account
        await pool.query(
            `INSERT INTO users (firstname, last_name, username, password, role)
             VALUES (?, ?, ?, ?, ?)`,
            [
                "Francis",
                "Admin",
                "francis",
                francisPassword,
                "admin"
            ]
        );

        console.log("Users created successfully");

    } catch (error) {
        console.error(error);

    } finally {
        await pool.end();
    }
}

seedUsers();