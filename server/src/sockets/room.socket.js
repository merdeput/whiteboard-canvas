const socketEvents = require("../constants/constants");
const whiteboardController = require("../controllers/whiteboard.controller");
const roomService = require("../services/room.service");

function registerRoomSocketHandlers(io, socket){
  socket.on(socketEvents.ROOM_JOIN, async (payload = {}) => {
    console.log("ROOM_JOIN payload:", payload);
    try {
      const { roomId, password } = payload;

      const room = await roomService.verifyRoomAccess({
        roomId,
        password,
      });

      socket.join(room.id);

      socket.emit(socketEvents.ROOM_JOINED, {
        room: roomService.sanitizeRoom(room),
      });
      console.log(
        `[room] ${socket.user.username} joined ${room.id}`
      );
      whiteboardController.emitWhiteboardState(socket, room.id);
    } catch (error) {
      socket.emit(socketEvents.ROOM_ERROR, {
        message: error.message || "Failed to join room",
      });
    }
  });
}
module.exports = registerRoomSocketHandlers
