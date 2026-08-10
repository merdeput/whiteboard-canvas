const http = require("http");
const { Server } = require("socket.io");

const createApp = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const env = require("./config/env");
const registerSocketServer = require("./sockets");

let isShuttingDown = false;

function closeHttpServer(server) {
  if (!server || !server.listening) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function closeSocketServer(io) {
  if (!io) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    io.close(() => resolve());
  });
}

async function shutdown(signal, { server, io }) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[server] shutting down (${signal})`);

  try {
    await closeSocketServer(io);
    await closeHttpServer(server);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error(`[server] shutdown failed: ${error.message}`);
    process.exit(1);
  }
}

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigins,
      credentials: true,
    },
  });

  registerSocketServer(io);

  process.on("SIGINT", () => {
    void shutdown("SIGINT", { server, io });
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM", { server, io });
  });

  await new Promise((resolve, reject) => {
    server.listen(env.port, (error) => {
      if (error) {
        reject(error);
        return;
      }

      console.log(`HTTP + Socket server listening on port ${env.port}`);
      resolve();
    });
  });
}

bootstrap().catch(async (error) => {
  console.error(`[server] startup failed: ${error.message}`);

  try {
    await disconnectDatabase();
  } finally {
    process.exit(1);
  }
});
