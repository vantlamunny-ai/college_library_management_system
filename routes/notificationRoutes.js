const express = require("express");

const router = express.Router();

const notificationController =
    require("../controllers/notificationController");

const authorizeRoles = require("../middleware/roleMiddleware");
const verifyToken = require("../middleware/authMiddleware");

router.get(
    "/my",
    verifyToken,
    authorizeRoles("Student"),
    notificationController.getMyNotifications
);

module.exports = router;