const registerSocketAuth = require("./auth.socket");
const registerRoomSocketHandlers = require("./room.socket");
const registerWhiteboardSocketHandlers = require("./whiteboard.socket");
const roomService = require("../services/room.service");

function registerSocketServer(io) {
  registerSocketAuth(io);

  io.on("connection", (socket) => {
    console.log(
      `[socket] connected: ${socket.id} identity=${socket.identity?.displayName || "unknown"}:${socket.identity?.role || "unknown"}`
    );

    registerRoomSocketHandlers(io, socket);
    registerWhiteboardSocketHandlers(io, socket);

    socket.on("disconnect", () => {
      const deletedRoomIds = roomService.handleSocketDisconnect(socket.id);
      console.log(`[socket] disconnected: ${socket.id}`);

      if (deletedRoomIds.length) {
        console.log(`[room] deleted empty rooms: ${deletedRoomIds.join(", ")}`);
      }
    });
  });
}

module.exports = registerSocketServer;
