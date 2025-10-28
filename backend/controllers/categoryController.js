
//const pool = require("../db/db");

// ✅ Get all categories for logged-in user
/*exports.getCategories = async (req, res) => {
  try {
    // Ensure user_id is integer
    const user_id = parseInt(req.user.user_id, 10);
    console.log("👉 user_id from token (parsed):", user_id);

    const result = await pool.query(
      `SELECT category_id, category_name, category_type 
       FROM category 
       WHERE user_id = $1 
       ORDER BY category_name ASC`,
      [user_id]
    );

    console.log("👉 Categories fetched from DB:", result.rows);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching categories:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/
/*exports.getCategories = async (req, res) => {
  try {
    console.log("🔥 JWT payload:", req.user);

    const user_id = parseInt(req.user.user_id, 10);
    console.log("👉 user_id used in query:", user_id);

    // Hardcoded query test
    const result = await pool.query(
      `SELECT category_id, category_name, category_type 
       FROM category 
       WHERE user_id = 10
       ORDER BY category_name ASC`
    );
    console.log("🔥 Hardcoded query result:", result.rows);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching categories:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/


/*exports.getCategories = async (req, res) => {
  console.log("✅ [1] getCategories() called");

  // Check if authMiddleware is even adding req.user
  console.log("✅ [2] req.user:", req.user);

  try {
    const user_id = req.user?.user_id;
    console.log("✅ [3] user_id:", user_id);

    // Test query
    const test = await pool.query("SELECT COUNT(*) FROM category;");
    console.log("✅ [4] Total categories in DB:", test.rows[0].count);

    const result = await pool.query(
      `SELECT category_id, category_name 
       FROM category 
       WHERE user_id = $1 
       ORDER BY category_name ASC`,
      [user_id]
    );
    console.log("✅ [5] Query returned:", result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ [getCategories] error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};*/
/*exports.getCategories = async (req, res) => {
  try {
    console.log("🔹 Inside getCategories");
    console.log("🔹 req.user:", req.user);

    const user_id = req.user.user_id;
    console.log("🔹 Extracted user_id:", user_id);

    const result = await pool.query(
      `SELECT category_id, category_name, category_type 
       FROM category 
       WHERE user_id = $1 
       ORDER BY category_name ASC`,
      [user_id]
    );

    console.log("🔹 Query result rows:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in getCategories:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};*/

// In controllers/categoryController.js
/*
exports.getCategories = async (req, res) => {
  // --- START OF DEBUG LOGS ---
  console.log("===========================================");
  console.log("🕵️  INCOMING REQUEST to getCategories");

  // 1. Check the entire req.user object from the token
  console.log("➡️  req.user object:", req.user);

  if (!req.user || !req.user.user_id) {
    console.log("❌ ERROR: req.user or req.user.user_id is missing!");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.user_id;

  // 2. Check the user ID and its data type
  console.log(`➡️  Extracted user ID: ${userId}`);
  console.log(`➡️  Type of user ID: ${typeof userId}`); // Is it a 'number' or 'string'?

  try {
    const queryText = `
      SELECT category_id, category_name, category_type
      FROM category
      WHERE user_id = $1
      ORDER BY category_name ASC
    `;

    // 3. Log the query and the parameters we are sending
    console.log("➡️  Executing SQL Query:", queryText.trim().replace(/\s+/g, ' '));
    console.log("➡️  With Parameters:", [userId]);

    const result = await pool.query(queryText, [userId]);

    // 4. THIS IS THE MOST IMPORTANT LOG! What did the database return?
    console.log("✅ SUCCESS: Database returned:", result.rows);
    console.log("===========================================\n");
    // --- END OF DEBUG LOGS ---

    res.json(result.rows);

  } catch (err) {
    console.error("❌ FATAL ERROR in getCategories:", err);
    console.log("===========================================\n");
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// ✅ Add new category
exports.addCategory = async (req, res) => {
  try {
    const user_id = parseInt(req.user.user_id, 10);
    const { category_name, category_type } = req.body;

    if (!category_name || !category_type) {
      return res.status(400).json({ message: "Category name and type are required" });
    }

    const result = await pool.query(
      `INSERT INTO category (category_name, category_type, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [category_name, category_type, user_id]
    );

    console.log("✅ Category added:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding category:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update category
exports.updateCategory = async (req, res) => {
  try {
    const user_id = parseInt(req.user.user_id, 10);
    const { id } = req.params;
    const { category_name, category_type } = req.body;

    const result = await pool.query(
      `UPDATE category 
       SET category_name = $1, category_type = $2
       WHERE category_id = $3 AND user_id = $4 
       RETURNING *`,
      [category_name, category_type, id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found or unauthorized" });
    }

    console.log("✅ Category updated:", result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating category:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const user_id = parseInt(req.user.user_id, 10);
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM category 
       WHERE category_id = $1 AND user_id = $2 
       RETURNING *`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found or unauthorized" });
    }

    console.log("✅ Category deleted:", result.rows[0]);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting category:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
*/
// controllers/categoryController.js

const pool = require("../db/db");

// Get all categories for logged-in user
exports.getCategories = async (req, res) => {
  // --- START OF DEBUG LOGS ---
  console.log("===========================================");
  console.log("🕵️  INCOMING REQUEST to getCategories");

  const userId = req.user.user_id;
  console.log(`➡️  Extracted user ID: ${userId} (Type: ${typeof userId})`);

  try {
    const queryText = `
      SELECT category_id, category_name, category_type
      FROM category
      WHERE user_id = $1
      ORDER BY category_name ASC
    `;
    
    console.log("➡️  Executing SQL Query:", queryText.trim().replace(/\s+/g, ' '));
    console.log("➡️  With Parameters:", [userId]);

    const result = await pool.query(queryText, [userId]);

    console.log("✅ SUCCESS: Database returned:", result.rows);
    console.log("===========================================\n");

    res.json(result.rows);

  } catch (err) {
    console.error("❌ FATAL ERROR in getCategories:", err);
    console.log("===========================================\n");
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const user_id = parseInt(req.user.user_id, 10);
    const { category_name, category_type } = req.body;

    if (!category_name || !category_type) {
      return res.status(400).json({ message: "Category name and type are required" });
    }

    const result = await pool.query(
      `INSERT INTO category (category_name, category_type, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [category_name, category_type, user_id]
    );

    console.log("✅ Category added:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding category:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ... your other controller functions like addCategory, updateCategory etc. can go here ...

