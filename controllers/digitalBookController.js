const digitalBookService = require("../services/digitalBookService");

const uploadDigitalBook = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "PDF file is required"
            });
        }

        const {
            book_id,
            access_type
        } = req.body;

        if (!book_id) {
            return res.status(400).json({
                success: false,
                message: "book_id is required"
            });
        }

        const finalAccessType =
            access_type === "Free" ||
            access_type === "Students Only"
                ? access_type
                : "Students Only";

        const filePath =
            `/uploads/books/${req.file.filename}`;

        const digitalBookId =
            await digitalBookService.uploadDigitalBook({
                book_id,
                file_name: req.file.originalname,
                file_path: filePath,
                access_type: finalAccessType
            });

        res.status(201).json({
            success: true,
            message: "Digital book uploaded successfully",
            digital_book_id: digitalBookId
        });

    } catch (error) {
        next(error);
    }
};
const getDigitalBooks = async (req, res, next) => {
    try {
        const books = await digitalBookService.getDigitalBooks();

        res.status(200).json({
            success: true,
            data: books
        });

    } catch (error) {
        next(error);
    }
};

const getDigitalBookById = async (req, res, next) => {
    try {
        const digitalBook =
            await digitalBookService.getDigitalBookById(
                req.params.id
            );

        if (!digitalBook) {
            return res.status(404).json({
                success: false,
                message: "Digital book not found"
            });
        }

        res.status(200).json({
            success: true,
            data: digitalBook
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadDigitalBook,
    getDigitalBooks,
    getDigitalBookById
};