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

    await notificationService.createNotification(
        student_id,
        "Fine Generated",
        `A fine of ₹${amount} has been generated for ${fine_type}. Please clear your pending library fine.`,
        "Fine"
    );


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


async function payFine(fineId) {

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
    payFine
};