// jwt
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// ids
function generateId(prefix = "id") {
  const r1 = Math.random().toString(36).slice(2, 10);
  const r2 = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${r1}${r2}`;
}

module.exports = {
    signAccessToken,
    verifyAccessToken,
    generateId,
};