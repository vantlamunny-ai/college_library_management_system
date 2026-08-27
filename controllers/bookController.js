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



// Google Books returns a valid 200 image/png "image not available" graphic
// instead of a 404 when it has no real cover for an ISBN — same pixel
// dimensions as a real cover, so a plain <img> tag can't tell the
// difference and just displays that ugly placeholder as if it worked.
// Proxying the fetch here lets us actually inspect the response and turn
// that case into a real 404, which the frontend already knows how to
// treat as "no cover" and fall through to its own clean placeholder icon.
async function getBookCover(req, res, next) {
    try {
        const isbn = (req.params.isbn || "").replace(/[^0-9Xx]/g, "");

        if (!isbn) {
            return res.status(404).end();
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        let upstream;
        try {
            upstream = await fetch(
                `https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=1`,
                { signal: controller.signal }
            );
        } finally {
            clearTimeout(timeout);
        }

        if (!upstream.ok || upstream.headers.get("content-type") !== "image/jpeg") {
            return res.status(404).end();
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());

        res.set("Content-Type", "image/jpeg");
        res.set("Cache-Control", "public, max-age=86400");
        res.send(buffer);

    } catch (error) {
        // A slow/unreachable upstream is the same as "no cover" from the
        // frontend's point of view, not a real server error.
        res.status(404).end();
    }
}

module.exports = {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getBookCover,

};