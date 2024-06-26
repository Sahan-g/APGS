const { Pool } = require('pg');

const dbClient = new Pool({
    host: process.env.PG_HOST,
    user: "postgres",
    port: process.env.PG_PORT,
    password: process.env.PG_PASSWORD,
    database: "APGS",
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // return an error after 2 seconds if connection could not be established
});


// const dbClient = new Client({
//     host: "34.29.137.18",
//     user: "postgres",
//     port: 5432,
//     password: "12345678",
//     database: "APGS"
// });

module.exports = dbClient;
