const bookService = require("../services/bookService");

async function getAllBooks(req, res, next) {

    try {

        const books =
            await bookService.getAllBooks();

        res.json({
            success: true,
            count: books.length,
            message: "All Books All Fecthed Succesfully",
            data: books
        });

    } catch (error) {
        next(error);
    }
}

async function getBookById(req, res, next) {

    try {

        const book =
            await bookService.getBookById(
                req.params.id
            );

        if (!book) {

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        res.json({
            success: true,
            message:"If Books All Showed By The BooksId",
            data: book
        });

    } catch (error) {
        next(error);
    }
}

async function createBook(req, res, next) {

    try {

        const book =
            await bookService.createBook(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Book created successfully",
            data: book
        });

    } catch (error) {
        next(error);
    }
}

async function updateBook(req, res, next) {

    try {

        const book =
            await bookService.updateBook(
                req.params.id,
                req.body
            );

        if (!book) {

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        res.json({
            success: true,
            message: "Book updated successfully",
            data: book
        });

    } catch (error) {
        next(error);
    }
}

async function deleteBook(req, res, next) {

    try {

        const deleted =
            await bookService.deleteBook(
                req.params.id
            );

        if (!deleted) {

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        res.json({
            success: true,
            message: "Book deleted successfully",
            data:deleted
        });

    } catch (error) {
        next(error);
    }
}



module.exports = {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
   
};