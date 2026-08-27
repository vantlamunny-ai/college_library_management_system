const db = require("../config/db");

const uploadDigitalBook = async (data) => {
    const {
        book_id,
        file_name,
        file_path,
        access_type
    } = data;

    // Only values supported by the database ENUM
    const allowedAccessTypes = ["Free", "Students Only"];

    const finalAccessType =
        allowedAccessTypes.includes(access_type)
            ? access_type
            : "Students Only";

    const [result] = await db.execute(
        `INSERT INTO digital_books
        (book_id, file_name, file_path, access_type)
        VALUES (?, ?, ?, ?)`,
        [
            book_id,
            file_name,
            file_path,
            finalAccessType
        ]
    );

    return result.insertId;
};

const getDigitalBooks = async () => {
    const [rows] = await db.execute(`
        SELECT
            db.digital_book_id,
            db.book_id,
            b.title,
            db.file_name,
            db.file_path,
            db.access_type,
            db.status,
            db.uploaded_at
        FROM digital_books db
        JOIN books b ON db.book_id = b.book_id
        WHERE db.status = 'Available'
        ORDER BY db.digital_book_id DESC
    `);

    return rows;
};

const getDigitalBookById = async (digitalBookId) => {
    const [rows] = await db.execute(
        `SELECT
            db.digital_book_id,
            db.book_id,
            b.title,
            db.file_name,
            db.file_path,
            db.access_type,
            db.status
         FROM digital_books db
         JOIN books b ON db.book_id = b.book_id
         WHERE db.digital_book_id = ?`,
        [digitalBookId]
    );

    return rows[0] || null;
};

const getDigitalBookByBookId = async (bookId) => {
    const [rows] = await db.execute(
        `SELECT
            db.digital_book_id,
            db.book_id,
            db.file_name,
            db.file_path,
            db.access_type,
            db.status
         FROM digital_books db
         WHERE db.book_id = ? AND db.status = 'Available'`,
        [bookId]
    );

    return rows[0] || null;
};

const deleteDigitalBook = async (digitalBookId) => {
    const [result] = await db.execute(
        `UPDATE digital_books SET status = 'Disabled' WHERE digital_book_id = ?`,
        [digitalBookId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    uploadDigitalBook,
    getDigitalBooks,
    getDigitalBookById,
    getDigitalBookByBookId,
    deleteDigitalBook
};