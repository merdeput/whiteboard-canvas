const socketEvents = require("../constants/constants");
const whiteboardService = require("../services/whiteboard.service");

function handleDrawPath(socket, payload = {}) {
  const { roomId, path } = payload;
  const storedPath = whiteboardService.addPathToWhiteboard({
    socket,
    roomId,
    path,
  });

  socket.to(roomId).emit(socketEvents.WHITEBOARD_PATH_CREATED, {
    roomId,
    path: storedPath,
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
  handleDrawPath,
  handleClearWhiteboard,
  emitWhiteboardState,
};
