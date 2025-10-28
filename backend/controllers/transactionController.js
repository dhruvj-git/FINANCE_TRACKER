// backend/controllers/transactionController.js
const pool = require("../db/db");

/**
 * Helper: safe parse integer or return null
 */
const toIntOrNull = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isInteger(v) ? v : Math.floor(v);
  if (typeof v === "string" && v.trim() === "") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
};

/**
 * Get all transactions for the logged-in user (with category + tags)
 */
exports.getTransactions = async (req, res) => {
  try {
    const user_id = req.user && req.user.user_id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized: missing user" });

    const result = await pool.query(
      `
      SELECT 
  t.transaction_id,
  t.transaction_date,
  t.amount,
  t.description,
  t.payment_mode,
  COALESCE(c.category_name, 'N/A') AS category,
  COALESCE(string_agg(tag.tag_name, ','), '') AS tags
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

/**
 * Add a transaction (robust + transactional)
 * Expects JSON body with:
 *  amount, description, transaction_date (YYYY-MM-DD), category_id (int or null), payment_mode, tag_ids (array of ints) optional
 */
exports.addTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user && req.user.user_id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized: missing user" });

    let { amount, description, transaction_date, category_id, payment_mode, tag_ids } = req.body;

    // validate amount
    amount = parseFloat(amount);
    if (isNaN(amount)) return res.status(400).json({ message: "Invalid amount" });

    // description
    description = description ? String(description).trim() : "";

    // date: if not provided, use today's date (YYYY-MM-DD)
    if (!transaction_date) {
      transaction_date = new Date().toISOString().slice(0, 10);
    } else {
      const d = new Date(transaction_date);
      if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid transaction_date (expected YYYY-MM-DD)" });
      transaction_date = transaction_date.slice(0, 10); // keep YYYY-MM-DD
    }

    // category_id: accept null / "" -> convert to null, or parse int
    category_id = toIntOrNull(category_id);

    // payment mode
    payment_mode = payment_mode ? String(payment_mode).trim() : null;

    // normalize tag_ids into array of ints (if provided as comma string, etc.)
    if (tag_ids && !Array.isArray(tag_ids)) {
      if (typeof tag_ids === "string") {
        tag_ids = tag_ids
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
          .map(x => parseInt(x, 10))
          .filter(n => !isNaN(n));
      } else {
        tag_ids = [];
      }
    }
    if (!tag_ids) tag_ids = [];

    // Start DB transaction
    await client.query("BEGIN");

    const insertTx = await client.query(
      `INSERT INTO transaction (amount, description, transaction_date, user_id, category_id, payment_mode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING transaction_id`,
      [amount, description, transaction_date, user_id, category_id, payment_mode]
    );

    const transaction_id = insertTx.rows[0].transaction_id;

    // Insert tags (if any) into transaction_tags
    if (Array.isArray(tag_ids) && tag_ids.length > 0) {
      const insertTagText = `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)`;
      for (const tIdRaw of tag_ids) {
        const tId = parseInt(tIdRaw, 10);
        if (isNaN(tId)) {
          throw new Error(`Invalid tag id provided: ${tIdRaw}`);
        }
        await client.query(insertTagText, [transaction_id, tId]);
      }
    }

    await client.query("COMMIT");

    // Return newly created transaction with category + tags aggregated
    const out = await pool.query(
      `
      SELECT 
        t.transaction_id,
        t.transaction_date,
        t.amount,
        t.description,
        t.payment_mode,
        c.category_name AS category,
        COALESCE(string_agg(tag.tag_name, ','), '') AS tags
      FROM transaction t
      LEFT JOIN category c ON t.category_id = c.category_id
      LEFT JOIN transaction_tags tt ON t.transaction_id = tt.transaction_id
      LEFT JOIN tag ON tt.tag_id = tag.tag_id
      WHERE t.transaction_id = $1
      GROUP BY t.transaction_id, c.category_name
      `,
      [transaction_id]
    );

    res.status(201).json(out.rows[0]);
  } catch (err) {
    // rollback if started
    try { await client.query("ROLLBACK"); } catch (e) { /* ignore rollback error */ }
    console.error("❌ Error adding transaction:", err.stack || err);
    // If it's a Postgres type parsing error or FK error, send a helpful message
    if (err.code === "23503") {
      // foreign key violation
      return res.status(400).json({ message: "Foreign key constraint failed (invalid category_id or tag_id)", error: err.message });
    }
    if (err.message && err.message.includes("invalid input syntax for integer")) {
      return res.status(400).json({ message: "Invalid numeric input (check category_id/tag_ids)", error: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

/**
 * Update transaction (including tags)
 */
exports.updateTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user && req.user.user_id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized: missing user" });

    const { id } = req.params;
    let { amount, description, transaction_date, category_id, payment_mode, tag_ids } = req.body;

    amount = parseFloat(amount);
    if (isNaN(amount)) return res.status(400).json({ message: "Invalid amount" });

    if (!transaction_date) transaction_date = new Date().toISOString().slice(0, 10);
    else {
      const d = new Date(transaction_date);
      if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid transaction_date (expected YYYY-MM-DD)" });
      transaction_date = transaction_date.slice(0, 10);
    }

    category_id = toIntOrNull(category_id);
    payment_mode = payment_mode ? String(payment_mode).trim() : null;
    if (tag_ids && !Array.isArray(tag_ids)) {
      if (typeof tag_ids === "string") {
        tag_ids = tag_ids.split(",").map(s => s.trim()).filter(Boolean).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
      } else tag_ids = [];
    }
    if (!tag_ids) tag_ids = [];

    await client.query("BEGIN");

    const upd = await client.query(
      `UPDATE transaction
       SET amount = $1, description = $2, transaction_date = $3, category_id = $4, payment_mode = $5
       WHERE transaction_id = $6 AND user_id = $7
       RETURNING *`,
      [amount, description, transaction_date, category_id, payment_mode, id, user_id]
    );

    if (upd.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found or not authorized" });
    }

    // replace tags if tag_ids provided
    if (Array.isArray(tag_ids)) {
      await client.query(`DELETE FROM transaction_tags WHERE transaction_id = $1`, [id]);
      if (tag_ids.length > 0) {
        const insertTagText = `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)`;
        for (const tIdRaw of tag_ids) {
          const tId = parseInt(tIdRaw, 10);
          if (isNaN(tId)) throw new Error(`Invalid tag id: ${tIdRaw}`);
          await client.query(insertTagText, [id, tId]);
        }
      }
    }

    await client.query("COMMIT");

    // return updated row with category+tags
    const out = await pool.query(
      `
      SELECT 
        t.transaction_id,
        t.transaction_date,
        t.amount,
        t.description,
        t.payment_mode,
        c.category_name AS category,
        COALESCE(string_agg(tag.tag_name, ','), '') AS tags
      FROM transaction t
      LEFT JOIN category c ON t.category_id = c.category_id
      LEFT JOIN transaction_tags tt ON t.transaction_id = tt.transaction_id
      LEFT JOIN tag ON tt.tag_id = tag.tag_id
      WHERE t.transaction_id = $1
      GROUP BY t.transaction_id, c.category_name
      `,
      [id]
    );

    res.json(out.rows[0]);
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (e) {}
    console.error("❌ Error updating transaction:", err.stack || err);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

/**
 * Delete transaction
 */
exports.deleteTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.user && req.user.user_id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized: missing user" });

    const { id } = req.params;
    await client.query("BEGIN");

    // remove tags first to avoid FK issues
    await client.query(`DELETE FROM transaction_tags WHERE transaction_id = $1`, [id]);

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
module.exports = {
  getTransactions: exports.getTransactions,
  addTransaction: exports.addTransaction,
  updateTransaction: exports.updateTransaction,
  deleteTransaction: exports.deleteTransaction
};
