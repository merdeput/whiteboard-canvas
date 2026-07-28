const socketEvents = require("../constants/constants");
const whiteboardService = require("../services/whiteboard.service");

function handleDrawObject(socket, payload = {}) {
  const { roomId, object } = payload;
  const storedObject = whiteboardService.addObjectToWhiteboard({
    socket,
    roomId,
    object,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECT_CREATED, {
    roomId,
    object: storedObject,
  });
}

function handleUpdateObject(socket, payload = {}) {
  const { roomId, object } = payload;
  const storedObject = whiteboardService.updateObjectInWhiteboard({
    socket,
    roomId,
    object,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECT_UPDATED, {
    roomId,
    object: storedObject,
  });
}

function handleDeleteObjects(socket, payload = {}) {
  const { roomId, objectIds } = payload;
  const deleted = whiteboardService.deleteObjectsFromWhiteboard({
    socket,
    roomId,
    objectIds,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECTS_DELETED, deleted);
}

function handleClearWhiteboard(socket, payload = {}) {
  const { roomId } = payload;

  whiteboardService.clearWhiteboard({
    socket,
    roomId,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_CLEARED, {
    roomId,
  });
}

function emitWhiteboardState(socket, roomId) {
  const whiteboardState = whiteboardService.getWhiteboardState(roomId);
  socket.emit(socketEvents.WHITEBOARD_STATE, whiteboardState);
}

module.exports = {
  handleDrawObject,
  handleUpdateObject,
  handleDeleteObjects,
  handleClearWhiteboard,
  emitWhiteboardState,
};
