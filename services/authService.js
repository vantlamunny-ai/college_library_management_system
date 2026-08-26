const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const USERNAME_PATTERN = /^[A-Za-z0-9._]+$/;

const VALID_ROLES = ["Admin", "Librarian", "Student"];

// users.username is NOT NULL UNIQUE, but Librarian/Admin self-registration
// only collects email + password — no username is ever typed for those
// roles. This derives one from the email's local part so the DB constraint
// is satisfied without asking for information the form never requested,
// and de-duplicates against existing usernames (case-insensitively).
async function generateUsernameFromEmail(email) {
    const base =
        (email.split("@")[0] || "user")
            .replace(/[^A-Za-z0-9._]/g, ".")
        || "user";

    let candidate = base;
    let suffix = 1;

    while (true) {
        const [rows] = await db.query(
            `SELECT user_id FROM users WHERE LOWER(username) = LOWER(?)`,
            [candidate]
        );

        if (rows.length === 0) return candidate;

        suffix += 1;
        candidate = `${base}${suffix}`;
    }
}

async function register(userData) {
    const {
        username,
        email,
        password,
        status,
        roll_number,
        student_name,
        department,
        year,
        semester,
        interests,
        phone,
        address,
        admission_year,
        role: requestedRole
    } = userData;

    const role =
        VALID_ROLES.includes(requestedRole)
            ? requestedRole
            : "Student";

    if (!email || !password) {
        throw new Error(
            "Email and password are required"
        );
    }

    let finalUsername;
    let formattedRollNumber = null;

    if (role === "Student") {

        if (!username) {
            throw new Error(
                "Username is required"
            );
        }

        if (!USERNAME_PATTERN.test(username)) {
            throw new Error(
                "Username may only contain letters, numbers, '.' and '_' — no spaces or other symbols"
            );
        }

        finalUsername = username;

        formattedRollNumber = roll_number
            ? roll_number.trim().toUpperCase()
            : null;

        if (!formattedRollNumber) {
            throw new Error(
                "Roll number is required for students"
            );
        }

        const rollNumberPattern =
            /^[0-9]{2}[A-Z]{2}[0-9][A-Z][A-Z0-9]{4}$/;

        if (!rollNumberPattern.test(formattedRollNumber)) {
            throw new Error(
                "Invalid roll number format. Example: 25KN1A05CB"
            );
        }

    } else {

        // Librarian / Admin — email + password only.
        finalUsername =
            await generateUsernameFromEmail(email);
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

    if (role === "Student") {

        const [existingUsername] = await db.query(
            `
            SELECT user_id
            FROM users
            WHERE LOWER(username) = LOWER(?)
            `,
            [finalUsername]
        );

        if (existingUsername.length > 0) {
            throw new Error(
                "Username already exists. Please choose another username."
            );
        }

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

    let userId;

    try {

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
                finalUsername,
                email,
                hashedPassword,
                role,
                status || "Active"
            ]
        );

        userId = result.insertId;

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {

            if (
                String(error.sqlMessage)
                    .includes("username")
            ) {
                throw new Error(
                    "Username already exists. Please choose another username."
                );
            }

            throw new Error(
                "Email already exists! Please login."
            );
        }

        throw error;
    }

    if (role === "Student") {

        try {

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
                    interests,
                    phone,
                    address,
                    admission_year
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    formattedRollNumber,
                    student_name || finalUsername,
                    department || null,
                    year || null,
                    semester || null,
                    interests || null,
                    phone || null,
                    address || null,
                    admission_year || null
                ]
            );

        } catch (error) {

            await db.query(
                "DELETE FROM users WHERE user_id = ?",
                [userId]
            );

            if (error.code === "ER_DUP_ENTRY") {
                throw new Error(
                    "Roll number already exists"
                );
            }

            throw error;
        }

    } else if (role === "Librarian") {

        try {

            await db.query(
                `
                INSERT INTO librarians
                (
                    user_id,
                    employee_id,
                    librarian_name,
                    status
                )
                VALUES (?, ?, ?, 'Active')
                `,
                [
                    userId,
                    `EMP-${userId}`,
                    finalUsername
                ]
            );

        } catch (error) {

            await db.query(
                "DELETE FROM users WHERE user_id = ?",
                [userId]
            );

            throw error;
        }
    }

    return {
        user_id: userId,
        username: finalUsername,
        email: email,
        role: role,
        status: status || "Active",
        roll_number: formattedRollNumber
    };
}


