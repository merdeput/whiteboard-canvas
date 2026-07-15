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
  const updatedObject = whiteboardService.updateObjectInWhiteboard({
    socket,
    roomId,
    object,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECT_UPDATED, {
    roomId,
    object: updatedObject,
  });
}

function handleDeleteObjects(socket, payload = {}) {
  const { roomId, objectIds } = payload;
  const deletedObjectIds = whiteboardService.deleteObjectsFromWhiteboard({
    socket,
    roomId,
    objectIds,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECTS_DELETED, {
    roomId,
    objectIds: deletedObjectIds,
  });
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
