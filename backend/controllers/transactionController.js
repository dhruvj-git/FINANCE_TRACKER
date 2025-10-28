// backend/controllers/transactionController.js (Complete, Updated File)

const pool = require("../db/db");

// Helper: safe parse integer or return null
const toIntOrNull = (v) => { 
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isInteger(v) ? v : Math.floor(v);
  if (typeof v === "string" && v.trim() === "") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
};

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const user_id = req.user && req.user.user_id;
    if (user_id == null) return res.status(401).json({ message: "Unauthorized: missing user ID" });

    const result = await pool.query(
      `
      SELECT
        t.transaction_id,
        t.transaction_date,
        t.amount,
        t.description,
        t.payment_mode,
        COALESCE(c.category_name, 'N/A') AS category,
        COALESCE(string_agg(tag.tag_name, ', '), '') AS tags
      FROM transaction t
      LEFT JOIN category c ON t.category_id = c.category_id
      LEFT JOIN transaction_tags tt ON t.transaction_id = tt.transaction_id
      LEFT JOIN tag ON tt.tag_id = tag.tag_id
      WHERE t.user_id = $1
      GROUP BY t.transaction_id, c.category_name
      ORDER BY t.transaction_date DESC
      `,
      [user_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err.stack || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Add a transaction - Handles optional date from frontend
exports.addTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user && req.user.user_id;
    if (user_id == null) return res.status(401).json({ message: "Unauthorized: missing user ID" });

    // transaction_date is now potentially in the body
    let { amount, description, category_id, payment_mode, tag_ids, transaction_date } = req.body;

    // --- Validation ---
    amount = parseFloat(amount);
    if (isNaN(amount) || amount === 0) { // Also check for zero amount if needed
        return res.status(400).json({ message: "Invalid or zero amount provided." });
    }
    description = description ? String(description).trim() : "";
    category_id = toIntOrNull(category_id); // Allows null category
    payment_mode = payment_mode ? String(payment_mode).trim() : null; // Allows null payment mode
    tag_ids = Array.isArray(tag_ids) ? tag_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];

    // Basic required field check (backend side)
    if (!description || category_id === null || payment_mode === null) {
        return res.status(400).json({ message: "Description, Category, and Payment Mode are required." });
    }

    // --- Start Transaction ---
    await client.query("BEGIN");

    let insertQuery;
    let queryParams;
    let returningClause = 'RETURNING transaction_id, transaction_date'; // Always get ID and date

    // Build query based on whether transaction_date was provided
    if (transaction_date) {
        // Validate the incoming ISO string from the frontend
        const parsedDate = new Date(transaction_date);
        if (isNaN(parsedDate.getTime())) {
            // Rollback immediately if date format is bad
            await client.query("ROLLBACK"); 
            console.error(`Invalid transaction_date format received: ${transaction_date}`);
            return res.status(400).json({ message: "Invalid date/time format submitted." });
        }
        // Use the validated ISO string directly with TIMESTAMPTZ
        console.log(`Inserting with user-provided date: ${transaction_date}`);
        insertQuery = `
            INSERT INTO transaction (amount, description, user_id, category_id, payment_mode, transaction_date)
            VALUES ($1, $2, $3, $4, $5, $6)
            ${returningClause}`;
        queryParams = [amount, description, user_id, category_id, payment_mode, transaction_date]; // Use validated date string
    } else {
        // transaction_date is not provided, rely on DEFAULT NOW()
        console.log("Inserting with default date (NOW())");
        insertQuery = `
            INSERT INTO transaction (amount, description, user_id, category_id, payment_mode)
            VALUES ($1, $2, $3, $4, $5)
            ${returningClause}`; // DB generates the date
        queryParams = [amount, description, user_id, category_id, payment_mode];
    }

    // Execute the insert
    const insertTx = await client.query(insertQuery, queryParams);
    const { transaction_id } = insertTx.rows[0];

    // --- Insert Tags ---
    if (tag_ids.length > 0) {
      const insertTagText = `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)`;
      // Check if tags belong to the user (important for security/data integrity)
      for (const tId of tag_ids) {
        const tagCheck = await client.query('SELECT 1 FROM tag WHERE tag_id = $1 AND user_id = $2', [tId, user_id]);
        if (tagCheck.rowCount === 0) {
          // If a tag doesn't belong to the user, stop and rollback
          await client.query("ROLLBACK");
          console.warn(`Attempt to use invalid tag_id ${tId} by user ${user_id}`);
          return res.status(400).json({ message: `Invalid tag selected: ID ${tId}` });
        }
        // Insert the valid tag association
        await client.query(insertTagText, [transaction_id, tId]);
      }
    }

    // --- Commit Transaction ---
    await client.query("COMMIT");

    // --- Fetch and Return Complete Transaction ---
    // Fetch details including category name, tags, and the (potentially auto-generated) date
    const out = await pool.query( // Use pool here, not client, as transaction is committed
        `SELECT t.transaction_id, t.transaction_date, t.amount, t.description, t.payment_mode,
                COALESCE(c.category_name, 'N/A') AS category,
                COALESCE(string_agg(tag.tag_name, ', '), '') AS tags
         FROM transaction t
         LEFT JOIN category c ON t.category_id = c.category_id
         LEFT JOIN transaction_tags tt ON t.transaction_id = tt.transaction_id
         LEFT JOIN tag ON tt.tag_id = tag.tag_id
         WHERE t.transaction_id = $1
         GROUP BY t.transaction_id, c.category_name`,
        [transaction_id]
      );

    res.status(201).json(out.rows[0]); // Send back the newly created transaction details

  } catch (err) {
    // Ensure rollback on any error after BEGIN
    try { await client.query("ROLLBACK"); } catch (e) { console.error("Rollback failed:", e); }
    
    console.error("❌ Error adding transaction:", err.stack || err);
    
    // Specific error handling
    if (err.code === "23503") { // Foreign key violation (e.g., bad category_id)
        let message = "Invalid category selected."; // Default assumption
         if (err.constraint && err.constraint.includes('category')) message = "Invalid category selected.";
        // Note: Tag FK check now happens before commit, preventing this specific state for tags
        return res.status(400).json({ message: message, detail: err.detail });
    }
     if (err.code === '22007' || err.code === '22008' ) { // Invalid datetime format codes in PostgreSQL
         return res.status(400).json({ message: "Invalid date/time format submitted.", detail: err.message });
    }
     if (err.message && err.message.includes("Invalid transaction_date")) { // Custom error from validation
       return res.status(400).json({ message: "Invalid date/time format submitted.", error: err.message });
    }

    // General server error
    res.status(500).json({ message: "Server error while adding transaction.", error: err.message });
  } finally {
    // VERY IMPORTANT: Release client back to the pool
    client.release();
  }
};


