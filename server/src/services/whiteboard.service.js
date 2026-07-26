const roomsStore = require("../stores/rooms.store");
const whiteboardsStore = require("../stores/whiteboards.store");

function addObjectToWhiteboard({ socket, roomId, object }) {
  const room = roomsStore.findRoomById(roomId);
  const identity = socket?.identity;

  const storedObject = {
    ...object,
    creatorId: identity?.id,
    creatorDisplayName: identity?.displayName,
    creatorRole: identity?.role,
  };

  return whiteboardsStore.addObjectToWhiteboard({
    roomId,
    object: storedObject,
    roomExists: Boolean(room),
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function getWhiteboardState(roomId) {
  const room = roomsStore.findRoomById(roomId);

  if (!room) {
    throw createAppError("Room not found");
  }

  return whiteboardsStore.getWhiteboardState(roomId);
}

function clearWhiteboard({ socket, roomId }) {
  const room = roomsStore.findRoomById(roomId);

  return whiteboardsStore.clearWhiteboard({
    roomId,
    roomExists: Boolean(room),
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function createAppError(message) {
  const error = new Error(message);
  return error;
}

module.exports = {
  addObjectToWhiteboard,
  getWhiteboardState,
  clearWhiteboard,
};
