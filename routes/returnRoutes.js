const express = require("express");

const router = express.Router();

const returnController = require("../controllers/returnController");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");


router.post(
    "/",
    authMiddleware,
    roleMiddleware("Librarian"),
    returnController.createReturn
);


router.get(
    "/",
    authMiddleware,
    roleMiddleware("Admin", "Librarian"),
    returnController.getAllReturns
);


router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Librarian"),
    returnController.getReturnById
);


router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("Librarian"),
    returnController.updateReturn
);


router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Librarian"),
    returnController.deleteReturn
);


module.exports = router;