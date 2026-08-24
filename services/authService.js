const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

async function register(userData) {
    const {
        username,
        email,
        password,
        role,
        status,
        roll_number,
        student_name,
        department,
        year,
        semester,
        phone,
        address,
        admission_year
    } = userData;

    let formattedRollNumber = roll_number
        ? roll_number.trim().toUpperCase()
        : null;

    if (!username || !email || !password || !role) {
        throw new Error(
            "Username, email, password and role are required"
        );
    }

    if (!["Admin", "Librarian", "Student"].includes(role)) {
        throw new Error("Invalid role");
    }

    if (role === "Student") {
        if (!email) {
            throw new Error("Email is required for students");
        }

        if (!formattedRollNumber) {
            throw new Error("Roll number is required for students");
        }

        const rollNumberPattern =
    /^[0-9]{2}[A-Z]{2}[0-9][A-Z][A-Z0-9]{4}$/;

        if (!rollNumberPattern.test(formattedRollNumber)) {
            throw new Error(
                "Invalid roll number format. Example: 25KN1A05CB"
            );
        }
    }

    const [existingUser] = await db.query(
        `
        SELECT user_id
        FROM users
        WHERE email = ?
        `,
        [email]
    );

    if (existingUser.length > 0) {
        throw new Error(
            "Email already exists! Please login."
        );
    }

    const [existingUsername] = await db.query(
        `
        SELECT user_id
        FROM users
        WHERE username = ?
        `,
        [username]
    );

    if (existingUsername.length > 0) {
        throw new Error(
            `Username '${username}' already exists`
        );
    }

    if (role === "Student") {
        const [existingStudent] = await db.query(
            `
            SELECT student_id
            FROM students
            WHERE roll_number = ?
            `,
            [formattedRollNumber]
        );

        if (existingStudent.length > 0) {
            throw new Error(
                "Roll number already exists"
            );
        }
    }

    const hashedPassword =
        await bcrypt.hash(password, 10);

    const [result] = await db.query(
        `
        INSERT INTO users
        (
            username,
            email,
            password,
            role,
            status
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            username,
            email,
            hashedPassword,
            role,
            status || "Active"
        ]
    );

    const userId = result.insertId;

    if (role === "Student") {
        await db.query(
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
                formattedRollNumber,
                student_name || username,
                department || null,
                year || null,
                semester || null,
                phone || null,
                address || null,
                admission_year || null
            ]
        );
    }

    return {
        user_id: userId,
        username: username,
        email: email,
        role: role,
        status: status || "Active",
        ...(role === "Student" && {
            roll_number: formattedRollNumber
        })
    };
}

async function login(userData) {
    const {
        email,
        roll_number,
        password
    } = userData;

    const formattedRollNumber = roll_number
        ? roll_number.trim().toUpperCase()
        : null;

    if ((!email && !formattedRollNumber) || !password) {
        throw new Error(
            "Email or Roll Number and password are required"
        );
    }

    if (email && formattedRollNumber) {
        throw new Error(
            "Enter either Email or Roll Number, not both"
        );
    }

    const [rows] = await db.query(
        `
        SELECT
            u.user_id,
            u.username,
            u.email,
            u.password,
            u.role,
            u.status,
            s.student_id,
            s.roll_number,
            s.student_name,
            s.department,
            s.year,
            s.semester
        FROM users u
        LEFT JOIN students s
            ON u.user_id = s.user_id
        WHERE
            u.email = ?
            OR s.roll_number = ?
        LIMIT 1
        `,
        [
            email || null,
            formattedRollNumber || null
        ]
    );

    if (rows.length === 0) {
        throw new Error(
            "Invalid email/roll number or password"
        );
    }

    const user = rows[0];

    if (user.status !== "Active") {
        throw new Error(
            "Account is not active"
        );
    }

    const isMatch =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isMatch) {
        throw new Error(
            "Invalid email/roll number or password"
        );
    }

    const token = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            roll_number: user.roll_number || null
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            roll_number: user.roll_number || null,
            student_id: user.student_id || null,
            student_name: user.student_name || null,
            department: user.department || null,
            year: user.year || null,
            semester: user.semester || null
        }
    };
}

async function getCurrentUser() {
    const [rows] = await db.query(
        `
        SELECT *
        FROM users
        `
    );

    return rows;
}

function generateResetToken() {
    return crypto
        .randomBytes(32)
        .toString("hex");
}

async function forgotPassword(email) {
    if (!email) {
        throw new Error(
            "Email is required"
        );
    }

    const [users] = await db.query(
        `
        SELECT user_id, email
        FROM users
        WHERE email = ?
        `,
        [email]
    );

    if (users.length === 0) {
        throw new Error(
            "Email not found"
        );
    }

    const user = users[0];

    const resetToken =
        generateResetToken();

    const expiresAt =
        new Date(
            Date.now() + 15 * 60 * 1000
        );

    await db.query(
        `
        UPDATE users
        SET
            reset_token = ?,
            reset_token_expires = ?
        WHERE user_id = ?
        `,
        [
            resetToken,
            expiresAt,
            user.user_id
        ]
    );

    const resetLink =
        `http://localhost:5173/reset-password/${resetToken}`;

    return {
        resetLink,
        expiresAt
    };
}

const transporter =
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });

async function resetPassword(email) {
    if (!email) {
        throw new Error(
            "Email is required"
        );
    }

    const [users] = await db.query(
        `
        SELECT user_id, email
        FROM users
        WHERE email = ?
        `,
        [email]
    );

    if (users.length === 0) {
        return;
    }

    const user = users[0];

    const resetToken =
        generateResetToken();

    const expiresAt =
        new Date(
            Date.now() + 15 * 60 * 1000
        );

    await db.query(
        `
        UPDATE users
        SET
            reset_token = ?,
            reset_token_expires = ?
        WHERE user_id = ?
        `,
        [
            resetToken,
            expiresAt,
            user.user_id
        ]
    );

    const resetLink =
        `${process.env.RESET_PASSWORD_URL}/${resetToken}`;

    const message = `
Hello,

We received a request to reset your password
for your College Library System account.

Click the link below to reset your password:

${resetLink}

This link will expire in 15 minutes.

If you did not request this password reset,
please ignore this email.

Regards,
College Library System
`;

    await transporter.sendMail({
        from:
            `"College Library System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset Request",
        text: message
    });
}

module.exports = {
    register,
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword
};