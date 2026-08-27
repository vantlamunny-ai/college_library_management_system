const db = require("../config/db");

/**
 * PUT /books/:id/pdf
 * Admin/Librarian uploads a PDF for a book that already exists.
 * Expects multipart/form-data with a single file field named "pdf".
 */
const uploadBookPdf = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No PDF file uploaded"
            });
        }

        // Path stored in DB is relative — the frontend builds the full
        // URL using the API base URL, same pattern as cover_image.
        const pdfPath = `/uploads/books/${req.file.filename}`;

        const [result] = await db.query(
            `UPDATE books SET pdf_url = ? WHERE book_id = ?`,
            [pdfPath, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "PDF uploaded successfully",
            data: { pdf_url: pdfPath }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /books/:id/pdf
 * Returns the stored pdf_url for a book, so the frontend knows whether
 * a reader is available and what URL to point it at.
 */
const getBookPdf = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT pdf_url FROM books WHERE book_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        if (!rows[0].pdf_url) {
            return res.status(404).json({
                success: false,
                message: "No PDF available for this book yet"
            });
        }

        res.status(200).json({
            success: true,
            data: { pdf_url: rows[0].pdf_url }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadBookPdf,
    getBookPdf
};