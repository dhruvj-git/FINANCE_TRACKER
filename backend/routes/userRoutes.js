const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");

// DO NOT destructure; your controller exports names are `register` and `login`
const userController = require("../controllers/userController");

router.post("/register", userController.register);
router.post("/login", userController.login);

// If you don't have getUserProfile implemented in userController yet,
// either comment this route out OR keep this temporary placeholder.
/*
router.get("/profile", authenticate, (req, res) => {
  return res.status(501).json({ error: "Profile endpoint not implemented yet." });
});
*/

module.exports = router;
