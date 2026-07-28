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
    socketJoinedRoom,
  });
}

function updateObject({ roomId, object, roomExists, socketJoinedRoom }) {
  return whiteboardsStore.updateObjectInWhiteboard({
    roomId,
    object,
    roomExists,
    socketJoinedRoom,
  });
}

function deleteObjects({ roomId, objectIds, roomExists, socketJoinedRoom }) {
  return whiteboardsStore.deleteObjectsFromWhiteboard({
    roomId,
    objectIds,
    roomExists,
    socketJoinedRoom,
  });
}

function getState(roomId) {
  return whiteboardsStore.getWhiteboardState(roomId);
}

function clear({ roomId, roomExists, socketJoinedRoom }) {
  return whiteboardsStore.clearWhiteboard({
    roomId,
    roomExists,
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
