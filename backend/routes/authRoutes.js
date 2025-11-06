const express = require("express");
const router = express.Router();
const { loginUser, registerUser } = require("../controllers/authController");

// POST /auth/register
router.post("/register", registerUser);

// POST /auth/login
router.post("/login", loginUser);

module.exports = router;
