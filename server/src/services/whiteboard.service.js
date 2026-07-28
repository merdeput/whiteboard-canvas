const { roomRepository, whiteboardRepository } = require("../repositories");

function addObjectToWhiteboard({ socket, roomId, object }) {
  const room = roomRepository.findById(roomId);
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
    roomExists: Boolean(room),
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function updateObjectInWhiteboard({ socket, roomId, object }) {
  const room = roomRepository.findById(roomId);
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
    roomExists: Boolean(room),
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function deleteObjectsFromWhiteboard({ socket, roomId, objectIds }) {
  const room = roomRepository.findById(roomId);

  return whiteboardRepository.deleteObjects({
    roomId,
    objectIds,
    roomExists: Boolean(room),
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

function getWhiteboardState(roomId) {
  const room = roomRepository.findById(roomId);

  if (!room) {
    throw createAppError("Room not found");
  }

  return whiteboardRepository.getState(roomId);
}

function clearWhiteboard({ socket, roomId }) {
  const room = roomRepository.findById(roomId);

  return whiteboardRepository.clear({
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
  updateObjectInWhiteboard,
  deleteObjectsFromWhiteboard,
  getWhiteboardState,
  clearWhiteboard,
};
