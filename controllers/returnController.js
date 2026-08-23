const returnService = require("../services/returnService");

const createReturn = async (req, res) => {
    try {
        const {
            issue_id,
            return_date,
            condition_status,
            remarks,
            processed_by
        } = req.body;

        const result = await returnService.createReturn(
            issue_id,
            return_date,
            condition_status,
            remarks,
            processed_by
        );

        res.status(201).json({
            success: true,
            message: "Book returned successfully",
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


const getAllReturns = async (req, res) => {
    try {
        const result = await returnService.getAllReturns();

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


const getReturnById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await returnService.getReturnById(id);

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


const updateReturn = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            return_date,
            condition_status,
            remarks,
            processed_by
        } = req.body;

        const result = await returnService.updateReturn(
            id,
            return_date,
            condition_status,
            remarks,
            processed_by
        );

        res.status(200).json({
            success: true,
            message: "Return updated successfully",
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


const deleteReturn = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await returnService.deleteReturn(id);

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
    createReturn,
    getAllReturns,
    getReturnById,
    updateReturn,
    deleteReturn
};