const db = require("../config/db");

async function getBookReport() {

    const [rows] = await db.query(`
        SELECT
            b.book_id,
            b.isbn,
            b.title,
            c.category_name,
            p.publisher_name,
            b.edition,
            b.publication_year,
            b.language,
            b.pages,
            b.price,

            COUNT(bc.copy_id) AS total_copies,

            SUM(
                CASE
                    WHEN bc.availability_status = 'Available'
                    THEN 1
                    ELSE 0
                END
            ) AS available_copies,

            SUM(
                CASE
                    WHEN bc.availability_status = 'Issued'
                    THEN 1
                    ELSE 0
                END
            ) AS issued_copies

        FROM books b

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        LEFT JOIN publishers p
            ON b.publisher_id = p.publisher_id

        LEFT JOIN book_copies bc
            ON b.book_id = bc.book_id

        GROUP BY
            b.book_id,
            c.category_name,
            p.publisher_name

        ORDER BY b.book_id DESC
    `);

    return rows;
}

async function getIssueReport() {

    const [rows] = await db.query(`
        SELECT
            bi.issue_id,
            b.title,
            bc.accession_number,

            s.student_id,
            s.roll_number,
            s.student_name,

            l.librarian_name,

            bi.issue_date,
            bi.due_date,
            bi.status,
            bi.renewal_count

        FROM book_issues bi

        INNER JOIN book_copies bc
            ON bi.copy_id = bc.copy_id

        INNER JOIN books b
            ON bc.book_id = b.book_id

        INNER JOIN students s
            ON bi.student_id = s.student_id

        INNER JOIN librarians l
            ON bi.librarian_id = l.librarian_id

        ORDER BY bi.issue_date DESC
    `);

    return rows;
}

async function getReturnReport() {

    const [rows] = await db.query(`
        SELECT
            br.return_id,
            br.issue_id,

            b.title,
            bc.accession_number,

            s.student_id,
            s.roll_number,
            s.student_name,

            br.return_date,
            br.condition_status,
            br.remarks,

            l.librarian_name AS processed_by,

            br.created_at

        FROM book_returns br

        INNER JOIN book_issues bi
            ON br.issue_id = bi.issue_id

        INNER JOIN book_copies bc
            ON bi.copy_id = bc.copy_id

        INNER JOIN books b
            ON bc.book_id = b.book_id

        INNER JOIN students s
            ON bi.student_id = s.student_id

        LEFT JOIN librarians l
            ON br.processed_by = l.librarian_id

        ORDER BY br.return_date DESC
    `);

    return rows;
}

async function getStudentReport() {

    const [rows] = await db.query(`
        SELECT
            s.student_id,
            s.roll_number,
            s.student_name,
            s.department,
            s.year,
            s.semester,
            s.phone,
            s.status,

            COUNT(bi.issue_id) AS total_books_borrowed,

            SUM(
                CASE
                    WHEN bi.status = 'Issued'
                    THEN 1
                    ELSE 0
                END
            ) AS currently_issued,

            SUM(
                CASE
                    WHEN bi.status = 'Returned'
                    THEN 1
                    ELSE 0
                END
            ) AS returned_books,

            SUM(
                CASE
                    WHEN bi.status = 'Overdue'
                    THEN 1
                    ELSE 0
                END
            ) AS overdue_books

        FROM students s

        LEFT JOIN book_issues bi
            ON s.student_id = bi.student_id

        GROUP BY
            s.student_id,
            s.roll_number,
            s.student_name,
            s.department,
            s.year,
            s.semester,
            s.phone,
            s.status

        ORDER BY s.student_id DESC
    `);

    return rows;
}

async function getFineReport() {

    const [rows] = await db.query(`
        SELECT
            f.fine_id,
            f.issue_id,

            s.student_id,
            s.roll_number,
            s.student_name,

            b.title,

            f.fine_type,
            f.amount,
            f.reason,
            f.payment_status,
            f.paid_date,
            f.created_at

        FROM fines f

        INNER JOIN students s
            ON f.student_id = s.student_id

        INNER JOIN book_issues bi
            ON f.issue_id = bi.issue_id

        INNER JOIN book_copies bc
            ON bi.copy_id = bc.copy_id

        INNER JOIN books b
            ON bc.book_id = b.book_id

        ORDER BY f.created_at DESC
    `);

    return rows;
}

async function getReservationReport() {

    const [rows] = await db.query(`
        SELECT
            r.reservation_id,

            b.book_id,
            b.title,

            s.student_id,
            s.roll_number,
            s.student_name,

            r.reservation_date,
            r.expiry_date,
            r.status

        FROM reservations r

        INNER JOIN books b
            ON r.book_id = b.book_id

        INNER JOIN students s
            ON r.student_id = s.student_id

        ORDER BY r.reservation_date DESC
    `);

    return rows;
}

async function getDashboardReport() {

    const [rows] = await db.query(`
        SELECT

            (SELECT COUNT(*)
             FROM books)
            AS total_books,

            (SELECT COUNT(*)
             FROM book_copies)
            AS total_copies,

            (SELECT COUNT(*)
             FROM book_copies
             WHERE availability_status = 'Available')
            AS available_copies,

            (SELECT COUNT(*)
             FROM book_copies
             WHERE availability_status = 'Issued')
            AS issued_copies,

            (SELECT COUNT(*)
             FROM students
             WHERE status = 'Active')
            AS active_students,

            (SELECT COUNT(*)
             FROM book_issues
             WHERE status = 'Issued')
            AS active_issues,

            (SELECT COUNT(*)
             FROM book_issues
             WHERE status = 'Overdue')
            AS overdue_books,

            (SELECT COUNT(*)
             FROM reservations
             WHERE status = 'Pending')
            AS pending_reservations,

            (SELECT COALESCE(SUM(amount), 0)
             FROM fines
             WHERE payment_status = 'Pending')
            AS pending_fines
    `);

    return rows[0];
}

async function getCopyReport() {

    const [rows] = await db.query(`
        SELECT
            bc.copy_id,
            bc.accession_number,
            bc.barcode,
            bc.shelf_location,

            b.book_id,
            b.title,

            c.category_name,

            bc.purchase_date,
            bc.price,
            bc.condition_status,
            bc.availability_status,
            bc.created_at

        FROM book_copies bc

        INNER JOIN books b
            ON bc.book_id = b.book_id

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        ORDER BY bc.copy_id DESC
    `);

    return rows;
}


module.exports = {
    getBookReport,
    getIssueReport,
    getReturnReport,
    getStudentReport,
    getFineReport,
    getReservationReport,
    getDashboardReport,
    getCopyReport
};