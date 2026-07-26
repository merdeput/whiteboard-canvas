const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/guest", authController.guest);
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);

module.exports = router;
