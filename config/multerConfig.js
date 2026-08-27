const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Where PDFs get saved on disk.
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "books");

// Create the folder if it doesn't exist yet.
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // book_<bookId>_<timestamp>.pdf — avoids filename collisions
        // and keeps it traceable to which book it belongs to.
        const bookId = req.params.id || "new";
        const uniqueSuffix = Date.now();
        cb(null, `book_${bookId}_${uniqueSuffix}.pdf`);
    }
});

function pdfFileFilter(req, file, cb) {
    if (file.mimetype !== "application/pdf") {
        return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
}

const uploadPdf = multer({
    storage,
    fileFilter: pdfFileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB max — plenty for a textbook PDF
    }
});

module.exports = uploadPdf;