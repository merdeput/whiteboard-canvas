const socketEvents = require("../constants/constants");
const whiteboardController = require("../controllers/whiteboard.controller");
const roomService = require("../services/room.service");

function registerRoomSocketHandlers(io, socket){
  socket.on(socketEvents.ROOM_JOIN, async (payload = {}) => {
    try {
      const { roomId, password } = payload;

      const room = await roomService.verifyRoomAccess({
        roomId,
        password,
      });

      socket.join(room.id);
      const roomWithParticipant = roomService.addParticipant({
        roomId: room.id,
        socketId: socket.id,
        identity: socket.identity,
      });

      socket.emit(socketEvents.ROOM_JOINED, {
        room: roomService.sanitizeRoom(roomWithParticipant),
      });
      console.log(
        `[room] ${socket.identity.displayName} (${socket.identity.role}) joined ${room.id}`
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
