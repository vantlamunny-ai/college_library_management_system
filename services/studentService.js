const db = require("../config/db");

async function getAllStudents() {

    const [rows] = await db.query(`
        SELECT
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
            s.created_at,

            u.username,
            u.email,
            u.role,
            u.status AS account_status

        FROM students s

        INNER JOIN users u
            ON s.user_id = u.user_id

        ORDER BY s.student_id DESC
    `);

    return rows;
}


async function getStudentById(studentId) {

    const [rows] = await db.query(`
        SELECT
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
            s.created_at,

            u.username,
            u.email,
            u.role,
            u.status AS account_status

        FROM students s

        INNER JOIN users u
            ON s.user_id = u.user_id

        WHERE s.student_id = ?
    `, [studentId]);

    return rows[0] || null;
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

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
   
};