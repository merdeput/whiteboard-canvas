const socketEvents = require("../constants/constants");
const whiteboardService = require("../services/whiteboard.service");

async function handleDrawObject(socket, payload = {}) {
  const { roomId, object } = payload;
  const storedObject = await whiteboardService.addObjectToWhiteboard({
    socket,
    roomId,
    object,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECT_CREATED, {
    roomId,
    object: storedObject,
  });
}

async function handleUpdateObject(socket, payload = {}) {
  const { roomId, object } = payload;
  const storedObject = await whiteboardService.updateObjectInWhiteboard({
    socket,
    roomId,
    object,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECT_UPDATED, {
    roomId,
    object: storedObject,
  });
}

async function handleDeleteObjects(socket, payload = {}) {
  const { roomId, objectIds } = payload;
  const deleted = await whiteboardService.deleteObjectsFromWhiteboard({
    socket,
    roomId,
    objectIds,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_OBJECTS_DELETED, deleted);
}

async function handleClearWhiteboard(socket, payload = {}) {
  const { roomId } = payload;

  await whiteboardService.clearWhiteboard({
    socket,
    roomId,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_CLEARED, {
    roomId,
  });
}

async function emitWhiteboardState(socket, roomId) {
  const whiteboardState = await whiteboardService.getWhiteboardState(roomId);
  socket.emit(socketEvents.WHITEBOARD_STATE, whiteboardState);
}

module.exports = {
  handleDrawObject,
  handleUpdateObject,
  handleDeleteObjects,
  handleClearWhiteboard,
  emitWhiteboardState,
};
