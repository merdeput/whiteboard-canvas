const bcrypt = require("bcrypt");

const { generateId } = require("../utils/utils");
const { roomRepository, whiteboardRepository } = require("../repositories");

async function createRoom({ ownerId, ownerRole, password }) {
  if (!ownerId) {
    throw createAppError(401, "Unauthorized");
  }

  if (ownerRole !== "member") {
    throw createAppError(403, "Only registered members can create rooms");
  }

  let passwordHash = null;

  if (password && password.trim()) {
    passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const now = new Date().toISOString();

  const room = await roomRepository.create({
    id: generateId("room"),
    ownerId,
    passwordHash,
    whiteboardObjects: [],
    participants: [],
    createdAt: now,
    updatedAt: now,
  });

  // Create an empty whiteboard now so later room join / board sync is easy.
  await whiteboardRepository.getOrCreate(room.id);

  return sanitizeRoom(room);
}

async function getRoomMetadata(roomId) {
  if (!roomId) {
    throw createAppError(400, "Room ID is required");
  }

  const room = await roomRepository.findById(roomId);
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

  const room = await roomRepository.findById(roomId);
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

async function addParticipant({ roomId, socketId, identity }) {
  if (!roomId) {
    throw createAppError(400, "Room ID is required");
  }

  if (!socketId) {
    throw createAppError(400, "Socket ID is required");
  }

  if (!identity?.id || !identity?.displayName || !identity?.role) {
    throw createAppError(400, "Session identity is required");
  }

  const room = await roomRepository.findById(roomId);
  if (!room) {
    throw createAppError(404, "Room not found");
  }

  return roomRepository.addParticipant(roomId, {
    socketId,
    id: identity.id,
    displayName: identity.displayName,
    role: identity.role,
  });
}

async function handleSocketDisconnect(socketId) {
  if (!socketId) {
    return [];
  }

  const affectedRooms = await roomRepository.removeParticipantBySocketId(socketId);
  const deletedRoomIds = [];

  for (const room of affectedRooms) {
    if (room.participants.length === 0) {
      await roomRepository.removeById(room.id);
      await whiteboardRepository.removeByRoomId(room.id);
      deletedRoomIds.push(room.id);
    }
  }

  return deletedRoomIds;
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
  addParticipant,
  handleSocketDisconnect,
  sanitizeRoom,
};
