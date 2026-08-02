const Room = require("../models/room.model");

function normalizeRoom(room) {
  if (!room) {
    return null;
  }

  return {
    id: room._id,
    ownerId: room.ownerId,
    passwordHash: room.passwordHash,
    participants: Array.isArray(room.participants)
      ? room.participants.map((participant) => ({
          socketId: participant.socketId,
          id: participant.id,
          displayName: participant.displayName,
          role: participant.role,
        }))
      : [],
    createdAt:
      room.createdAt instanceof Date ? room.createdAt.toISOString() : room.createdAt,
    updatedAt:
      room.updatedAt instanceof Date ? room.updatedAt.toISOString() : room.updatedAt,
  };
}

async function create(room) {
  const createdRoom = await Room.create({
    _id: room.id,
    ownerId: room.ownerId,
    passwordHash: room.passwordHash ?? null,
    participants: room.participants ?? [],
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  });

  return normalizeRoom(createdRoom);
}

async function findById(roomId) {
  const room = await Room.findById(roomId).lean();
  return normalizeRoom(room);
}

async function addParticipant(roomId, participant) {
  const room = await Room.findById(roomId);

  if (!room) {
    return null;
  }

  room.participants = room.participants.filter(
    (existingParticipant) => existingParticipant.socketId !== participant.socketId
  );
  room.participants.push(participant);
  room.updatedAt = new Date();

  await room.save();
  return normalizeRoom(room.toObject());
}

async function removeParticipantBySocketId(socketId) {
  const rooms = await Room.find({ "participants.socketId": socketId });
  const affectedRooms = [];

  for (const room of rooms) {
    const nextParticipants = room.participants.filter(
      (participant) => participant.socketId !== socketId
    );

    if (nextParticipants.length === room.participants.length) {
      continue;
    }

    room.participants = nextParticipants;
    room.updatedAt = new Date();
    await room.save();
    affectedRooms.push(normalizeRoom(room.toObject()));
  }

  return affectedRooms;
}

async function removeById(roomId) {
  const deletedRoom = await Room.findByIdAndDelete(roomId).lean();
  return normalizeRoom(deletedRoom);
}

module.exports = {
  create,
  findById,
  addParticipant,
  removeParticipantBySocketId,
  removeById,
};
