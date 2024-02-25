const { Client } = require('pg');

const dbClient = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "1234",
    database: "APGSdb"
});

module.exports = dbClient;
