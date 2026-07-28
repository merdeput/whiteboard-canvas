const roomsStore = require("../stores/rooms.store");
const whiteboardsStore = require("../stores/whiteboards.store");

function getOrCreate(roomId) {
  return whiteboardsStore.getOrCreateWhiteboard(roomId);
}

function removeByRoomId(roomId) {
  return whiteboardsStore.deleteWhiteboard(roomId);
}

function addObject({ roomId, object, socketJoinedRoom }) {
  return whiteboardsStore.addObjectToWhiteboard({
    roomId,
    object,
    roomExists: Boolean(roomsStore.findRoomById(roomId)),
    socketJoinedRoom,
  });
}

function updateObject({ roomId, object, socketJoinedRoom }) {
  return whiteboardsStore.updateObjectInWhiteboard({
    roomId,
    object,
    roomExists: Boolean(roomsStore.findRoomById(roomId)),
    socketJoinedRoom,
  });
}

function deleteObjects({ roomId, objectIds, socketJoinedRoom }) {
  return whiteboardsStore.deleteObjectsFromWhiteboard({
    roomId,
    objectIds,
    roomExists: Boolean(roomsStore.findRoomById(roomId)),
    socketJoinedRoom,
  });
}

function getState(roomId) {
  const room = roomsStore.findRoomById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  return whiteboardsStore.getWhiteboardState(roomId);
}

function clear({ roomId, socketJoinedRoom }) {
  return whiteboardsStore.clearWhiteboard({
    roomId,
    roomExists: Boolean(roomsStore.findRoomById(roomId)),
    socketJoinedRoom,
  });
}

module.exports = {
  getOrCreate,
  removeByRoomId,
  addObject,
  updateObject,
  deleteObjects,
  getState,
  clear,
};
