const { whiteboardRepository } = require("../repositories");

function addObjectToWhiteboard({ socket, roomId, object }) {
  const identity = socket?.identity;

  const storedObject = {
    ...object,
    creatorId: identity?.id,
    creatorDisplayName: identity?.displayName,
    creatorRole: identity?.role,
  };

  return whiteboardRepository.addObject({
    roomId,
    object: storedObject,
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function updateObjectInWhiteboard({ socket, roomId, object }) {
  const identity = socket?.identity;

  const storedObject = {
    ...object,
    creatorId: object?.creatorId ?? identity?.id,
    creatorDisplayName: object?.creatorDisplayName ?? identity?.displayName,
    creatorRole: object?.creatorRole ?? identity?.role,
  };

  return whiteboardRepository.updateObject({
    roomId,
    object: storedObject,
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function deleteObjectsFromWhiteboard({ socket, roomId, objectIds }) {
  return whiteboardRepository.deleteObjects({
    roomId,
    objectIds,
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function getWhiteboardState(roomId) {
  return whiteboardRepository.getState(roomId);
}

function clearWhiteboard({ socket, roomId }) {
  return whiteboardRepository.clear({
    roomId,
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

module.exports = {
  addObjectToWhiteboard,
  updateObjectInWhiteboard,
  deleteObjectsFromWhiteboard,
  getWhiteboardState,
  clearWhiteboard,
};
