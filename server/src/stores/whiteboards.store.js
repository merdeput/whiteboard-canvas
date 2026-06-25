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

function addObjectToWhiteboard(roomId, object) {
  const whiteboard = getOrCreateWhiteboard(roomId);
  whiteboard.objects.push(object);
  return whiteboard;
}

function getWhiteboardState(roomId) {
  const whiteboard = getOrCreateWhiteboard(roomId);
  return {
    roomId: whiteboard.roomId,
    objects: [...whiteboard.objects],
  };
}

module.exports = {
  getWhiteboard,
  createWhiteboard,
  getOrCreateWhiteboard,
  addObjectToWhiteboard,
  getWhiteboardState,
};