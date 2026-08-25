require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/db");
const returnRoutes = require("./routes/returnRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const studentRoutes = require("./routes/studentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const fineRoutes = require("./routes/fineRoutes");
const issueRoutes = require("./routes/issueRoutes");
const librarianRoutes = require("./routes/librarianRoutes");
const app = express();

app.use(cors());
// Default 100kb is too small for a profile-picture data URI (resized
// client-side to a few hundred KB before it's ever sent).
app.use(express.json({ limit: "3mb" }));

app.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT 1 AS message"
        );

        res.status(200).json({
            success: true,
            message: "College Library System DATABASE connected successfully",
            data: rows
        });

    } catch (error) {
        console.error("Error in connecting DB:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

app.use("/returns", returnRoutes);
app.use("/reservations", reservationRoutes);
app.use("/auth", authRoutes);
app.use("/books", bookRoutes);
app.use("/students", studentRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);
app.use("/fines", fineRoutes);
app.use("/issues", issueRoutes);
app.use("/librarians", librarianRoutes);

// Central error handler — every controller's `next(error)` lands here.
// Without this, Express falls back to its default HTML error page, and
// the frontend (which expects {success, message} JSON) loses the real
// error message entirely.
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || "Something went wrong"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});