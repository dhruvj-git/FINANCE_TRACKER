// backend/controllers/dashboardController.js (Reverted File)

const pool = require('../db/db'); // Use pool

// --- GET Dashboard Summary (Only this function remains) ---
exports.getDashboardSummary = async (req, res) => {
  const userId = req.user?.user_id;
  if (userId == null) return res.status(401).json({ message: "Unauthorized: User ID missing" });

  try {
    // Query 1: Monthly Summary (Current Month)
    const monthlySummaryQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN c.category_type = 'Income' THEN t.amount ELSE 0 END), 0) AS "monthly_income",
        COALESCE(SUM(CASE WHEN c.category_type = 'Expense' THEN t.amount ELSE 0 END), 0) AS "monthly_expense"
      FROM transaction t
      LEFT JOIN category c ON t.category_id = c.category_id
      WHERE t.user_id = $1 AND date_trunc('month', t.transaction_date) = date_trunc('month', CURRENT_DATE)
    `;
    const monthlySummaryResult = await pool.query(monthlySummaryQuery, [userId]);
    const { monthly_expense } = monthlySummaryResult.rows[0] || { monthly_expense: 0 };

    // Query 2: Total Balance
    const totalBalanceQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN c.category_type = 'Income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN c.category_type = 'Expense' THEN t.amount ELSE 0 END), 0) AS "total_balance"
      FROM transaction t
      LEFT JOIN category c ON t.category_id = c.category_id
      WHERE t.user_id = $1
    `;
    const totalBalanceResult = await pool.query(totalBalanceQuery, [userId]);
    const { total_balance } = totalBalanceResult.rows[0] || { total_balance: 0 };

    // Query 3: Transaction Count
    const transactionCountQuery = `
      SELECT COUNT(*) AS "total_transactions"
      FROM transaction
      WHERE user_id = $1
    `;
    const transactionCountResult = await pool.query(transactionCountQuery, [userId]);
    const { total_transactions } = transactionCountResult.rows[0] || { total_transactions: 0 };

    res.json({
      total_balance: parseFloat(total_balance).toFixed(2),
      monthly_expense: parseFloat(monthly_expense).toFixed(2),
      total_transactions: parseInt(total_transactions, 10)
    });

  } catch (err) {
    console.error('❌ Error fetching dashboard summary:', err.stack);
    res.status(500).json({ message: 'Error fetching dashboard summary data' });
  }
};

// --- Estimate Affordability Function Removed ---

// Only export the remaining function
module.exports = {
  getDashboardSummary: exports.getDashboardSummary
};