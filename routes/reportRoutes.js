const express = require("express");
const router = express.Router();

const reportController =
    require("../controllers/reportController");

const verifyToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

router.get(
    "/books",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getBookReport
);

router.get(
    "/issues",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getIssueReport
);

router.get(
    "/returns",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getReturnReport
);

router.get(
    "/students",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getStudentReport
);

router.get(
    "/fines",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getFineReport
);

router.get(
    "/reservations",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getReservationReport
);

router.get(
    "/dashboard",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getDashboardReport
);

router.get(
    "/copies",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    reportController.getCopyReport
);


module.exports = router;