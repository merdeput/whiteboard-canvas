const express = require("express");
const roomController = require("../controllers/room.controller");
const { verifyJwt } = require("../middleware/middleware");

const router = express.Router();

router.get("/:roomId", roomController.getRoomMetadata);
router.post("/", verifyJwt, roomController.createRoom);

module.exports = router;
