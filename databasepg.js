const { Client } = require('pg');

const dbClient = new Client({
    host: process.env.PG_HOST,
    user: "postgres",
    port: process.env.PG_PORT,
    password: process.env.PG_PASSWORD,
    database: "APGS"
});


// const dbClient = new Client({
//     host: "34.29.137.18",
//     user: "postgres",
//     port: 5432,
//     password: "12345678",
//     database: "APGS"
// });

module.exports = dbClient;
