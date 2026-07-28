const roomsStore = require("../stores/rooms.store");

function create(room) {
  return roomsStore.createRoom(room);
}

function findById(roomId) {
  return roomsStore.findRoomById(roomId);
}

function addParticipant(roomId, participant) {
  return roomsStore.addParticipant(roomId, participant);
}

function removeParticipantBySocketId(socketId) {
  return roomsStore.removeParticipantBySocketId(socketId);
}

function removeById(roomId) {
  return roomsStore.deleteRoom(roomId);
}

module.exports = {
  create,
  findById,
  addParticipant,
  removeParticipantBySocketId,
  removeById,
};
