const express = require("express");

const router = express.Router();

const librarianController = require("../controllers/librarianController");

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Must be registered before any "/:id" pattern, if one is added later.
router.get(
    "/me",
    verifyToken,
    authorizeRoles("Librarian"),
    librarianController.getMyProfile
);

router.get(
    "/",
    verifyToken,
    authorizeRoles("Admin"),
    librarianController.getLibrarians
);

// Account provisioning — Admin only, matching the spec's requirement that
// only an authenticated Admin can create Librarian accounts.
router.post(
    "/",
    verifyToken,
    authorizeRoles("Admin"),
    librarianController.createLibrarian
);

module.exports = router;
