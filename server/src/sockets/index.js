const registerSocketAuth = require("./auth.socket");
const registerRoomSocketHandlers = require("./room.socket");
const registerWhiteboardSocketHandlers = require("./whiteboard.socket");

function registerSocketServer(io) {
  registerSocketAuth(io);

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id} user=${socket.user?.username || "unknown"}`);

    registerRoomSocketHandlers(io, socket);
    registerWhiteboardSocketHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerSocketServer;