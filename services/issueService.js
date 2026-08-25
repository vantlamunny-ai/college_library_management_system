const db = require("../config/db");

const issueSelectQuery = `
    SELECT
        bi.issue_id,

        -- Student
        bi.student_id,
        s.roll_number,
        s.student_name,
        s.department,
        s.year,
        s.semester,

        -- Book Copy
        bi.copy_id,
        bc.accession_number,
        bc.condition_status,

        -- Book
        b.book_id,
        b.title,
        b.isbn,
        b.edition,
        b.publication_year,

        -- Librarian
        bi.librarian_id,
        l.librarian_name,

        -- Issue
        bi.issue_date,
        bi.due_date,
        bi.status AS issue_status,
        bi.renewal_count,
        bi.created_at

    FROM book_issues bi

    INNER JOIN students s
        ON bi.student_id = s.student_id

    INNER JOIN book_copies bc
        ON bi.copy_id = bc.copy_id

    INNER JOIN books b
        ON bc.book_id = b.book_id

    INNER JOIN librarians l
        ON bi.librarian_id = l.librarian_id
`;

async function issueBook(issueData) {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const {
            student_id,
            copy_id,
            librarian_id,
            loan_days = 14
        } = issueData;

        if (!student_id || !copy_id || !librarian_id) {

            throw new Error(
                "student_id, copy_id and librarian_id are required"
            );
        }


        if (
            !Number.isInteger(Number(loan_days)) ||
            Number(loan_days) <= 0
        ) {

            throw new Error(
                "loan_days must be a positive number"
            );
        }

        const [students] = await connection.query(
            `
            SELECT
                s.student_id,
                s.user_id,
                s.roll_number,
                s.student_name,
                s.status,
                u.status AS account_status
            FROM students s
            INNER JOIN users u ON s.user_id = u.user_id
            WHERE s.student_id = ?
            FOR UPDATE
            `,
            [student_id]
        );


        if (students.length === 0) {

            throw new Error("Student not found");
        }


        const student = students[0];

        if (student.account_status === "Blocked") {

            throw new Error(
                "This student's account is blocked and cannot borrow books"
            );
        }

        if (student.account_status !== "Active") {

            throw new Error(
                "This student's account is not active"
            );
        }

        if (student.status !== "Active") {

            throw new Error(
                "Student is not active"
            );
        }

        const [librarians] = await connection.query(
            `
            SELECT
                librarian_id,
                user_id,
                librarian_name,
                status
            FROM librarians
            WHERE librarian_id = ?
            FOR UPDATE
            `,
            [librarian_id]
        );


        if (librarians.length === 0) {

            throw new Error(
                "Librarian not found"
            );
        }


        const librarian = librarians[0];


        if (librarian.status !== "Active") {

            throw new Error(
                "Librarian is not active"
            );
        }

        const [copies] = await connection.query(
            `
            SELECT
                bc.copy_id,
                bc.book_id,
                bc.accession_number,
                bc.condition_status,
                bc.availability_status,

                b.title,
                b.isbn

            FROM book_copies bc

            INNER JOIN books b
                ON bc.book_id = b.book_id

            WHERE bc.copy_id = ?

            FOR UPDATE
            `,
            [copy_id]
        );


        if (copies.length === 0) {

            throw new Error(
                "Book copy not found"
            );
        }


        const copy = copies[0];


        if (copy.availability_status !== "Available") {

            throw new Error(
                `Book copy is currently ${copy.availability_status}`
            );
        }

        const [activeIssues] = await connection.query(
            `
            SELECT
                COUNT(*) AS total_active_issues
            FROM book_issues
            WHERE student_id = ?
              AND status = 'Issued'
            `,
            [student_id]
        );


        const MAX_BOOKS = 5;


        if (
            Number(activeIssues[0].total_active_issues)
            >= MAX_BOOKS
        ) {

            throw new Error(
                `Student cannot have more than ${MAX_BOOKS} active books`
            );
        }

        const [duplicateIssue] =
            await connection.query(
                `
                SELECT
                    issue_id
                FROM book_issues
                WHERE student_id = ?
                  AND copy_id = ?
                  AND status = 'Issued'
                LIMIT 1
                `,
                [
                    student_id,
                    copy_id
                ]
            );


        if (duplicateIssue.length > 0) {

            throw new Error(
                "This book copy is already issued to this student"
            );
        }

        const [pendingFines] =
            await connection.query(
                `
                SELECT
                    COALESCE(SUM(amount), 0) AS pending_amount
                FROM fines
                WHERE student_id = ?
                  AND payment_status = 'Pending'
                `,
                [student_id]
            );


        const pendingFine =
            Number(pendingFines[0].pending_amount || 0);


        const MAX_PENDING_FINE = 500;


        if (pendingFine > MAX_PENDING_FINE) {

            throw new Error(
                "Student has pending fines and cannot borrow another book"
            );
        }

        const issueDate = new Date();

        const dueDate = new Date(issueDate);

        dueDate.setDate(
            dueDate.getDate() + Number(loan_days)
        );

        const [issueResult] =
            await connection.query(
                `
                INSERT INTO book_issues
                (
                    student_id,
                    copy_id,
                    librarian_id,
                    issue_date,
                    due_date,
                    status,
                    renewal_count
                )
                VALUES
                (?, ?, ?, ?, ?, 'Issued',0)
                `,
                [
                    student_id,
                    copy_id,
                    librarian_id,
                    issueDate,
                    dueDate
                ]
            );


        const issueId =
            issueResult.insertId;

        await connection.query(
            `
            UPDATE book_copies
            SET availability_status = 'Issued'
            WHERE copy_id = ?
            `,
            [copy_id]
        );

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                notification_type
            )
            VALUES
            (?, ?, ?, ?)
            `,
            [
                student.user_id,
                "Book Issued",
                `The book "${copy.title}" has been issued to you. Due date: ${formatDate(dueDate)}`,
                "General"
            ]
        );

        await connection.commit();

        return await getIssueById(issueId);

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}

async function getIssueById(issueId) {

    const [rows] = await db.query(
        `
        ${issueSelectQuery}

        WHERE bi.issue_id = ?
        `,
        [issueId]
    );

    return rows[0] || null;
}

async function getAllIssues() {

    const [rows] = await db.query(
        `
        ${issueSelectQuery}

        ORDER BY bi.issue_id DESC
        `
    );

    return rows;
}

async function getActiveIssues() {

    const [rows] = await db.query(
        `
        ${issueSelectQuery}

        WHERE bi.status = 'Issued'

        ORDER BY bi.due_date ASC
        `
    );

    return rows;
}

async function getOverdueIssues() {

    const [rows] = await db.query(
        `
        ${issueSelectQuery}

        WHERE bi.status = 'Overdue'
          AND bi.due_date < CURDATE()

        ORDER BY bi.due_date ASC
        `
    );

    return rows.map(issue => {

        const dueDate =
            new Date(issue.due_date);

        const today =
            new Date();

        const difference =
            today.getTime() - dueDate.getTime();

        const overdueDays =
            Math.ceil(
                difference / (1000 * 60 * 60 * 24)
            );

        return {
            ...issue,
            overdue_days: overdueDays
        };

    });
}




async function getStudentIssues(studentId) {

    const [rows] = await db.query(
        `
        ${issueSelectQuery}

        WHERE bi.student_id = ?

        ORDER BY bi.issue_id DESC
        `,
        [studentId]
    );

    return rows;
}




async function getCopyIssueHistory(copyId) {

    const [rows] = await db.query(
        `
        ${issueSelectQuery}

        WHERE bi.copy_id = ?

        ORDER BY bi.issue_id DESC
        `,
        [copyId]
    );

    return rows;
}




async function getStudentActiveIssues(studentId) {

    const [rows] = await db.query(
        `
        ${issueSelectQuery}

        WHERE bi.student_id = ?
          AND bi.status = 'Issued'

        ORDER BY bi.due_date ASC
        `,
        [studentId]
    );

    return rows;
}



async function getIssueStatistics() {

    const [rows] = await db.query(
        `
        SELECT

            COUNT(*) AS total_issues,

            SUM(
                CASE
                    WHEN status = 'Issued'
                    THEN 1
                    ELSE 0
                END
            ) AS active_issues,

            SUM(
                CASE
                    WHEN status = 'Issued'
                     AND due_date < CURDATE()
                    THEN 1
                    ELSE 0
                END
            ) AS overdue_issues,

            SUM(
                CASE
                    WHEN status = 'Returned'
                    THEN 1
                    ELSE 0
                END
            ) AS returned_books

        FROM book_issues
        `
    );

    return rows[0];
}

function formatDate(date) {

    return new Date(date)
        .toISOString()
        .split("T")[0];
}

module.exports = {

    issueBook,

    getIssueById,

    getAllIssues,

    getActiveIssues,

    getOverdueIssues,

    getStudentIssues,

    getCopyIssueHistory,

    getStudentActiveIssues,

    getIssueStatistics

};