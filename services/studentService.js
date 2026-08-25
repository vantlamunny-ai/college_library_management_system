const db = require("../config/db");

const STUDENT_SELECT_FIELDS = `
            s.student_id,
            s.user_id,
            s.roll_number,
            s.student_name,
            s.department,
            s.year,
            s.semester,
            s.phone,
            s.address,
            s.admission_year,
            s.status,
            s.bio,
            s.interests,
            s.profile_picture,
            s.created_at,

            u.username,
            u.email,
            u.role,
            u.status AS account_status,
            u.username_change_count,
            u.username_change_period_start
`;

async function getAllStudents() {

    const [rows] = await db.query(`
        SELECT
            ${STUDENT_SELECT_FIELDS}
        FROM students s

        INNER JOIN users u
            ON s.user_id = u.user_id

        ORDER BY s.student_id DESC
    `);

    return rows.map(withUsernameChangeStatus);
}


async function getStudentById(studentId) {

    const [rows] = await db.query(`
        SELECT
            ${STUDENT_SELECT_FIELDS}
        FROM students s

        INNER JOIN users u
            ON s.user_id = u.user_id

        WHERE s.student_id = ?
    `, [studentId]);

    return rows[0] ? withUsernameChangeStatus(rows[0]) : null;
}


async function getStudentByUserId(userId) {

    const [rows] = await db.query(`
        SELECT
            ${STUDENT_SELECT_FIELDS}
        FROM students s

        INNER JOIN users u
            ON s.user_id = u.user_id

        WHERE s.user_id = ?
    `, [userId]);

    return rows[0] ? withUsernameChangeStatus(rows[0]) : null;
}




const bcrypt = require("bcrypt")

