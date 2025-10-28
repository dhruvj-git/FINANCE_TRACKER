// controllers/tagController.js (Complete File)

const pool = require("../db/db");

// ✅ Get all tags for the logged-in user with usage count
exports.getTags = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    // FIX: Updated query to LEFT JOIN and COUNT transactions for each tag
    const query = `
      SELECT 
        t.tag_id, 
        t.tag_name, 
        COUNT(tt.transaction_id) AS usage_count
      FROM tag t
      LEFT JOIN transaction_tags tt ON t.tag_id = tt.tag_id
      WHERE t.user_id = $1
      GROUP BY t.tag_id, t.tag_name
      ORDER BY t.tag_name ASC
    `;
    
    const result = await pool.query(query, [user_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching tags:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Add a new tag
exports.addTag = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { tag_name } = req.body;

    const result = await pool.query(
      "INSERT INTO tag (tag_name, user_id) VALUES ($1, $2) RETURNING *",
      [tag_name, user_id]
    );

    res.status(201).json({ message: "Tag added", tag: result.rows[0] });
  } catch (err) {
    console.error("❌ Error adding tag:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete a tag by ID
exports.deleteTag = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM tag WHERE tag_id = $1 AND user_id = $2 RETURNING *",
      [id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Tag not found or unauthorized" });
    }

    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting tag:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};