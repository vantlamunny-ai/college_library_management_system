const express = require("express");

const router = express.Router();

const notificationController =
    require("../controllers/notificationController");

const authorizeRoles = require("../middleware/roleMiddleware");
const verifyToken = require("../middleware/authMiddleware");

router.get(
    "/my",
    verifyToken,
    authorizeRoles("Student", "Librarian", "Admin"),
    notificationController.getMyNotifications
);

router.put(
    "/read-all",
    verifyToken,
    notificationController.markAllAsRead
);

router.put(
    "/:id/read",
    verifyToken,
    notificationController.markAsRead
);

module.exports = router;
