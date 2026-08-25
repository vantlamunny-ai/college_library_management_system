const fineService = require("../services/fineService");

async function createFine(req, res, next) {
    try {
        const fine = await fineService.createFine(req.body);

        res.status(201).json({
            success: true,
            message: "Fine created and notification sent successfully",
            data: fine
        });
    } catch (error) {
        console.error("CREATE FINE ERROR:", error);
        next(error);
    }
}

async function payFine(req, res) {

    try {

        const { fineId } = req.params;

        if (!fineId) {
            return res.status(400).json({
                success: false,
                message: "Fine ID is required"
            });
        }

        const result = await fineService.payFine(fineId, req.user.user_id);

        return res.status(200).json(result);

    } catch (error) {

        console.error("Pay Fine Controller Error:", error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function getAllFines(req, res, next) {

    try {

        const fines = await fineService.getAllFines();

        res.status(200).json({
            success: true,
            data: fines
        });

    } catch (error) {

        next(error);

    }
}

async function getMyFines(req, res, next) {

    try {

        const fines = await fineService.getMyFines(req.user.user_id);

        res.status(200).json({
            success: true,
            data: fines
        });

    } catch (error) {

        next(error);

    }
}

module.exports = {
    createFine,
    getAllFines,
    getMyFines,
    payFine
};