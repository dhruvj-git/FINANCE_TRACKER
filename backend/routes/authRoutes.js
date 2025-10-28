
// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { loginUser, registerUser } = require("../controllers/authController");

router.post("/login", loginUser);
router.post("/register", registerUser);
console.log("👤 loginUser:", loginUser); // should NOT be undefined

module.exports =  router;
