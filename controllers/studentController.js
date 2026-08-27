const studentService = require("../services/studentService");


async function getStudents(req, res, next) {

    try {

        const students =
            await studentService.getAllStudents();

        res.json({
            success: true,
            count: students.length,
            data: students
        });

    } catch (error) {

        next(error);

    }
}


async function getStudent(req, res, next) {

    try {

        const student =
            await studentService.getStudentById(
                req.params.id
            );

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        res.json({
            success: true,
            data: student
        });

    } catch (error) {

        next(error);

    }
}





async function getMyProfile(req, res, next) {

    try {

        const student =
            await studentService.getStudentByUserId(
                req.user.user_id
            );

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "No student profile is linked to this account yet"
            });

        }

        res.json({
            success: true,
            data: student
        });

    } catch (error) {

        next(error);

    }
}


async function createStudent(req, res, next) {

    try {

        const student =
            await studentService.createStudent(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: student
        });

    } catch (error) {

        next(error);

    }
}


async function updateStudent(req, res, next) {

    try {

        const student =
            await studentService.updateStudent(
                req.params.id,
                req.body
            );

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        res.json({
            success: true,
            message: "Student updated successfully",
            data: student
        });

    } catch (error) {

        next(error);

    }
}


async function updateMyProfile(req, res, next) {

    try {

        // Passed through as-is (not destructured into a new object) so the
        // service can tell "field omitted" apart from "field explicitly
        // cleared" — the avatar picker, for instance, only ever sends
        // profile_picture and must never blank out bio/interests as a side
        // effect of that.
        const student =
            await studentService.updateMyProfile(
                req.user.user_id,
                req.body
            );

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: student
        });

    } catch (error) {

        next(error);

    }
}


async function changeMyUsername(req, res, next) {

    try {

        const { username } = req.body;

        const student =
            await studentService.changeUsername(
                req.user.user_id,
                username
            );

        res.json({
            success: true,
            message: "Username updated successfully",
            data: student
        });

    } catch (error) {

        // Rate-limit / duplicate / validation errors are all user-facing,
        // expected rejections rather than server faults.
        res.status(400).json({
            success: false,
            message: error.message
        });

    }
}


async function updateMyAcademicInfo(req, res, next) {

    try {

        const { department, year, semester } = req.body;

        const student =
            await studentService.updateAcademicInfo(
                req.user.user_id,
                { department, year, semester }
            );

        res.json({
            success: true,
            message: "Academic info updated successfully",
            data: student
        });

    } catch (error) {

        // Rate-limit / validation errors are user-facing, not server faults.
        res.status(400).json({
            success: false,
            message: error.message
        });

    }
}


async function updateAccountStatus(req, res, next) {

    try {

        const { status } = req.body;

        const student =
            await studentService.updateAccountStatus(
                req.params.id,
                status
            );

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        res.json({
            success: true,
            message: "Account status updated successfully",
            data: student
        });

    } catch (error) {

        next(error);

    }
}


async function deleteStudent(req, res, next) {

    try {

        const deleted =
            await studentService.deleteStudent(
                req.params.id
            );

        if (!deleted) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        res.json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {

        next(error);

    }
}

async function deleteMyAccount(req, res, next) {

    try {

        await studentService.deleteMyAccount(
            req.user.user_id
        );

        res.json({
            success: true,
            message: "Your account has been deleted"
        });

    } catch (error) {

        next(error);

    }
}

module.exports = {
    getStudents,
    getStudent,
    getMyProfile,
    createStudent,
    updateStudent,
    updateMyProfile,
    changeMyUsername,
    updateMyAcademicInfo,
    updateAccountStatus,
    deleteStudent,
    deleteMyAccount
};