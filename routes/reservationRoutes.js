const express = require("express");

const router = express.Router();

const reservationController = require("../controllers/reservationController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post(
    "/",
    authMiddleware,
    roleMiddleware("Student"),
    reservationController.createReservation
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("Admin", "Librarian"),
    reservationController.getAllReservations
);

router.get(
    "/my",
    authMiddleware,
    roleMiddleware("Student"),
    reservationController.getMyReservations
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Librarian"),
    reservationController.getReservationById
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Librarian"),
    reservationController.updateReservation
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Librarian"),
    reservationController.deleteReservation
);

module.exports = router;