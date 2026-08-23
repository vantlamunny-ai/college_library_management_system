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

module.exports = {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent
};