const pool = require("../db/db");

// ✅ GET all budgets for the logged-in user
exports.getBudgets = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await pool.query(
      `
      SELECT 
        b.budget_id, 
        b.month, 
        b.budget_limit, 
        b.category_id,
        c.category_name
      FROM budget b
      JOIN category c ON b.category_id = c.category_id
      WHERE b.user_id = $1
      ORDER BY b.month DESC
      `,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching budgets:", err.message);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
};

// ✅ ADD a new budget
/*exports.addBudget = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { category_id, budget_limit, month } = req.body;

    // check if category exists for user
    const categoryCheck = await pool.query(
      "SELECT * FROM category WHERE category_id = $1 AND user_id = $2",
      [category_id, user_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: "Invalid category for this user" });
    }

    const result = await pool.query(
      `
      INSERT INTO budget (user_id, category_id, budget_limit, month)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [user_id, category_id, budget_limit, month]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding budget:", err.message);
    res.status(500).json({ error: "Failed to add budget" });
  }
};*/
// In controllers/budgetController.js

// ✅ ADD a new budget (Corrected Version)
exports.addBudget = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    let { category_id, budget_limit, month } = req.body; // Use 'let' for month

    // --- START FIX ---
    // Ensure month is a full date (YYYY-MM-DD) by appending the first day.
    // This converts "2025-10" into "2025-10-01".
    if (month && month.length === 7) { // Check if format is YYYY-MM
      month = `${month}-01`;
    }
    // --- END FIX ---

    // check if category exists for user
    const categoryCheck = await pool.query(
      "SELECT * FROM category WHERE category_id = $1 AND user_id = $2",
      [category_id, user_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: "Invalid category for this user" });
    }

    const result = await pool.query(
      `
      INSERT INTO budget (user_id, category_id, budget_limit, month)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [user_id, category_id, budget_limit, month]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Provide a more specific error for duplicate budgets
    if (err.code === '23505') { // '23505' is the code for unique_violation
        return res.status(409).json({ error: "A budget for this category and month already exists." });
    }
    console.error("❌ Error adding budget:", err.message);
    res.status(500).json({ error: "Failed to add budget" });
  }
};

// ✅ UPDATE a budget
exports.updateBudget = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const { category_id, budget_limit, month } = req.body;

    // check if category exists for user
    const categoryCheck = await pool.query(
      "SELECT * FROM category WHERE category_id = $1 AND user_id = $2",
      [category_id, user_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: "Invalid category for this user" });
    }

    const result = await pool.query(
      `
      UPDATE budget
      SET category_id = $1, budget_limit = $2, month = $3
      WHERE budget_id = $4 AND user_id = $5
      RETURNING *
      `,
      [category_id, budget_limit, month, id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating budget:", err.message);
    res.status(500).json({ error: "Failed to update budget" });
  }
};

// ✅ DELETE a budget
exports.deleteBudget = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM budget
      WHERE budget_id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting budget:", err.message);
    res.status(500).json({ error: "Failed to delete budget" });
  }
};
