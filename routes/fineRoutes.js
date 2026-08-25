const express = require("express");

const router = express.Router();

const fineController = require("../controllers/fineController");

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post(
    "/",
    verifyToken,
   authorizeRoles("Admin", "Librarian"),
    fineController.createFine
);

router.get(
    "/",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    fineController.getAllFines
);

router.get(
    "/my",
    verifyToken,
    authorizeRoles("Student"),
    fineController.getMyFines
);

router.put(
    "/:fineId",
    verifyToken,
    authorizeRoles("Student"),
    fineController.payFine
);


module.exports = router;