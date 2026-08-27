const express = require("express");
const multer = require("multer");
const path = require("path");

const digitalBookController = require("../controllers/digitalBookController");

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/books/");
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

// File Filter (Only PDF allowed)
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
});

// POST Route: Upload PDF
router.post(
    "/upload",
    upload.single("pdf"),
    digitalBookController.uploadDigitalBook
);

// GET Route: Get all digital books
router.get(
    "/",
    digitalBookController.getDigitalBooks
);

// GET Route: Get digital book by Book ID (Frontend requirement)
router.get(
    "/book/:bookId",
    digitalBookController.getDigitalBookByBookId || digitalBookController.getDigitalBookById
);

// GET Route: Get digital book by Digital Book ID
router.get(
    "/:id",
    digitalBookController.getDigitalBookById
);

module.exports = router;