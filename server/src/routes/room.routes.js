const express = require("express");
const roomController = require("../controllers/room.controller");
const { verifyJwt } = require("../middleware/middleware");

const router = express.Router();

router.post("/", verifyJwt, roomController.createRoom);
router.get("/:roomId", verifyJwt, roomController.getRoomById);
router.post("/:roomId/verify-access", verifyJwt, roomController.verifyRoomAccess);

module.exports = router;