const issueService =
    require("../services/issueService");

async function issueBook(req, res, next) {

    try {

        const issue =
            await issueService.issueBook(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Book issued successfully",
            data: issue
        });

    } catch (error) {

        next(error);

    }
}

async function getIssues(req, res, next) {

    try {

        const issues =
            await issueService.getAllIssues();

        res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });

    } catch (error) {

        next(error);

    }
}

async function getIssue(req, res, next) {

    try {

        const issue =
            await issueService.getIssueById(
                req.params.id
            );

        if (!issue) {

            return res.status(404).json({
                success: false,
                message: "Issue record not found"
            });

        }

        res.status(200).json({
            success: true,
            data: issue
        });

    } catch (error) {

        next(error);

    }
}

async function getActiveIssues(req, res, next) {

    try {

        const issues =
            await issueService.getActiveIssues();

        res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });

    } catch (error) {

        next(error);

    }
}

async function getOverdueIssues(req, res, next) {

    try {

        const issues =
            await issueService.getOverdueIssues();

        res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });

    } catch (error) {

        next(error);

    }
}

async function getStudentIssues(req, res, next) {

    try {

        const issues =
            await issueService.getStudentIssues(
                req.params.studentId
            );

        res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });

    } catch (error) {

        next(error);

    }
}

async function getCopyIssueHistory(req, res, next) {

    try {

        const issues =
            await issueService.getCopyIssueHistory(
                req.params.copyId
            );

        res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });

    } catch (error) {

        next(error);

    }
}

async function getStudentActiveIssues(req, res, next) {

    try {

        const issues =
            await issueService.getStudentActiveIssues(
                req.params.studentId
            );

        res.status(200).json({
            success: true,
            count: issues.length,
            data: issues
        });

    } catch (error) {

        next(error);

    }
}

async function getIssueStatistics(req, res, next) {

    try {

        const statistics =
            await issueService.getIssueStatistics();

        res.status(200).json({
            success: true,
            data: statistics
        });

    } catch (error) {

        next(error);

    }
}

module.exports = {

    issueBook,

    getIssues,

    getIssue,

    getActiveIssues,

    getOverdueIssues,

    getStudentIssues,

    getCopyIssueHistory,

    getStudentActiveIssues,

    getIssueStatistics

};