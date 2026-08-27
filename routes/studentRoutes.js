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


// Must be registered before "/:id" — otherwise Express matches "me" as an :id param.
router.get(
    "/me",
    verifyToken,
    authorizeRoles("Student"),
    studentController.getMyProfile
);


router.put(
    "/me/profile",
    verifyToken,
    authorizeRoles("Student"),
    studentController.updateMyProfile
);


router.put(
    "/me/username",
    verifyToken,
    authorizeRoles("Student"),
    studentController.changeMyUsername
);


router.put(
    "/me/academic",
    verifyToken,
    authorizeRoles("Student"),
    studentController.updateMyAcademicInfo
);


// Must also be registered before "/:id" for the same reason as "/me" above.
router.delete(
    "/me",
    verifyToken,
    authorizeRoles("Student"),
    studentController.deleteMyAccount
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


router.put(
    "/:id/account-status",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    studentController.updateAccountStatus
);


router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("Admin"),
    studentController.deleteStudent
);


module.exports = router;