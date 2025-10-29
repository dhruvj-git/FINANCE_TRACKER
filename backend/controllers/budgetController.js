// backend/controllers/budgetController.js
const pool = require("../db/db"); // Using pool from your db.js

// Get all budgets for the logged-in user
exports.getBudgets = async (req, res) => {
  const user_id = req.user.user_id; // From authenticateToken
  try {
    const query = `
      SELECT 
        b.budget_id, 
        b.month, 
        b.budget_limit, 
        c.category_name,
        c.category_id
      FROM budget b
      JOIN category c ON b.category_id = c.category_id
      WHERE b.user_id = $1
      ORDER BY b.month DESC, c.category_name;
    `;
    const { rows } = await pool.query(query, [user_id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error in getBudgets:", err.stack);
    res.status(500).json({ error: "Server error fetching budgets" });
  }
};

// Set a new budget
exports.setBudget = async (req, res) => {
  const user_id = req.user.user_id;
  const { category_id, budget_limit, month } = req.body;

  // Validate input
  if (!category_id || !budget_limit || !month) {
    return res.status(400).json({ error: "Missing required fields: category_id, budget_limit, month" });
  }

  try {
    const query = `
      INSERT INTO budget (user_id, category_id, budget_limit, month)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [user_id, category_id, budget_limit, month]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Error in setBudget:", err.stack);
    // Check for unique constraint violation (user_id, category_id, month)
    if (err.code === '23505') { // 23505 is the code for unique_violation
        return res.status(409).json({ error: 'A budget for this category and month already exists.' });
    }
    res.status(500).json({ error: "Server error setting budget" });
  }
};

// --- START: NEW DELETE BUDGET FUNCTION ---
exports.deleteBudget = async (req, res) => {
    const { id } = req.params; // This is the budget_id from the URL
    const userId = req.user.user_id; // From authMiddleware

    console.log(`[budgetController] Attempting to delete budget ${id} for user ${userId}`);

    try {
        const deleteResult = await pool.query(
            "DELETE FROM budget WHERE budget_id = $1 AND user_id = $2 RETURNING *",
            [id, userId]
        );

        if (deleteResult.rowCount === 0) {
            // This means no budget was found with that ID for that user
            console.log(`[budgetController] Delete FAILED: Budget ${id} not found for user ${userId}`);
            return res.status(404).json({ message: "Budget not found or user not authorized" });
        }

        console.log(`[budgetController] Delete SUCCESS: Budget ${id} deleted for user ${userId}`);
        res.status(200).json({ message: "Budget deleted successfully" });
    } catch (error) {
        console.error(`❌ Error deleting budget ${id}:`, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// --- END: NEW DELETE BUDGET FUNCTION ---