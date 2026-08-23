const reservationService = require("../services/reservationService");

const createReservation = async (req, res) => {
    try {
        const {
            book_id,
            student_id,
            expiry_date
        } = req.body;

        const result = await reservationService.createReservation(
            book_id,
            student_id,
            expiry_date
        );

        res.status(201).json({
            success: true,
            message: "Reservation created successfully",
            data: result
        });

    } catch (error) {
        console.error(error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllReservations = async (req, res) => {
    try {
        const result = await reservationService.getAllReservations();

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getReservationById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await reservationService.getReservationById(id);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            expiry_date,
            status
        } = req.body;

        const result = await reservationService.updateReservation(
            id,
            expiry_date,
            status
        );

        res.status(200).json({
            success: true,
            message: "Reservation updated successfully",
            data: result
        });

    } catch (error) {
        console.error(error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await reservationService.deleteReservation(id);

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error(error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createReservation,
    getAllReservations,
    getReservationById,
    updateReservation,
    deleteReservation
};