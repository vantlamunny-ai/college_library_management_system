const db = require("../config/db");

async function getAllBooks() {

    const query =`
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            b.edition,
            b.publication_year,
            b.language,
            b.pages,
            b.price,
            b.description,
            b.cover_image,

            c.category_id,
            c.category_name,

            p.publisher_id,
            p.publisher_name,

            COUNT(bc.copy_id) AS total_copies,

            SUM(
                CASE
                    WHEN bc.availability_status = 'Available'
                    THEN 1
                    ELSE 0
                END
            ) AS available_copies

        FROM books b

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        LEFT JOIN publishers p
            ON b.publisher_id = p.publisher_id

        LEFT JOIN book_copies bc
            ON b.book_id = bc.book_id

        GROUP BY
            b.book_id,
            c.category_id,
            p.publisher_id

        ORDER BY b.book_id DESC
    `;
    const [rows] = await db.query(query);

    return rows;
}

async function getBookById(bookId) {

    const [books] = await db.query(
        `
        SELECT
            b.*,
            c.category_name,
            p.publisher_name

        FROM books b

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        LEFT JOIN publishers p
            ON b.publisher_id = p.publisher_id

        WHERE b.book_id = ?
        `,
        [bookId]
    );

    if (books.length === 0) {
        return null;
    }

    const book = books[0];

    const [authors] = await db.query(
        `
        SELECT
            a.author_id,
            a.author_name

        FROM authors a

        INNER JOIN book_authors ba
            ON a.author_id = ba.author_id

        WHERE ba.book_id = ?
        `,
        [bookId]
    );

    const [copies] = await db.query(
        `
        SELECT
            copy_id,
            accession_number,
            barcode,
            shelf_location,
            condition_status,
            availability_status

        FROM book_copies

        WHERE book_id = ?

        ORDER BY copy_id
        `,
        [bookId]
    );

    book.authors = authors;
    book.copies = copies;

    return book;
}

async function createBook(bookData) {

    const connection =
        await db.getConnection();

    try {

        await connection.beginTransaction();

        const {
            isbn,
            title,
            category_id,
            publisher_id,
            edition,
            publication_year,
            language,
            pages,
            price,
            description,
            cover_image,
            author_ids = []
        } = bookData;

        const [result] =
            await connection.query(
                `
                INSERT INTO books
                (
                    isbn,
                    title,
                    category_id,
                    publisher_id,
                    edition,
                    publication_year,
                    language,
                    pages,
                    price,
                    description,
                    cover_image
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    isbn,
                    title,
                    category_id,
                    publisher_id,
                    edition,
                    publication_year,
                    language || "English",
                    pages,
                    price,
                    description,
                    cover_image
                ]
            );

        const bookId = result.insertId;

        for (const authorId of author_ids) {

            await connection.query(
                `
                INSERT INTO book_authors
                (
                    book_id,
                    author_id
                )
                VALUES (?, ?)
                `,
                [
                    bookId,
                    authorId
                ]
            );
        }

        await connection.commit();

        return getBookById(bookId);

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}

async function updateBook(bookId, bookData) {

    const {
        isbn,
        title,
        category_id,
        publisher_id,
        edition,
        publication_year,
        language,
        pages,
        price,
        description,
        cover_image
    } = bookData;

    const [result] = await db.query(
        `
        UPDATE books

        SET
            isbn = ?,
            title = ?,
            category_id = ?,
            publisher_id = ?,
            edition = ?,
            publication_year = ?,
            language = ?,
            pages = ?,
            price = ?,
            description = ?,
            cover_image = ?

        WHERE book_id = ?
        `,
        [
            isbn,
            title,
            category_id,
            publisher_id,
            edition,
            publication_year,
            language,
            pages,
            price,
            description,
            cover_image,
            bookId
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getBookById(bookId);
}

async function deleteBook(bookId) {

    const [result] = await db.query(
        `
        DELETE FROM books
        WHERE book_id = ?
        `,
        [bookId]
    );

    return result.affectedRows > 0;
}



module.exports = {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
   
};