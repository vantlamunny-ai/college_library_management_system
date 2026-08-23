const db = require("../config/db");
const createReturn = async (
    issue_id,
    return_date,
    condition_status,
    remarks,
    processed_by
) => {
    const [issues] = await db.query(
        `SELECT issue_id, copy_id, status
         FROM book_issues
         WHERE issue_id = ?`,
        [issue_id]
    );

    if (issues.length === 0) {
        throw new Error("Book issue not found");
    }

    const issue = issues[0];
    if (issue.status === "Returned") {
        throw new Error("Book is already returned");
    }

    const [result] = await db.query(
        `INSERT INTO book_returns
        (issue_id, return_date, condition_status, remarks, processed_by)
        VALUES (?, ?, ?, ?, ?)`,
        [
            issue_id,
            return_date,
            condition_status,
            remarks,
            processed_by
        ]
    );

    await db.query(
        `UPDATE book_issues
         SET status = 'Returned'
         WHERE issue_id = ?`,
        [issue_id]
    );

    let availability_status = "Available";

    if (condition_status === "Damaged") {
        availability_status = "Damaged";
    }

    if (condition_status === "Lost") {
        availability_status = "Lost";
    }
    await db.query(
        `UPDATE book_copies
         SET availability_status = ?,
             condition_status = ?
         WHERE copy_id = ?`,
        [
            availability_status,
            condition_status,
            issue.copy_id
        ]
    );

    return {
        return_id: result.insertId,
        issue_id,
        return_date,
        condition_status,
        remarks,
        processed_by
    };
};

const getAllReturns = async () => {

    const [rows] = await db.query(
        `SELECT *
         FROM book_returns
         ORDER BY return_id DESC`
    );

    return rows;
};
const getReturnById = async (return_id) => {

    const [rows] = await db.query(
        `SELECT *
         FROM book_returns
         WHERE return_id = ?`,
        [return_id]
    );

    if (rows.length === 0) {
        throw new Error("Return record not found");
    }

    return rows[0];
};

const updateReturn = async (
    return_id,
    return_date,
    condition_status,
    remarks,
    processed_by
) => {

    const [returns] = await db.query(
        `SELECT issue_id
         FROM book_returns
         WHERE return_id = ?`,
        [return_id]
    );

    if (returns.length === 0) {
        throw new Error("Return record not found");
    }

    const issue_id = returns[0].issue_id;

    await db.query(
        `UPDATE book_returns
         SET return_date = ?,
             condition_status = ?,
             remarks = ?,
             processed_by = ?
         WHERE return_id = ?`,
        [
            return_date,
            condition_status,
            remarks,
            processed_by,
            return_id
        ]
    );

    const [issues] = await db.query(
        `SELECT copy_id
         FROM book_issues
         WHERE issue_id = ?`,
        [issue_id]
    );

    if (issues.length > 0) {

        const copy_id = issues[0].copy_id;

        let availability_status = "Available";

        if (condition_status === "Damaged") {
            availability_status = "Damaged";
        }

        if (condition_status === "Lost") {
            availability_status = "Lost";
        }

        await db.query(
            `UPDATE book_copies
             SET availability_status = ?,
                 condition_status = ?
             WHERE copy_id = ?`,
            [
                availability_status,
                condition_status,
                copy_id
            ]
        );
    }

    return {
        return_id,
        issue_id,
        return_date,
        condition_status,
        remarks,
        processed_by
    };
};

const deleteReturn = async (return_id) => {

    const [returns] = await db.query(
        `SELECT issue_id
         FROM book_returns
         WHERE return_id = ?`,
        [return_id]
    );

    if (returns.length === 0) {
        throw new Error("Return record not found");
    }

    const issue_id = returns[0].issue_id;

    const [issues] = await db.query(
        `SELECT copy_id
         FROM book_issues
         WHERE issue_id = ?`,
        [issue_id]
    );
    await db.query(
        `DELETE FROM book_returns
         WHERE return_id = ?`,
        [return_id]
    );
    await db.query(
        `UPDATE book_issues
         SET status = 'Issued'
         WHERE issue_id = ?`,
        [issue_id]
    );
    if (issues.length > 0) {

        await db.query(
            `UPDATE book_copies
             SET availability_status = 'Issued'
             WHERE copy_id = ?`,
            [issues[0].copy_id]
        );
    }

    return {
        message: "Return deleted successfully"
    };
};


module.exports = {
    createReturn,
    getAllReturns,
    getReturnById,
    updateReturn,
    deleteReturn
};