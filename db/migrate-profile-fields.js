/**
 * One-time (idempotent) migration adding the student profile fields and
 * username-change tracking columns to an already-existing database.
 * schema.sql's CREATE TABLE IF NOT EXISTS won't retroactively add columns
 * to a table that already exists, so this ALTERs the live tables instead.
 * Safe to re-run — each column is only added if missing.
 */
const db = require("../config/db");

async function columnExists(table, column) {
    const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
    if (await columnExists(table, column)) {
        console.log(`SKIP  ${table}.${column} already exists`);
        return;
    }
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`ADDED ${table}.${column}`);
}

async function run() {
    await addColumnIfMissing("users", "username_change_count", "INT NOT NULL DEFAULT 0");
    await addColumnIfMissing("users", "username_change_period_start", "DATE NULL");
    await addColumnIfMissing("students", "bio", "TEXT NULL");
    await addColumnIfMissing("students", "interests", "VARCHAR(500) NULL");
    await addColumnIfMissing("students", "profile_picture", "MEDIUMTEXT NULL");
    console.log("Migration complete.");
    process.exit(0);
}

run().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
