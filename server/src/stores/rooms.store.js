const rooms = new Map();

/*
Room shape:
{
  id,
  ownerId,
  passwordHash,
  whiteboardObjects,
  participants: [
    {
      socketId,
      id,
      displayName,
      role,
    }
  ],
  createdAt,
  updatedAt
}
*/

function createRoom(room) {
  rooms.set(room.id, room);
  return room;
}

function findRoomById(roomId) {
  return rooms.get(roomId) || null;
}

function addParticipant(roomId, participant) {
  const room = findRoomById(roomId);

  if (!room) {
    return null;
  }

  room.participants = room.participants.filter(
    (existingParticipant) => existingParticipant.socketId !== participant.socketId
  );
  room.participants.push(participant);
  room.updatedAt = new Date().toISOString();
  return room;
}

function removeParticipantBySocketId(socketId) {
  const affectedRooms = [];

  for (const room of rooms.values()) {
    const nextParticipants = room.participants.filter(
      (participant) => participant.socketId !== socketId
    );

    if (nextParticipants.length !== room.participants.length) {
      room.participants = nextParticipants;
      room.updatedAt = new Date().toISOString();
      affectedRooms.push(room);
    }
  }

  return affectedRooms;
}

function deleteRoom(roomId) {
  return rooms.delete(roomId);
}

module.exports = {
  createRoom,
  findRoomById,
  addParticipant,
  removeParticipantBySocketId,
  deleteRoom,
};
