const socketEvents = require("../constants/constants");
const whiteboardController = require("../controllers/whiteboard.controller");

function registerWhiteboardSocketHandlers(io, socket){
  socket.on(socketEvents.WHITEBOARD_DRAW_OBJECT, async (payload = {}) => {
    try {
      const { roomId } = payload;
      await whiteboardController.handleDrawObject(socket, payload);
      console.log(
        `[draw-object] ${socket.identity.displayName} (${socket.identity.role}) -> ${roomId}`
      );
    } catch (error) {
      socket.emit(socketEvents.ROOM_ERROR, {
        message: error.message || "Failed to process whiteboard object event",
      });
    }
  });

  socket.on(socketEvents.WHITEBOARD_UPDATE_OBJECT, async (payload = {}) => {
    try {
      const { roomId } = payload;
      await whiteboardController.handleUpdateObject(socket, payload);
      console.log(
        `[update-object] ${socket.identity.displayName} (${socket.identity.role}) -> ${roomId}`
      );
    } catch (error) {
      socket.emit(socketEvents.ROOM_ERROR, {
        message: error.message || "Failed to process whiteboard object update",
      });
    }
  });

  socket.on(socketEvents.WHITEBOARD_DELETE_OBJECTS, async (payload = {}) => {
    try {
      const { roomId } = payload;
      await whiteboardController.handleDeleteObjects(socket, payload);
      console.log(
        `[delete-objects] ${socket.identity.displayName} (${socket.identity.role}) -> ${roomId}`
      );
    } catch (error) {
      socket.emit(socketEvents.ROOM_ERROR, {
        message: error.message || "Failed to delete whiteboard objects",
      });
    }
  });

  socket.on(socketEvents.WHITEBOARD_CLEAR, async (payload = {}) => {
    try {
      const { roomId } = payload;
      await whiteboardController.handleClearWhiteboard(socket, payload);
      console.log(
        `[clear] ${socket.identity.displayName} (${socket.identity.role}) -> ${roomId}`
      );
    } catch (error) {
      socket.emit(socketEvents.ROOM_ERROR, {
        message: error.message || "Failed to clear whiteboard",
      });
    }
  });
}

module.exports = registerWhiteboardSocketHandlers
