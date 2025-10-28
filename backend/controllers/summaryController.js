const db = require('../db/db');

exports.getSummary = async (req, res) => {
  const userId = req.user.user_id;  // ✅ Fix: consistent with all other controllers

  try {
    // ✅ Get total income
    const incomeRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_income 
       FROM transaction 
       INNER JOIN category ON transaction.category_id = category.category_id 
       WHERE category.type = 'income' AND transaction.user_id = $1`,
      [userId]
    );

    // ✅ Get total expense
    const expenseRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expense 
       FROM transaction 
       INNER JOIN category ON transaction.category_id = category.category_id 
       WHERE category.type = 'expense' AND transaction.user_id = $1`,
      [userId]
    );

    const total_income = parseFloat(incomeRes.rows[0].total_income);
    const total_expense = parseFloat(expenseRes.rows[0].total_expense);
    const balance = total_income - total_expense;

    res.status(200).json({ total_income, total_expense, balance });
  } catch (err) {
    console.error("❌ Error in summaryController:", err.message);
    res.status(500).json({ error: "Failed to load summary data" });
  }
};
