const whiteboards = new Map();

/*
whiteboard shape for future:
{
  roomId,
  objects: []
}
*/

function getWhiteboard(roomId) {
  return whiteboards.get(roomId) || null;
}

function createWhiteboard(roomId) {
  const whiteboard = {
    roomId,
    objects: [],
  };
  whiteboards.set(roomId, whiteboard);
  return whiteboard;
}

function getOrCreateWhiteboard(roomId) {
  return getWhiteboard(roomId) || createWhiteboard(roomId);
}

function deleteWhiteboard(roomId) {
  return whiteboards.delete(roomId);
}

function addObjectToWhiteboard({
  roomId,
  object,
  roomExists,
  socketJoinedRoom,
}) {
  validateAddObject({
    roomId,
    object,
    roomExists,
    socketJoinedRoom,
  });

  const whiteboard = getOrCreateWhiteboard(roomId);
  whiteboard.objects.push(object);
  return object;
}

function getWhiteboardState(roomId) {
  const whiteboard = getOrCreateWhiteboard(roomId);
  return {
    roomId: whiteboard.roomId,
    objects: [...whiteboard.objects],
  };
}

function clearWhiteboard({
  roomId,
  roomExists,
  socketJoinedRoom,
}) {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  if (!roomExists) {
    throw new Error("Room not found");
  }

  if (!socketJoinedRoom) {
    throw new Error("Socket has not joined this room");
  }

  const whiteboard = getOrCreateWhiteboard(roomId);
  whiteboard.objects = [];

  return {
    roomId: whiteboard.roomId,
    objects: [...whiteboard.objects],
  };
}

function validateAddObject({
  roomId,
  object,
  roomExists,
  socketJoinedRoom,
}) {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  if (!roomExists) {
    throw new Error("Room not found");
  }

  if (!socketJoinedRoom) {
    throw new Error("Socket has not joined this room");
  }

  if (!object || typeof object !== "object") {
    throw new Error("Whiteboard object payload is required");
  }

  if (!object.type || typeof object.type !== "string") {
    throw new Error("Whiteboard object type is required");
  }

  if (!object.objectId) {
    throw new Error("Whiteboard object ID is required");
  }
}

module.exports = {
  getWhiteboard,
  createWhiteboard,
  getOrCreateWhiteboard,
  deleteWhiteboard,
  addObjectToWhiteboard,
  getWhiteboardState,
  clearWhiteboard,
};
