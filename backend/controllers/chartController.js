// backend/controllers/chartController.js
const pool = require("../db/db");

// 1. This function is correct and working. No changes.
exports.getExpenseByCategory = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const query = `
      SELECT 
        c.category_name, 
        SUM(t.amount) AS total_amount
      FROM transaction t
      JOIN category c ON t.category_id = c.category_id
      WHERE t.user_id = $1 AND c.category_type = 'Expense'
      GROUP BY c.category_name
      HAVING SUM(t.amount) > 0
      ORDER BY total_amount DESC;
    `;
    const { rows } = await pool.query(query, [user_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error in getExpenseByCategory:", err.stack);
    res.status(500).json({ error: "Server error fetching expense analysis" });
  }
};

// 2. FIXED: Income vs. Expense (Added 6-Month Guarantee AND Timezone Fix)
exports.getIncomeVsExpense = async (req, res) => {
  const user_id = req.user.user_id;
  const user_timezone = 'Asia/Kolkata'; // Your local timezone

  try {
    const query = `
      -- 1. Generate a series of all 6 months
      WITH all_months AS (
        SELECT generate_series(
          DATE_TRUNC('month', (NOW() - INTERVAL '5 months') AT TIME ZONE 'UTC' AT TIME ZONE $2),
          DATE_TRUNC('month', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE $2)),
          '1 month'
        )::date AS month
      ),
      -- 2. Get the user's transactions, grouped by the correct timezone-aware month
      user_transactions AS (
        SELECT 
          DATE_TRUNC('month', (t.transaction_date AT TIME ZONE 'UTC' AT TIME ZONE $2))::date AS month,
          SUM(CASE WHEN c.category_type = 'Income' THEN t.amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN c.category_type = 'Expense' THEN t.amount ELSE 0 END) AS total_expense
        FROM transaction t
        JOIN category c ON t.category_id = c.category_id
        WHERE 
          t.user_id = $1 AND
          t.transaction_date >= DATE_TRUNC('month', (NOW() - INTERVAL '5 months') AT TIME ZONE 'UTC' AT TIME ZONE $2)
        GROUP BY month
      )
      -- 3. LEFT JOIN transactions onto the 6-month series
      SELECT 
        to_char(all_months.month, 'YYYY-MM-DD') AS month,
        COALESCE(user_transactions.total_income, 0) AS total_income,
        COALESCE(user_transactions.total_expense, 0) AS total_expense
      FROM all_months
      LEFT JOIN user_transactions ON all_months.month = user_transactions.month
      ORDER BY all_months.month ASC;
    `;
    const { rows } = await pool.query(query, [user_id, user_timezone]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error in getIncomeVsExpense:", err.stack);
    res.status(500).json({ error: "Server error fetching income/expense analysis" });
  }
};

// 3. This function is correct from our last fix. No changes.
exports.getMonthlyExpenditure = async (req, res) => {
  const user_id = req.user.user_id;
  const user_timezone = 'Asia/Kolkata'; // Your local timezone

  try {
    const query = `
      -- 1. Generate a series of all 12 months
      WITH all_months AS (
        SELECT generate_series(
          DATE_TRUNC('month', (NOW() - INTERVAL '11 months') AT TIME ZONE 'UTC' AT TIME ZONE $2),
          DATE_TRUNC('month', (NOW() AT TIME ZONE 'UTC' AT TIME ZONE $2)),
          '1 month'
        )::date AS month
      ),
      -- 2. Get the user's expenses
      user_expenses AS (
        SELECT 
          DATE_TRUNC('month', (t.transaction_date AT TIME ZONE 'UTC' AT TIME ZONE $2))::date AS month,
          SUM(t.amount) AS total_expense
        FROM transaction t
        JOIN category c ON t.category_id = c.category_id
        WHERE 
          t.user_id = $1 AND 
          c.category_type = 'Expense' AND
          t.transaction_date >= DATE_TRUNC('month', (NOW() - INTERVAL '11 months') AT TIME ZONE 'UTC' AT TIME ZONE $2)
        GROUP BY month
      )
      -- 3. LEFT JOIN expenses onto the 12-month series
      SELECT 
        to_char(all_months.month, 'YYYY-MM-DD') AS month,
        COALESCE(user_expenses.total_expense, 0) AS total_expense
      FROM all_months
      LEFT JOIN user_expenses ON all_months.month = user_expenses.month
      ORDER BY all_months.month ASC;
    `;
    const { rows } = await pool.query(query, [user_id, user_timezone]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error in getMonthlyExpenditure:", err.stack);
    res.status(500).json({ error: "Server error fetching monthly expenditure" });
  }
};