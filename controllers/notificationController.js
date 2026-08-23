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

module.exports = {
    getMyNotifications
};