const express = require("express");

const router = express.Router();

const issueController =
    require("../controllers/issueController");

const verifyToken = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");




router.post(
    "/",
    verifyToken,
authorizeRoles("Admin", "Librarian"),
    issueController.issueBook
);



router.get(
    "/",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    issueController.getIssues
);




router.get(
    "/statistics",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    issueController.getIssueStatistics
);




router.get(
    "/active",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    issueController.getActiveIssues
);




router.get(
    "/overdue",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    issueController.getOverdueIssues
);



router.get(
    "/student/:studentId",
    verifyToken,
    authorizeRoles(
        "Admin",
        "Librarian",
        "Student"
    ),
    issueController.getStudentIssues
);



router.get(
    "/student/:studentId/active",
    verifyToken,
    authorizeRoles(
        "Admin",
        "Librarian",
        "Student"
    ),
    issueController.getStudentActiveIssues
);




router.get(
    "/copy/:copyId",
    verifyToken,
    authorizeRoles(
        "Admin",
        "Librarian"
    ),
    issueController.getCopyIssueHistory
);



router.get(
    "/:id",
    verifyToken,
    authorizeRoles(
        "Admin",
        "Librarian",
        "Student"
    ),
    issueController.getIssue
);


module.exports = router;