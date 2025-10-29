// backend/routes/budgetRoutes.js
const express = require("express");
const router = express.Router();
const { getBudgets, setBudget, deleteBudget } = require("../controllers/budgetController"); // <-- Added deleteBudget
const authenticateToken = require("../middleware/authMiddleware");

router.get("/", authenticateToken, getBudgets);
router.post("/", authenticateToken, setBudget);

// --- START: NEW DELETE ROUTE ---
// The :id will match the budgetId sent from the frontend
router.delete("/:id", authenticateToken, deleteBudget);
// --- END: NEW DELETE ROUTE ---

module.exports = router;