const dotenv = require("dotenv");

// get config vars
dotenv.config();

const db = require("knex")({
  client: "mysql",
  connection: {
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_ID,
  },
});

module.exports = db;
