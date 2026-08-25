const librarianService = require("../services/librarianService");

async function getMyProfile(req, res, next) {

    try {

        const librarian =
            await librarianService.getLibrarianByUserId(
                req.user.user_id
            );

        if (!librarian) {

            return res.status(404).json({
                success: false,
                message: "No librarian profile is linked to this account yet"
            });

        }

        res.json({
            success: true,
            data: librarian
        });

    } catch (error) {

        next(error);

    }
}

async function getLibrarians(req, res, next) {

    try {

        const librarians =
            await librarianService.getAllLibrarians();

        res.json({
            success: true,
            count: librarians.length,
            data: librarians
        });

    } catch (error) {

        next(error);

    }
}

async function createLibrarian(req, res, next) {

    try {

        const librarian =
            await librarianService.createLibrarian(req.body);

        res.status(201).json({
            success: true,
            message: "Librarian account created successfully",
            data: librarian
        });

    } catch (error) {

        next(error);

    }
}

module.exports = {
    getMyProfile,
    getLibrarians,
    createLibrarian
};
