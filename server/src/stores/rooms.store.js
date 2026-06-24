const rooms = new Map();

/*
Room shape:
{
  id,
  ownerId,
  publicity,
  passwordHash,
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

function getAllRooms() {
  return Array.from(rooms.values());
}

module.exports = {
  createRoom,
  findRoomById,
  getAllRooms,
};