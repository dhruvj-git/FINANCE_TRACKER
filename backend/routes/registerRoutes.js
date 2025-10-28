// routes/registerRoutes.js (Complete, Corrected File)

const express = require("express");
const router = express.Router();

// ✅ FIX: Import from your registerController.js file
const { registerUser } = require("../controllers/registerController");

// The route will be POST /register
router.post("/", registerUser);

module.exports = router;