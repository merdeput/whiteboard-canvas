const dotenv = require("dotenv");

dotenv.config();

function parseClientOrigins(value) {
  return (value || "http://localhost:5173")
    .split(",")
    .map((origin) =>
      origin
        .trim()
        .replace(/^['"]|['"]$/g, "")
        .replace(/\/+$/g, "")
    )
    .filter(Boolean);
}

module.exports = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigins: parseClientOrigins(process.env.CLIENT_ORIGIN),
  jwtSecret: process.env.JWT_SECRET || "wahwahwahwahawhawhhawhahw",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mongodbUri: process.env.MONGODB_URI || "",
};
