const socketEvents = require("../constants/constants");
const roomService = require("../services/room.service");
const whiteboardsStore = require("../stores/whiteboards.store");

function registerRoomSocketHandlers(io, socket){
  socket.on(socketEvents.ROOM_JOIN, async (payload = {}) => {
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
      const whiteboardState = whiteboardsStore.getWhiteboardState(room.id);

      socket.emit(socketEvents.WHITEBOARD_STATE, whiteboardState);
    } catch (error) {
      socket.emit(socketEvents.ROOM_ERROR, {
        message: error.message || "Failed to join room",
      });
    }
  });
}
module.exports = registerRoomSocketHandlers