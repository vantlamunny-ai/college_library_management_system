const db = require("../config/db");

const createReservation = async (
    book_id,
    student_id,
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

    const [students] = await db.query(
        `SELECT student_id
         FROM students
         WHERE student_id = ?`,
        [student_id]
    );

    if (students.length === 0) {
        throw new Error("Student not found");
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
    getReservationById,
    updateReservation,
    deleteReservation
};