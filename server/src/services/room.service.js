const bcrypt = require("bcrypt");

const { generateId } = require("../utils/utils");
const roomsStore = require("../stores/rooms.store");
const whiteboardsStore = require("../stores/whiteboards.store");

async function createRoom({ name, ownerId, publicity = "public", password }) {
  if (!ownerId) {
    throw createAppError(401, "Unauthorized");
  }

  if (!name || !name.trim()) {
    throw createAppError(400, "Room name is required");
  }

  if (!["public", "private"].includes(publicity)) {
    throw createAppError(400, "Publicity must be either 'public' or 'private'");
  }

  let passwordHash = null;

  if (password && password.trim()) {
    passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const now = new Date().toISOString();

  const room = roomsStore.createRoom({
    id: generateId("room"),
    name: name.trim(),
    ownerId,
    publicity,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  // Create an empty whiteboard now so later room join / board sync is easy.
  whiteboardsStore.getOrCreateWhiteboard(room.id);

  return sanitizeRoom(room);
}

function getRoomById(roomId) {
  if (!roomId) {
    throw createAppError(400, "Room ID is required");
  }

  const room = roomsStore.findRoomById(roomId);
  if (!room) {
    throw createAppError(404, "Room not found");
  }

  return sanitizeRoom(room);
}

function sanitizeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    ownerId: room.ownerId,
    publicity: room.publicity,
    hasPassword: !!room.passwordHash,
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
  getRoomById,
};