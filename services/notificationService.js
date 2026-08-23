const db = require("../config/db");

async function createNotification(
    userId,
    title,
    message,
    type = "General"
) {
    const query = `
        INSERT INTO notifications
        (user_id, title, message, notification_type)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        userId,
        title,
        message,
        type
    ]);

    return result;
}

async function getUserNotifications() {

    const query = `
        SELECT * FROM notifications      
    `;

    const [rows] = await db.execute(query);

    return rows;
}

module.exports = {
    createNotification,
    getUserNotifications
};