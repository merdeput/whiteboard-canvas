const socketEvents = require("../constants/constants");
const roomsStore = require("../stores/rooms.store");
const whiteboardsStore = require("../stores/whiteboards.store");

function registerWhiteboardSocketHandlers(io, socket){
  socket.on(socketEvents.WHITEBOARD_DRAW_PATH, (payload = {}) => {
    try {
      const { roomId, object } = payload;

      if (!roomId) {
        socket.emit(socketEvents.ROOM_ERROR, {
          message: "roomId is required",
        });
        return;
      }

      if (!object || typeof object !== "object") {
        socket.emit(socketEvents.ROOM_ERROR, {
          message: "whiteboard object is required",
        });
        return;
      }

      if (!socket.room.has(roomId)) {
        socket.emit(socketEvents.ROOM_ERROR, {
          message: "Error",
        });
        return;
      }

      const room = roomsStore.findRoomById(roomId);
      if (!room) {
        socket.emit(socketEvents.ROOM_ERROR, {
          message: "Room not found",
        });
        return;
      }

      // Persist to in-memory whiteboard state
      whiteboardsStore.addObjectToWhiteboard(roomId, object);

      // Broadcast to everyone else in the room
      socket.to(roomId).emit(socketEvents.WHITEBOARD_PATH_CREATED, {
        roomId,
        object,
      });
      console.log(
        `[draw] ${socket.user.username} -> ${roomId}`
      );
    } catch (error) {
      socket.emit(socketEvents.ROOM_ERROR, {
        message: "Failed to process whiteboard draw event",
      });
    }
  });
}

module.exports = registerWhiteboardSocketHandlers