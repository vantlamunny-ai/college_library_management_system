const express = require("express");



const router = express.Router();

const studentController = require("../controllers/studentController");


const verifyToken = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

router.get(
    "/",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    studentController.getStudents
);


router.get(
    "/:id",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    studentController.getStudent
);


router.post(
    "/",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    studentController.createStudent
);


router.put(
    "/:id",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    studentController.updateStudent
);


router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("Admin"),
    studentController.deleteStudent
);


module.exports = router;