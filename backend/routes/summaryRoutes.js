const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/summaryController');
const authenticate = require('../middleware/authMiddleware');

router.get("/" , authenticate, getSummary);

module.exports = router;
app.get("/summary", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const incomeResult = await db.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_income FROM transaction WHERE user_id = $1 AND amount > 0",
      [user_id]
    );
    const expenseResult = await db.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_expense FROM transaction WHERE user_id = $1 AND amount < 0",
      [user_id]
    );

    const income = parseFloat(incomeResult.rows[0].total_income);
    const expense = Math.abs(parseFloat(expenseResult.rows[0].total_expense));
    const balance = income - expense;

    res.json({ income, expense, balance });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});