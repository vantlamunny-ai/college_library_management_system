const reportService = require("../services/reportService");

async function getBookReport(req, res, next) {

    try {

        const report =
            await reportService.getBookReport();

        res.json({
            success: true,
            count: report.length,
            message: "Book report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}
async function getIssueReport(req, res, next) {

    try {

        const report =
            await reportService.getIssueReport();

        res.json({
            success: true,
            count: report.length,
            message: "Issue report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}
async function getReturnReport(req, res, next) {

    try {

        const report =
            await reportService.getReturnReport();

        res.json({
            success: true,
            count: report.length,
            message: "Return report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}

async function getStudentReport(req, res, next) {

    try {

        const report =
            await reportService.getStudentReport();

        res.json({
            success: true,
            count: report.length,
            message: "Student report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}

async function getFineReport(req, res, next) {

    try {

        const report =
            await reportService.getFineReport();

        res.json({
            success: true,
            count: report.length,
            message: "Fine report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}

async function getReservationReport(req, res, next) {

    try {

        const report =
            await reportService.getReservationReport();

        res.json({
            success: true,
            count: report.length,
            message: "Reservation report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}

async function getDashboardReport(req, res, next) {

    try {

        const report =
            await reportService.getDashboardReport();

        res.json({
            success: true,
            message: "Dashboard report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}

async function getCopyReport(req, res, next) {

    try {

        const report =
            await reportService.getCopyReport();

        res.json({
            success: true,
            count: report.length,
            message: "Copy report fetched successfully",
            data: report
        });

    } catch (error) {

        next(error);

    }
}


module.exports = {
    getBookReport,
    getIssueReport,
    getReturnReport,
    getStudentReport,
    getFineReport,
    getReservationReport,
    getDashboardReport,
    getCopyReport
};