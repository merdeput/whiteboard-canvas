const roomService = require("../services/room.service");

async function createRoom(req, res, next) {
  try {
    const room = await roomService.createRoom({
      name: req.body.name,
      publicity: req.body.publicity,
      password: req.body.password,
      ownerId: req.user.id,
    });

    return res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
}

function getRoomById(req, res, next) {
  try {
    const room = roomService.getRoomById(req.params.roomId);
    return res.status(200).json({ room });
  } catch (error) {
    next(error);
  }
}

async function verifyRoomAccess(req, res, next) {
  try {
    await roomService.verifyRoomAccess({
      roomId: req.params.roomId,
      password: req.body.password,
    });

    return res.status(200).json({ valid: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRoom,
  getRoomById,
  verifyRoomAccess,
};