const db = require("../config/db");
const notificationService = require("./notificationService");

async function createFine(fineData) {

    const {
        issue_id,
        student_id,
        fine_type,
        amount,
        reason
    } = fineData;

    const query = `
        INSERT INTO fines
        (
            issue_id,
            student_id,
            fine_type,
            amount,
            reason,
            payment_status
        )
        VALUES (?, ?, ?, ?, ?, 'Pending')
    `;

    const [result] = await db.execute(query, [
        issue_id,
        student_id,
        fine_type,
        amount,
        reason
    ]);

    // notifications.user_id references users, not students — student_id
    // and user_id are different columns, so the linked account has to be
    // looked up rather than reused directly.
    const [studentRows] = await db.query(
        `SELECT user_id FROM students WHERE student_id = ?`,
        [student_id]
    );

    if (studentRows.length > 0) {
        await notificationService.createNotification(
            studentRows[0].user_id,
            "Fine Generated",
            `A fine of ₹${amount} has been generated for ${fine_type}. Please clear your pending library fine.`,
            "Fine"
        );
    }


    return {
        fine_id: result.insertId,
        issue_id,
        student_id,
        fine_type,
        amount,
        reason,
        payment_status: "Pending"
    };
}

async function getAllFines() {

    const query = `
        SELECT
            fine_id,
            issue_id,
            student_id,
            fine_type,
            amount,
            reason,
            payment_status,
            paid_date,
            created_at
        FROM fines
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query);

    return rows;
}

async function getMyFines(userId) {

    const [students] = await db.query(
        `SELECT student_id FROM students WHERE user_id = ?`,
        [userId]
    );

    // No linked student profile yet — nothing to show rather than an error.
    if (students.length === 0) return [];

    const [rows] = await db.query(
        `
        SELECT
            f.fine_id,
            f.issue_id,
            b.title,
            f.fine_type,
            f.amount,
            f.reason,
            f.payment_status,
            f.paid_date,
            f.created_at
        FROM fines f
        INNER JOIN book_issues bi
            ON f.issue_id = bi.issue_id
        INNER JOIN book_copies bc
            ON bi.copy_id = bc.copy_id
        INNER JOIN books b
            ON bc.book_id = b.book_id
        WHERE f.student_id = ?
        ORDER BY f.created_at DESC
        `,
        [students[0].student_id]
    );

    return rows;
}


async function payFine(fineId, userId) {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const [fineRows] = await connection.execute(
            `
            SELECT
                f.fine_id,
                f.student_id,
                f.amount,
                f.payment_status,
                s.user_id
            FROM fines f
            INNER JOIN students s
                ON f.student_id = s.student_id
            WHERE f.fine_id = ?
            `,
            [fineId]
        );

        if (fineRows.length === 0) {
            throw new Error("Fine not found");
        }

        const fine = fineRows[0];

        // Route is Student-role-gated, but that only proves *a* student is
        // calling it — this proves it's the student who actually owes it,
        // so one student can't clear another's balance by guessing an ID.
        if (fine.user_id !== userId) {
            throw new Error("You can only pay your own fines");
        }

        if (fine.payment_status === "Paid") {
            throw new Error("Fine is already paid");
        }

        if (fine.payment_status === "Waived") {
            throw new Error("Fine has been waived");
        }

        await connection.execute(
            `
            UPDATE fines
            SET
                payment_status = 'Paid',
                paid_date = CURRENT_DATE
            WHERE fine_id = ?
            `,
            [fineId]
        );

        await connection.execute(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                notification_type,
                is_read
            )
            VALUES (?, ?, ?, 'Fine', FALSE)
            `,
            [
                fine.user_id,
                "Fine Payment Successful",
                `Your fine of ₹${fine.amount} has been paid successfully.`
            ]
        );

        await connection.commit();

        return {
            success: true,
            message: "Fine paid successfully",
            fine_id: fine.fine_id,
            amount: fine.amount
        };

    } catch (error) {

        await connection.rollback();

        console.error("Pay Fine Error:", error);

        throw error;

    } finally {

        connection.release();
    }
}


module.exports = {
    createFine,
    getAllFines,
    getMyFines,
    payFine
};