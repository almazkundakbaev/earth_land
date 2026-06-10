const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { config } = require("../config");

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createToken(user) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    {
      subject: user.id,
      expiresIn: config.jwtExpiresIn,
    },
  );
}

module.exports = { hashPassword, verifyPassword, createToken };
