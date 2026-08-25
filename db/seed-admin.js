/**
 * Creates (or promotes) the initial Admin account from environment
 * variables — never from a hardcoded value in source control.
 *
 * Usage:
 *   1. Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD (and optionally
 *      INITIAL_ADMIN_USERNAME) in your local .env — see .env.example.
 *   2. Run:  node db/seed-admin.js
 *
 * Safe to re-run: if an account with that email already exists, its
 * password is left untouched and it's just promoted to role=Admin,
 * status=Active if it wasn't already.
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("../config/db");

async function seedAdmin() {
    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const username = process.env.INITIAL_ADMIN_USERNAME || "admin";

    if (!email || !password) {
        console.error(
            "INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set in .env before running this script."
        );
        process.exitCode = 1;
        return;
    }

    if (password.length < 8) {
        console.error("INITIAL_ADMIN_PASSWORD must be at least 8 characters.");
        process.exitCode = 1;
        return;
    }

    const [existing] = await db.query(
        "SELECT user_id, role FROM users WHERE email = ?",
        [email]
    );

    if (existing.length > 0) {
        await db.query(
            "UPDATE users SET role = 'Admin', status = 'Active' WHERE user_id = ?",
            [existing[0].user_id]
        );
        console.log(`Existing account ${email} promoted to Admin (password unchanged).`);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
        `INSERT INTO users (username, email, password, role, status)
         VALUES (?, ?, ?, 'Admin', 'Active')`,
        [username, email, hashedPassword]
    );

    console.log(`Admin account created: ${email}`);
}

seedAdmin()
    .catch((err) => {
        console.error("Failed to seed admin account:", err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.end();
        process.exit(process.exitCode || 0);
    });
