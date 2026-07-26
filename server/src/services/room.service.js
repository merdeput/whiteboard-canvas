const bcrypt = require("bcrypt");

const { generateId } = require("../utils/utils");
const roomsStore = require("../stores/rooms.store");
const whiteboardsStore = require("../stores/whiteboards.store");

async function createRoom({ ownerId, password }) {
  if (!ownerId) {
    throw createAppError(401, "Unauthorized");
  }

  let passwordHash = null;

  if (password && password.trim()) {
    passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const now = new Date().toISOString();

  const room = roomsStore.createRoom({
    id: generateId("room"),
    ownerId,
    passwordHash,
    whiteboardObjects: [],
    participants: [],
    createdAt: now,
    updatedAt: now,
  });

  // Create an empty whiteboard now so later room join / board sync is easy.
  whiteboardsStore.getOrCreateWhiteboard(room.id);

  return sanitizeRoom(room);
}

function getRoomMetadata(roomId) {
  if (!roomId) {
    throw createAppError(400, "Room ID is required");
  }

  const room = roomsStore.findRoomById(roomId);
  if (!room) {
    return {
      exists: false,
      requiresPassword: false,
    };
  }

  return {
    exists: true,
    requiresPassword: Boolean(room.passwordHash),
  };
}

async function verifyRoomAccess({ roomId, password }) {
  if (!roomId) {
    throw createAppError(400, "Room ID is required");
  }

  const room = roomsStore.findRoomById(roomId);
  if (!room) {
    throw createAppError(404, "Room not found");
  }

  const hasPassword = Boolean(room.passwordHash);

  if (hasPassword) {
    if (!password || !password.trim()) {
      throw createAppError(401, "Room password is required");
    }

    if (!room.passwordHash) {
      throw createAppError(401, "Invalid room password");
    }

    const isValid = await bcrypt.compare(password.trim(), room.passwordHash);
    if (!isValid) {
      throw createAppError(401, "Invalid room password");
    }
  }

  return room;
}

function sanitizeRoom(room) {
  return {
    id: room.id,
    ownerId: room.ownerId,
    requiresPassword: !!room.passwordHash,
    participants: [...room.participants],
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function createAppError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = {
  createRoom,
  getRoomMetadata,
  verifyRoomAccess,
  sanitizeRoom,
};
