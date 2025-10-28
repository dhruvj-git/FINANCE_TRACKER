const express = require("express");
const router = express.Router();

// ✅ Import controllers
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = require("../controllers/transactionController");

// ✅ Import middleware
const authenticate = require("../middleware/authMiddleware");

// ✅ Routes (all protected by authentication)
router.get("/", authenticate, getTransactions);       // Get all transactions of logged-in user
router.post("/", authenticate, addTransaction);       // Add new transaction
router.put("/:id", authenticate, updateTransaction);  // Update transaction by ID
router.delete("/:id", authenticate, deleteTransaction); // Delete transaction by ID

module.exports = router;
