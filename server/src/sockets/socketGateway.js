let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function emitToRoom(roomId, eventName, payload) {
  if (!ioInstance || !roomId || !eventName) {
    return;
  }

  ioInstance.to(roomId).emit(eventName, payload);
}

module.exports = {
  setSocketServer,
  emitToRoom,
};
