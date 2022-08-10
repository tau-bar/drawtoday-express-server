const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

// get config vars
dotenv.config();

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "12h" });
}

module.exports = [generateAccessToken];
