const express = require("express");
const cors = require("cors");
const env = require("./config/env");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const roomRoutes = require("./routes/room.routes");
const errorHandler = require("./middleware/middleware");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );

  app.use(express.json());

  app.use("/health", healthRoutes);
  app.use("/api/auth", authRoutes);
//   app.use("/api/rooms", roomRoutes);

//   app.use(errorHandler);

  return app;
}

module.exports = createApp;