const express = require("express");

const router = express.Router();

const bookController = require("../controllers/bookController");
const bookPdfController = require("../controllers/bookpdfController");
const uploadPdf = require("../config/multerConfig");

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
router.put(
    "/:id/pdf",
    verifyToken,
    authorizeRoles("Admin", "Librarian"),
    uploadPdf.single("pdf"),
    bookPdfController.uploadBookPdf
);
router.get(
    "/:id/pdf",
    verifyToken,
    bookPdfController.getBookPdf
);

module.exports = router;