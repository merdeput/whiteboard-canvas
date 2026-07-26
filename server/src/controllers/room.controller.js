const roomService = require("../services/room.service");

async function createRoom(req, res, next) {
  try {
    const room = await roomService.createRoom({
      password: req.body.password,
      ownerId: req.user.id,
    });

    return res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
}

function getRoomMetadata(req, res, next) {
  try {
    const metadata = roomService.getRoomMetadata(req.params.roomId);

    if (!metadata.exists) {
      return res.status(404).json(metadata);
    }

    return res.status(200).json(metadata);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRoom,
  getRoomMetadata,
};
