const db = require("../config/db");
const bcrypt = require("bcrypt");

async function getLibrarianByUserId(userId) {

    const [rows] = await db.query(
        `
        SELECT
            l.librarian_id,
            l.user_id,
            l.employee_id,
            l.librarian_name,
            l.phone,
            l.designation,
            l.joining_date,
            l.status,

            u.username,
            u.email,
            u.role

        FROM librarians l

        INNER JOIN users u
            ON l.user_id = u.user_id

        WHERE l.user_id = ?
        `,
        [userId]
    );

    return rows[0] || null;
}

async function getAllLibrarians() {

    const [rows] = await db.query(
        `
        SELECT
            l.librarian_id,
            l.user_id,
            l.employee_id,
            l.librarian_name,
            l.phone,
            l.designation,
            l.joining_date,
            l.status,
            l.created_at,

            u.username,
            u.email,
            u.status AS account_status

        FROM librarians l

        INNER JOIN users u
            ON l.user_id = u.user_id

        ORDER BY l.librarian_id DESC
        `
    );

    return rows;
}

async function getLibrarianById(librarianId) {

    const [rows] = await db.query(
        `
        SELECT
            l.librarian_id,
            l.user_id,
            l.employee_id,
            l.librarian_name,
            l.phone,
            l.designation,
            l.joining_date,
            l.status,

            u.username,
            u.email,
            u.status AS account_status

        FROM librarians l

        INNER JOIN users u
            ON l.user_id = u.user_id

        WHERE l.librarian_id = ?
        `,
        [librarianId]
    );

    return rows[0] || null;
}

/**
 * Admin-only account provisioning. Creates the login (users) and the
 * librarians record in one transaction, hashing the password the same
 * way self-registration does. The generated password is returned once
 * here so the Admin can hand it to the new librarian — it is never
 * stored or logged in plain text, and no endpoint ever returns it again.
 */
async function createLibrarian(data) {

    const {
        username,
        email,
        password,
        employee_id,
        librarian_name,
        phone,
        designation,
        joining_date
    } = data;

    if (!username || !email || !password || !employee_id || !librarian_name) {
        throw new Error(
            "username, email, password, employee_id and librarian_name are required"
        );
    }

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const [existingEmail] = await connection.query(
            `SELECT user_id FROM users WHERE email = ?`,
            [email]
        );

        if (existingEmail.length > 0) {
            throw new Error("Email already exists");
        }

        const [existingUsername] = await connection.query(
            `SELECT user_id FROM users WHERE username = ?`,
            [username]
        );

        if (existingUsername.length > 0) {
            throw new Error(`Username '${username}' already exists`);
        }

        const [existingEmployeeId] = await connection.query(
            `SELECT librarian_id FROM librarians WHERE employee_id = ?`,
            [employee_id]
        );

        if (existingEmployeeId.length > 0) {
            throw new Error("Employee ID already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult] = await connection.query(
            `
            INSERT INTO users (username, email, password, role, status)
            VALUES (?, ?, ?, 'Librarian', 'Active')
            `,
            [username, email, hashedPassword]
        );

        const userId = userResult.insertId;

        const [librarianResult] = await connection.query(
            `
            INSERT INTO librarians
            (user_id, employee_id, librarian_name, phone, designation, joining_date, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Active')
            `,
            [
                userId,
                employee_id,
                librarian_name,
                phone || null,
                designation || null,
                joining_date || null
            ]
        );

        await connection.commit();

        return {
            librarian_id: librarianResult.insertId,
            user_id: userId,
            username,
            email,
            employee_id,
            librarian_name,
            role: "Librarian",
            status: "Active"
        };

    } catch (error) {

        await connection.rollback();
        throw error;

    } finally {

        connection.release();
    }
}

module.exports = {
    getLibrarianByUserId,
    getAllLibrarians,
    getLibrarianById,
    createLibrarian
};
