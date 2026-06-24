const http = require("http");
const { Server } = require("socket.io");

const createApp = require("./app");
const env = require("./config/env");
const registerSocketServer = require("./sockets");

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientOrigin,
    credentials: true,
  },
});

// registerSocketServer(io);

server.listen(env.port, () => {
  console.log(`HTTP + Socket server listening on port ${env.port}`);
});