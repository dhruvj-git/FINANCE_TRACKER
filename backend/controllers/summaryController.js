// backend/controllers/summaryController.js
const pool = require('../db/db');

// This function now works because authMiddleware correctly sets req.user
const getSummary = async (req, res) => {
  const userId = req.user.user_id; // This will now work
  console.log(`[summaryController] getSummary called for user_id: ${userId}`);

  try {
    // --- SCHEMA FIX ---
    // Query to get total income (using 'category_type' and 'Income')
    const incomeResult = await pool.query(
      `SELECT SUM(t.amount) AS total_income
       FROM transaction t
       JOIN category c ON t.category_id = c.category_id
       WHERE t.user_id = $1 AND c.category_type = 'Income'`,
      [userId]
    );
    const totalIncome = parseFloat(incomeResult.rows[0]?.total_income) || 0;

    // --- SCHEMA FIX ---
    // Query to get total expenses (using 'category_type' and 'Expense')
    const expenseResult = await pool.query(
      `SELECT SUM(t.amount) AS total_expenses
       FROM transaction t
       JOIN category c ON t.category_id = c.category_id
       WHERE t.user_id = $1 AND c.category_type = 'Expense'`,
      [userId]
    );
    const totalExpenses = parseFloat(expenseResult.rows[0]?.total_expenses) || 0;

    // Calculate balance
    const balance = totalIncome - totalExpenses;

    // --- SCHEMA FIX ---
    // Query to get recent transactions (using 'transaction_date')
    const recentTransactionsResult = await pool.query(
      `SELECT
         t.transaction_id AS id,
         t.description,
         t.amount,
         c.category_type AS type,
         t.transaction_date AS date,
         t.category_id
       FROM transaction t
       LEFT JOIN category c ON t.category_id = c.category_id
       WHERE t.user_id = $1
       ORDER BY t.transaction_date DESC LIMIT 5`,
      [userId]
    );
    const recentTransactions = recentTransactionsResult.rows;

    console.log(`[summaryController] Summary fetched successfully for user_id: ${userId}`);
    res.json({
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      balance: balance.toFixed(2),
      recentTransactions,
    });
  } catch (error) {
    console.error(`[summaryController] ❌ Error fetching summary for user_id: ${userId}`, error.stack || error);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
};

// Export *only* getSummary
module.exports = {
  getSummary
};