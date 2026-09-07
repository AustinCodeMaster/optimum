require("dotenv").config(); //imports the dotenv package
const mariadb = require("mariadb");//imports the mariadb package we installed

const pool = mariadb.createPool({ //creates a connection pool. A pool manages database connections so the backend can resuse them
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    connectionLimit: 5  //allows upto 5 database connections at a time
});

module.exports = pool;