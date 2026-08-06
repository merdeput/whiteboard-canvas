const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "wahwahwahwahawhawhhawhahw",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mongodbUri: process.env.MONGODB_URI || "",
};
