const express = require("express");
const roomController = require("../controllers/room.controller");
const whiteboardController = require("../controllers/whiteboard.controller");
const { verifyJwt } = require("../middleware/middleware");

const router = express.Router();

router.get("/:roomId", roomController.getRoomMetadata);
router.post("/", verifyJwt, roomController.createRoom);
router.post("/:roomId/whiteboard/export", verifyJwt, whiteboardController.exportWhiteboard);
router.post("/:roomId/whiteboard/import", verifyJwt, whiteboardController.importWhiteboard);

module.exports = router;
