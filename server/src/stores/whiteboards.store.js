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

function updateObjectInWhiteboard({
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

  if (!object.objectId) {
    throw new Error("Object ID is required");
  }

  const whiteboard = getOrCreateWhiteboard(roomId);
  const objectIndex = whiteboard.objects.findIndex(
    (existingObject) => existingObject.objectId === object.objectId
  );

  if (objectIndex === -1) {
    throw new Error("Whiteboard object not found");
  }

  whiteboard.objects[objectIndex] = object;
  return object;
}

function deleteObjectsFromWhiteboard({
  roomId,
  objectIds,
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

  if (!Array.isArray(objectIds) || !objectIds.length) {
    throw new Error("Object IDs are required");
  }

  const whiteboard = getOrCreateWhiteboard(roomId);
  whiteboard.objects = whiteboard.objects.filter(
    (object) => !objectIds.includes(object.objectId)
  );

  return objectIds;
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
  addObjectToWhiteboard,
  updateObjectInWhiteboard,
  deleteObjectsFromWhiteboard,
  getWhiteboardState,
  clearWhiteboard,
};
