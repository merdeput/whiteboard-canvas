const bcrypt = require("bcrypt");
const { roomRepository, whiteboardRepository } = require("../repositories");

const WHITEBOARD_EXPORT_VERSION = 1;
const ALLOWED_OBJECT_TYPES = new Set(["path", "rect", "circle", "line", "textbox"]);

async function addObjectToWhiteboard({ socket, roomId, object }) {
  const room = await roomRepository.findById(roomId);
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

async function updateObjectInWhiteboard({ socket, roomId, object }) {
  const room = await roomRepository.findById(roomId);
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

async function deleteObjectsFromWhiteboard({ socket, roomId, objectIds }) {
  const room = await roomRepository.findById(roomId);

  return whiteboardRepository.deleteObjects({
    roomId,
    objectIds,
    roomExists: Boolean(room),
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

async function getWhiteboardState(roomId) {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw createAppError(404, "Room not found");
  }

  return whiteboardRepository.getState(roomId);
}

async function clearWhiteboard({ socket, roomId }) {
  const room = await roomRepository.findById(roomId);

  return whiteboardRepository.clear({
    roomId,
    roomExists: Boolean(room),
    socketJoinedRoom: Boolean(socket?.rooms?.has(roomId)),
  });
}

async function exportWhiteboard({ roomId, password }) {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw createAppError(404, "Room not found");
  }

  await verifyPasswordIfNeeded(room, password);

  const state = await whiteboardRepository.getState(roomId);

  return {
    version: WHITEBOARD_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    whiteboard: {
      objects: state.objects.map(stripAuthoritativeMetadata),
    },
  };
}

async function importWhiteboard({ roomId, password, whiteboardImport }) {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw createAppError(404, "Room not found");
  }

  await verifyPasswordIfNeeded(room, password);

  const objects = validateWhiteboardImportDocument(whiteboardImport);

  return whiteboardRepository.replaceState({
    roomId,
    roomExists: true,
    objects,
  });
}

async function verifyPasswordIfNeeded(room, password) {
  if (!room.passwordHash) {
    return;
  }

  if (!password || !password.trim()) {
    throw createAppError(401, "Room password is required");
  }

  const isValid = await bcrypt.compare(password.trim(), room.passwordHash);

  if (!isValid) {
    throw createAppError(401, "Invalid room password");
  }
}

function validateWhiteboardImportDocument(whiteboardImport) {
  if (!whiteboardImport || typeof whiteboardImport !== "object" || Array.isArray(whiteboardImport)) {
    throw createAppError(400, "Whiteboard import payload must be a JSON object");
  }

  if (whiteboardImport.version !== WHITEBOARD_EXPORT_VERSION) {
    throw createAppError(400, `Unsupported whiteboard import version: ${whiteboardImport.version}`);
  }

  if (
    !whiteboardImport.whiteboard ||
    typeof whiteboardImport.whiteboard !== "object" ||
    Array.isArray(whiteboardImport.whiteboard)
  ) {
    throw createAppError(400, "Whiteboard import must include a whiteboard object");
  }

  const objects = whiteboardImport.whiteboard.objects;

  if (!Array.isArray(objects)) {
    throw createAppError(400, "Whiteboard import must include an objects array");
  }

  const normalizedObjects = objects.map(validateImportedObject);
  const objectIds = new Set();

  for (const object of normalizedObjects) {
    if (objectIds.has(object.objectId)) {
      throw createAppError(400, `Duplicate whiteboard object ID: ${object.objectId}`);
    }

    objectIds.add(object.objectId);
  }

  return normalizedObjects;
}

function validateImportedObject(object, index) {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    throw createAppError(400, `Whiteboard object at index ${index} must be an object`);
  }

  if (!ALLOWED_OBJECT_TYPES.has(object.type)) {
    throw createAppError(400, `Unsupported whiteboard object type at index ${index}`);
  }

  if (!object.objectId || typeof object.objectId !== "string") {
    throw createAppError(400, `Whiteboard object ID is required at index ${index}`);
  }

  if (!object.props || typeof object.props !== "object" || Array.isArray(object.props)) {
    throw createAppError(400, `Whiteboard object props must be an object at index ${index}`);
  }

  if (object.type === "path" && !Array.isArray(object.pathData)) {
    throw createAppError(400, `Path object pathData must be an array at index ${index}`);
  }

  if (object.type !== "path" && object.pathData !== undefined && !Array.isArray(object.pathData)) {
    throw createAppError(400, `Whiteboard object pathData must be an array at index ${index}`);
  }

  return {
    type: object.type,
    objectId: object.objectId,
    props: object.props,
    ...(object.pathData !== undefined ? { pathData: object.pathData } : {}),
  };
}

function stripAuthoritativeMetadata(object) {
  return {
    type: object.type,
    objectId: object.objectId,
    props: object.props || {},
    ...(object.pathData !== undefined ? { pathData: object.pathData } : {}),
  };
}

function createAppError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = {
  addObjectToWhiteboard,
  updateObjectInWhiteboard,
  deleteObjectsFromWhiteboard,
  getWhiteboardState,
  clearWhiteboard,
  exportWhiteboard,
  importWhiteboard,
};
