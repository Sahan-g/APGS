const { Client } = require('pg');

const dbClient = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "1234",
    database: "APGS"
});


// const dbClient = new Client({
//     host: "34.69.240.11",
//     user: "postgres",
//     port: 5432,
//     password: "12345678",
//     database: "APGS"
// });

module.exports = dbClient;
