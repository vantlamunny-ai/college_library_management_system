const db = require("../config/db");

const createReservation = async (
    book_id,
    userId,
    expiry_date
) => {

    const [books] = await db.query(
        `SELECT book_id
         FROM books
         WHERE book_id = ?`,
        [book_id]
    );

    if (books.length === 0) {
        throw new Error("Book not found");
    }

    // student_id is resolved from the logged-in account, never taken from
    // the request body — otherwise one student could reserve books "as"
    // another by simply changing the id in the payload.
    const [students] = await db.query(
        `SELECT s.student_id, u.status AS account_status
         FROM students s
         INNER JOIN users u ON s.user_id = u.user_id
         WHERE s.user_id = ?`,
        [userId]
    );

    if (students.length === 0) {
        throw new Error("No student profile is linked to this account yet");
    }

    const student_id = students[0].student_id;

    if (students[0].account_status === "Blocked") {
        throw new Error("This student's account is blocked and cannot make reservations");
    }

    if (students[0].account_status === "Inactive") {
        throw new Error("This student's account is inactive and cannot make reservations");
    }

    const [existingReservation] = await db.query(
        `SELECT reservation_id
         FROM reservations
         WHERE book_id = ?
         AND student_id = ?
         AND status IN ('Pending', 'Approved')`,
        [book_id, student_id]
    );

    if (existingReservation.length > 0) {
        throw new Error("Book is already reserved by this student");
    }

    const [result] = await db.query(
        `INSERT INTO reservations
        (book_id, student_id, expiry_date, status)
        VALUES (?, ?, ?, 'Pending')`,
        [
            book_id,
            student_id,
            expiry_date
        ]
    );

    return {
        reservation_id: result.insertId,
        book_id,
        student_id,
        expiry_date,
        status: "Pending"
    };
};

const getAllReservations = async () => {

    const [rows] = await db.query(
        `SELECT *
         FROM reservations
         ORDER BY reservation_id DESC`
    );

    return rows;
};

const getMyReservations = async (userId) => {

    const [students] = await db.query(
        `SELECT student_id FROM students WHERE user_id = ?`,
        [userId]
    );

    // No linked student profile yet — nothing to show rather than an error.
    if (students.length === 0) return [];

    const [rows] = await db.query(
        `SELECT
            r.reservation_id,
            r.book_id,
            b.title,
            r.reservation_date,
            r.expiry_date,
            r.status
         FROM reservations r
         INNER JOIN books b
             ON r.book_id = b.book_id
         WHERE r.student_id = ?
         ORDER BY r.reservation_date DESC`,
        [students[0].student_id]
    );

    return rows;
};

const getReservationById = async (reservation_id) => {

    const [rows] = await db.query(
        `SELECT *
         FROM reservations
         WHERE reservation_id = ?`,
        [reservation_id]
    );

    if (rows.length === 0) {
        throw new Error("Reservation not found");
    }

    return rows[0];
};

const updateReservation = async (
    reservation_id,
    expiry_date,
    status
) => {

    const [reservations] = await db.query(
        `SELECT reservation_id
         FROM reservations
         WHERE reservation_id = ?`,
        [reservation_id]
    );

    if (reservations.length === 0) {
        throw new Error("Reservation not found");
    }

    await db.query(
        `UPDATE reservations
         SET expiry_date = ?,
             status = ?
         WHERE reservation_id = ?`,
        [
            expiry_date,
            status,
            reservation_id
        ]
    );

    return {
        reservation_id,
        expiry_date,
        status
    };
};

const deleteReservation = async (reservation_id) => {

    const [reservations] = await db.query(
        `SELECT reservation_id
         FROM reservations
         WHERE reservation_id = ?`,
        [reservation_id]
    );

    if (reservations.length === 0) {
        throw new Error("Reservation not found");
    }

    await db.query(
        `DELETE FROM reservations
         WHERE reservation_id = ?`,
        [reservation_id]
    );

    return {
        message: "Reservation deleted successfully"
    };
};

module.exports = {
    createReservation,
    getAllReservations,
    getMyReservations,
    getReservationById,
    updateReservation,
    deleteReservation
};