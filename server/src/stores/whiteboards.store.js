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

module.exports = {
  getWhiteboard,
  createWhiteboard,
  getOrCreateWhiteboard,
};