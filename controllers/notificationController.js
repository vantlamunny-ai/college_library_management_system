const notificationService =
    require("../services/notificationService");

async function getMyNotifications(req, res, next) {

    try {

        const userId = req.user.user_id;

        const notifications =
            await notificationService.getUserNotifications(userId);

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {

        console.log("NOTIFICATION ERROR:", error);

        next(error);
    }
}

async function markAsRead(req, res, next) {

    try {

        const result = await notificationService.markAsRead(
            req.params.id,
            req.user.user_id
        );

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: result
        });

    } catch (error) {

        next(error);
    }
}

async function markAllAsRead(req, res, next) {

    try {

        const result = await notificationService.markAllAsRead(
            req.user.user_id
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            data: result
        });

    } catch (error) {

        next(error);
    }
}

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