// --- Update Transaction Function --- 
// Handles optional date update
exports.updateTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user && req.user.user_id;
    if (user_id == null) return res.status(401).json({ message: "Unauthorized: missing user ID" });

    const { id } = req.params; // Transaction ID to update
    let { amount, description, category_id, payment_mode, tag_ids, transaction_date } = req.body;

    // --- Validation ---
    amount = req.body.amount !== undefined ? parseFloat(amount) : undefined; // Parse only if present
    if (amount !== undefined && isNaN(amount)) return res.status(400).json({ message: "Invalid amount provided for update." });
    
    description = req.body.description !== undefined ? String(description).trim() : undefined;
    category_id = req.body.category_id !== undefined ? toIntOrNull(category_id) : undefined;
    payment_mode = req.body.payment_mode !== undefined ? (payment_mode ? String(payment_mode).trim() : null) : undefined;
    tag_ids = Array.isArray(tag_ids) ? tag_ids.map(tid => parseInt(tid, 10)).filter(tid => !isNaN(tid)) : undefined; // Undefined if not sent

    // --- Dynamic Query Building ---
    let setClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    // Add fields to SET clause only if they were included in the request
    if (amount !== undefined) {
      setClauses.push(`amount = $${paramIndex++}`);
      queryParams.push(amount);
    }
     if (description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
     if (category_id !== undefined) {
      setClauses.push(`category_id = $${paramIndex++}`);
      queryParams.push(category_id); // Allow null
    }
     if (payment_mode !== undefined) {
      setClauses.push(`payment_mode = $${paramIndex++}`);
      queryParams.push(payment_mode);
    }
     if (transaction_date) { // If a date is provided, validate and add it
        const parsedDate = new Date(transaction_date);
        if (isNaN(parsedDate.getTime())) throw new Error("Invalid transaction_date format for update.");
        setClauses.push(`transaction_date = $${paramIndex++}`);
        queryParams.push(parsedDate.toISOString()); // Use ISO format for DB
    }

    // Check if anything needs to be updated in the main table or tags
    if (setClauses.length === 0 && tag_ids === undefined) {
       return res.status(400).json({ message: "No fields provided for update." });
    }

    await client.query("BEGIN");

    // --- Update Transaction Row (if needed) ---
    if (setClauses.length > 0) {
        queryParams.push(id, user_id); // Add id and user_id for WHERE clause
        const updateQuery = `
            UPDATE transaction
            SET ${setClauses.join(', ')}
            WHERE transaction_id = $${paramIndex} AND user_id = $${paramIndex + 1}
            RETURNING *`; // Return the updated row

        console.log("Executing Update:", updateQuery, queryParams);
        const upd = await client.query(updateQuery, queryParams);

        if (upd.rows.length === 0) {
          await client.query("ROLLBACK");
          console.log(`Transaction update failed: Not found or unauthorized (ID: ${id}, User: ${user_id})`);
          return res.status(404).json({ message: "Transaction not found or not authorized" });
        }
         console.log("Transaction row updated successfully.");
    }


    // --- Update Tags (if tag_ids array was provided) ---
    if (tag_ids !== undefined) {
      console.log(`Updating tags for transaction ${id} with IDs:`, tag_ids);
      // Delete existing tags for this transaction
      await client.query(`DELETE FROM transaction_tags WHERE transaction_id = $1`, [id]);
      
      // Insert new tags if any were provided
      if (tag_ids.length > 0) {
        const insertTagText = `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)`;
        for (const tId of tag_ids) {
          // Check if tag belongs to user
          const tagCheck = await client.query('SELECT 1 FROM tag WHERE tag_id = $1 AND user_id = $2', [tId, user_id]);
          if (tagCheck.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: `Invalid tag selected for update: ID ${tId}` });
          }
          await client.query(insertTagText, [id, tId]);
        }
      }
       console.log("Transaction tags updated.");
    }


    await client.query("COMMIT");

    // --- Fetch and Return Updated Row with Details ---
    const out = await pool.query( // Use pool, transaction committed
      `SELECT t.*, COALESCE(c.category_name, 'N/A') AS category, COALESCE(string_agg(tag.tag_name, ', '), '') AS tags
       FROM transaction t
       LEFT JOIN category c ON t.category_id = c.category_id
       LEFT JOIN transaction_tags tt ON t.transaction_id = tt.transaction_id
       LEFT JOIN tag ON tt.tag_id = tag.tag_id
       WHERE t.transaction_id = $1
       GROUP BY t.transaction_id, c.category_name`, // Group by transaction_id
      [id]
    );

    // Should always find the row if update was successful
    res.json(out.rows[0]); 

  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (e) { console.error("Rollback failed:", e);}
    console.error("❌ Error updating transaction:", err.stack || err);
    if (err.code === "23503") return res.status(400).json({ message: "Invalid category or tag selected.", detail: err.detail });
    if (err.code === '22007' || err.code === '22008' || (err.message && err.message.includes("Invalid transaction_date"))) {
       return res.status(400).json({ message: "Invalid date/time format submitted.", error: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

// --- Delete Transaction ---
exports.deleteTransaction = async (req, res) => { 
  const client = await pool.connect();
  try {
    const user_id = req.user && req.user.user_id;
    if (user_id == null) return res.status(401).json({ message: "Unauthorized: missing user ID" });

    const { id } = req.params;
    await client.query("BEGIN");

    // Tags are deleted by CASCADE constraint via transaction_tags, 
    // but explicit delete is safer if CASCADE isn't guaranteed.
    // await client.query(`DELETE FROM transaction_tags WHERE transaction_id = $1`, [id]);

    const del = await client.query(
      `DELETE FROM transaction WHERE transaction_id = $1 AND user_id = $2 RETURNING *`,
      [id, user_id]
    );

    if (del.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found or not authorized" });
    }

    await client.query("COMMIT");
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (e) {}
    console.error("❌ Error deleting transaction:", err.stack || err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

// Export all functions
module.exports = {
  getTransactions: exports.getTransactions,
  addTransaction: exports.addTransaction,
  updateTransaction: exports.updateTransaction,
  deleteTransaction: exports.deleteTransaction
};