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

async function getUserNotifications(userId) {

    const query = `
        SELECT *
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [userId]);

    return rows;
}

async function markAsRead(notificationId, userId) {

    const [result] = await db.execute(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE notification_id = ?
          AND user_id = ?
        `,
        [notificationId, userId]
    );

    if (result.affectedRows === 0) {
        throw new Error("Notification not found");
    }

    return { notification_id: notificationId, is_read: true };
}

async function markAllAsRead(userId) {

    const [result] = await db.execute(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = ?
          AND is_read = FALSE
        `,
        [userId]
    );

    return { updated: result.affectedRows };
}

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead
};
