const express = require("express");

const router = express.Router();

const bookController = require("../controllers/bookController");

const verifyToken = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

router.get(
    "/",
    verifyToken,
    bookController.getAllBooks
);


router.get(
    "/:id",
    verifyToken,
    bookController.getBookById
);

router.post(
    "/",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    bookController.createBook
);

router.put(
    "/:id",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    bookController.updateBook
);

router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("Admin"),
    bookController.deleteBook
);


module.exports = router;