const express = require("express");
const router = express.Router();
const {
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget
} = require("../controllers/budgetController");

const authenticate = require("../middleware/authMiddleware");

router.get("/", authenticate, getBudgets);
router.post("/", authenticate, addBudget);
router.put("/:id", authenticate, updateBudget);
router.delete("/:id", authenticate, deleteBudget);

module.exports = router;