async function createStudent(studentData) {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const {
            username,
            email,
            password,
            roll_number,
            student_name,
            department,
            year,
            semester,
            phone,
            address,
            admission_year
        } = studentData;

       

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const [userResult] = await connection.query(
            `
            INSERT INTO users
            (
                username,
                email,
                password,
                role
            )
            VALUES (?, ?, ?, 'Student')
            `,
            [
                username,
                email,
                hashedPassword
            ]
        );

        const userId = userResult.insertId;

        const [studentResult] =
            await connection.query(
                `
                INSERT INTO students
                (
                    user_id,
                    roll_number,
                    student_name,
                    department,
                    year,
                    semester,
                    phone,
                    address,
                    admission_year
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    roll_number,
                    student_name,
                    department,
                    year,
                    semester,
                    phone,
                    address,
                    admission_year
                ]
            );

        await connection.commit();

        return getStudentById(
            studentResult.insertId
        );

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
}


async function updateStudent(studentId, studentData) {

    const {
        student_name,
        department,
        year,
        semester,
        phone,
        address,
        status
    } = studentData;

    const [result] = await db.query(
        `
        UPDATE students

        SET
            student_name = ?,
            department = ?,
            year = ?,
            semester = ?,
            phone = ?,
            address = ?,
            status = ?

        WHERE student_id = ?
        `,
        [
            student_name,
            department,
            year,
            semester,
            phone,
            address,
            status,
            studentId
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return getStudentById(studentId);
}


const VALID_ACCOUNT_STATUSES = ["Active", "Inactive", "Blocked"];

async function updateAccountStatus(studentId, status) {

    if (!VALID_ACCOUNT_STATUSES.includes(status)) {
        throw new Error(
            "Invalid status. Must be one of: Active, Inactive, Blocked"
        );
    }

    const [students] = await db.query(
        `
        SELECT user_id
        FROM students
        WHERE student_id = ?
        `,
        [studentId]
    );

    if (students.length === 0) {
        return null;
    }

    await db.query(
        `
        UPDATE users
        SET status = ?
        WHERE user_id = ?
        `,
        [status, students[0].user_id]
    );

    return getStudentById(studentId);
}


async function deleteStudent(studentId) {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const [studentRows] =
            await connection.query(
                `
                SELECT user_id
                FROM students
                WHERE student_id = ?
                `,
                [studentId]
            );

        if (studentRows.length === 0) {
            return false;
        }

        const userId =
            studentRows[0].user_id;

        await connection.query(
            `
            DELETE FROM students
            WHERE student_id = ?
            `,
            [studentId]
        );

        await connection.query(
            `
            DELETE FROM users
            WHERE user_id = ?
            `,
            [userId]
        );

        await connection.commit();

        return true;
    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
}

const USERNAME_PATTERN = /^[A-Za-z0-9._]+$/;
const MAX_USERNAME_CHANGES_PER_YEAR = 7;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Turns the raw username_change_count/period_start columns into what the
 * UI actually needs — a display never has to re-derive the "has the
 * window expired" logic itself, since that's also what changeUsername()
 * enforces server-side. A window with no changes yet, or one whose year
 * has elapsed, always reports the full allowance.
 */
function usernameChangeStatus(count, periodStart) {
    const expired = !periodStart || Date.now() - new Date(periodStart).getTime() >= YEAR_MS;
    const used = expired ? 0 : count;
    return {
        username_changes_used: used,
        username_changes_remaining: MAX_USERNAME_CHANGES_PER_YEAR - used,
        username_changes_reset_at: expired || !periodStart
            ? null
            : new Date(new Date(periodStart).getTime() + YEAR_MS).toISOString().slice(0, 10),
    };
}

function withUsernameChangeStatus(row) {
    const { username_change_count, username_change_period_start, ...rest } = row;
    return { ...rest, ...usernameChangeStatus(username_change_count, username_change_period_start) };
}

/** Self-service profile edit — bio, interests, and profile picture only. */
const PROFILE_EDITABLE_FIELDS = ["bio", "interests", "profile_picture"];

async function updateMyProfile(userId, profileData) {

    const [students] = await db.query(
        `SELECT student_id FROM students WHERE user_id = ?`,
        [userId]
    );

    if (students.length === 0) {
        throw new Error("No student profile is linked to this account yet");
    }

    // Partial update: only the fields actually present in the request are
    // touched. The avatar picker, for example, sends only
    // profile_picture — treating every field as "set" here would silently
    // wipe out bio/interests just because they weren't part of that call.
    const presentFields = PROFILE_EDITABLE_FIELDS.filter(
        (field) => Object.prototype.hasOwnProperty.call(profileData, field)
    );

    if (presentFields.length > 0) {
        const setClause = presentFields.map((field) => `${field} = ?`).join(", ");
        const values = presentFields.map((field) => profileData[field] || null);

        await db.query(
            `UPDATE students SET ${setClause} WHERE user_id = ?`,
            [...values, userId]
        );
    }

    return getStudentByUserId(userId);
}

/**
 * Self-service username change, rate-limited to 7 per rolling year. The
 * limit is enforced here against the DB row inside the same query that
 * reads it — see the ER_DUP_ENTRY catch below for the race-safety net on
 * the uniqueness side, matching the pattern used at registration.
 */
async function changeUsername(userId, newUsername) {

    if (!newUsername || !USERNAME_PATTERN.test(newUsername)) {
        throw new Error(
            "Username may only contain letters, numbers, '.' and '_' — no spaces or other symbols"
        );
    }

    const [users] = await db.query(
        `SELECT username, username_change_count, username_change_period_start
         FROM users WHERE user_id = ?`,
        [userId]
    );

    if (users.length === 0) {
        throw new Error("Account not found");
    }

    const current = users[0];

    if (current.username.toLowerCase() === newUsername.toLowerCase()) {
        throw new Error("That's already your username");
    }

    const status = usernameChangeStatus(current.username_change_count, current.username_change_period_start);

    if (status.username_changes_remaining <= 0) {
        throw new Error(
            `You've used all ${MAX_USERNAME_CHANGES_PER_YEAR} username changes allowed this year. You can change it again after ${status.username_changes_reset_at}.`
        );
    }

    const [existing] = await db.query(
        `SELECT user_id FROM users WHERE LOWER(username) = LOWER(?)`,
        [newUsername]
    );

    if (existing.length > 0) {
        throw new Error("Username already exists. Please choose another username.");
    }

    const windowExpired = !current.username_change_period_start
        || Date.now() - new Date(current.username_change_period_start).getTime() >= YEAR_MS;
    const newCount = windowExpired ? 1 : current.username_change_count + 1;
    const newPeriodStart = windowExpired ? new Date() : current.username_change_period_start;

    try {
        await db.query(
            `UPDATE users
             SET username = ?, username_change_count = ?, username_change_period_start = ?
             WHERE user_id = ?`,
            [newUsername, newCount, newPeriodStart, userId]
        );
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            throw new Error("Username already exists. Please choose another username.");
        }
        throw error;
    }

    return getStudentByUserId(userId);
}

module.exports = {
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    createStudent,
    updateStudent,
    updateAccountStatus,
    updateMyProfile,
    changeUsername,
    deleteStudent

};