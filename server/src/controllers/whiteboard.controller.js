const socketEvents = require("../constants/constants");
const whiteboardService = require("../services/whiteboard.service");
const { emitToRoom } = require("../sockets/socketGateway");

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

async function exportWhiteboard(req, res, next) {
  try {
    const whiteboardExport = await whiteboardService.exportWhiteboard({
      roomId: req.params.roomId,
      password: req.body?.password,
    });

    return res.status(200).json(whiteboardExport);
  } catch (error) {
    next(error);
  }
}

async function importWhiteboard(req, res, next) {
  try {
    const whiteboardState = await whiteboardService.importWhiteboard({
      roomId: req.params.roomId,
      password: req.body?.password,
      whiteboardImport: req.body?.whiteboardImport,
    });

    emitToRoom(req.params.roomId, socketEvents.WHITEBOARD_STATE, whiteboardState);

    return res.status(200).json(whiteboardState);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleDrawObject,
  handleUpdateObject,
  handleDeleteObjects,
  handleClearWhiteboard,
  emitWhiteboardState,
  exportWhiteboard,
  importWhiteboard,
};