async function login(userData) {

    const {
        email,
        roll_number,
        username,
        password,
        role
    } = userData;

    const formattedRollNumber =
        roll_number
            ? roll_number.trim().toUpperCase()
            : null;

    const identifierCount =
        [
            email,
            formattedRollNumber,
            username
        ].filter(Boolean).length;

    if (identifierCount === 0 || !password) {

        throw new Error(
            "An email, roll number, or username, plus password, are required"
        );
    }

    if (identifierCount > 1) {

        throw new Error(
            "Enter only one of: email, roll number, or username"
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
            OR u.username = ?
        LIMIT 1
        `,
        [
            email || null,
            formattedRollNumber || null,
            username || null
        ]
    );

    if (rows.length === 0) {

        throw new Error(
            "Invalid credentials"
        );
    }

    const user = rows[0];

    const isMatch =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isMatch) {

        throw new Error(
            "Invalid credentials"
        );
    }

    if (user.status === "Blocked") {

        throw new Error(
            "Your account has been blocked. Please contact the library administrator."
        );
    }

    if (user.status === "Inactive") {

        throw new Error(
            "Your account is inactive. Please contact the library administrator."
        );
    }

    if (user.status !== "Active") {

        throw new Error(
            "Account is not active"
        );
    }

    if (role && role !== user.role) {

        throw new Error(
            "The selected role does not match this account. Please choose the correct role and try again."
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


async function getCurrentUser(userId) {

    const [rows] = await db.query(
        `
        SELECT
            user_id,
            username,
            email,
            role,
            status,
            created_at
        FROM users
        WHERE user_id = ?
        `,
        [userId]
    );

    return rows[0] || null;
}


// Generate password reset token
function generateResetToken() {

    return crypto
        .randomBytes(32)
        .toString("hex");
}


// Email configuration

const emailConfigured =
    Boolean(
        process.env.EMAIL_USER ||
        process.env.EMAIL_APP_PASSWORD
    );


const transporter =
    emailConfigured
        ? nodemailer.createTransport({
            service: "gmail",

            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        })
        : null;


/**
 * Step 1 of the reset flow.
 *
 * User enters their email in frontend.
 *
 * Backend checks that email in users table.
 *
 * If email exists:
 *      generate reset token
 *      save token
 *      create reset link
 *      send email to that user's email
 */
async function requestPasswordReset(email) {
  if (!email) throw new Error("Email is required");

  const [users] = await db.query(
    `SELECT user_id, email FROM users WHERE email = ?`,
    [email]
  );

  if (users.length === 0) {
    return { emailSent: false, resetLink: null };
  }

  const user = users[0];
  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.query(
    `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?`,
    [resetToken, expiresAt, user.user_id]
  );

  const baseUrl = process.env.RESET_PASSWORD_URL || "http://localhost:5173/reset-password";
  const resetLink = `${baseUrl}/${resetToken}`;

  if (!emailConfigured) return { emailSent: false, resetLink };

  const message = `
Hello,

We received a request to reset your password.
Click the link below to reset your password:

${resetLink}

This link will expire in 15 minutes.

Regards,
College Library System
`;

  try {
    await transporter.sendMail({
      from: `"College Library System" <${process.env.EMAIL_USER}>`,
      to: user.email,   // 👈 goes to *their* email
      subject: "Password Reset Request",
      text: message
    });
    return { emailSent: true, resetLink: null };
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
    return { emailSent: false, resetLink };
  }
}



/**
 * Step 2 — consumes the token from
 * the emailed/returned link.
 */
async function resetPasswordWithToken(
    token,
    newPassword
) {

    if (!token || !newPassword) {

        throw new Error(
            "Token and new password are required"
        );
    }


    if (newPassword.length < 8) {

        throw new Error(
            "Password must be at least 8 characters"
        );
    }


    const [users] = await db.query(
        `
        SELECT
            user_id,
            email
        FROM users
        WHERE reset_token = ?
          AND reset_token_expires > NOW()
        `,
        [token]
    );


    if (users.length === 0) {

        throw new Error(
            "This reset link is invalid or has expired. Please request a new one."
        );
    }


    const user = users[0];


    const hashedPassword =
        await bcrypt.hash(
            newPassword,
            10
        );


    await db.query(
        `
        UPDATE users
        SET
            password = ?,
            reset_token = NULL,
            reset_token_expires = NULL
        WHERE user_id = ?
        `,
        [
            hashedPassword,
            user.user_id
        ]
    );


    // Send confirmation email

    if (emailConfigured && transporter) {

        const message = `
Hello,

Your password has been successfully reset for your College Library System account.

If you did not perform this action, please contact the library administrator immediately.

Regards,
College Library System
        `;


        try {

            await transporter.sendMail({

                from:
                    `"College Library System" <${process.env.EMAIL_USER}>`,

                // IMPORTANT:
                // Confirmation also goes to
                // the user's email.

                to: user.email,

                subject:
                    "Password Reset Confirmation",

                text:
                    message
            });


            console.log(
                "Confirmation email sent successfully"
            );


        } catch (error) {

            console.error(
                "Failed to send confirmation email:",
                error.message
            );
        }
    }


    return {
        success: true,
        message: "Password reset successfully"
    };
}


module.exports = {

    register,

    login,

    getCurrentUser,

    requestPasswordReset,

    resetPasswordWithToken
};