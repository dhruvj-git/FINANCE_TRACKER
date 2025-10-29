// backend/routes/goalRoutes.js
const express = require('express');
const { PythonShell } = require('python-shell');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware'); // Path from routes/ back to middleware/
// Import the helper functions (Path from routes/ back to controllers/)
const { getAverageMonthlyIncome, getAverageMonthlyExpense } = require('../controllers/summaryController');

const router = express.Router();

// Define the POST route for goal analysis: /api/goals/analyze
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Assumes authMiddleware adds user object with id to req
    const { goal_name, goal_cost } = req.body;

    // --- Input Validation ---
    if (!goal_name || typeof goal_name !== 'string' || goal_name.trim().length === 0) {
        return res.status(400).json({ message: 'Valid goal_name is required.' });
    }
    const cost = parseFloat(goal_cost); // Convert goal_cost to a number
    if (isNaN(cost) || cost <= 0) {
      return res.status(400).json({ message: 'Invalid goal_cost provided. Must be a positive number.' });
    }
    // --- End Validation ---

    // --- Call helper functions ---
    // Calculate average over the last 6 months (adjust number as needed)
    const avgIncome = await getAverageMonthlyIncome(userId, 6);
    const avgExpense = await getAverageMonthlyExpense(userId, 6);
    // ---

    // --- PythonShell Configuration ---
    const options = {
        mode: 'json', // Expect JSON input/output
        pythonOptions: ['-u'], // get print results in real-time
        // Correct scriptPath assumes goalRoutes.js is in /routes and analyze_finances.py is in /backend
        scriptPath: path.join(__dirname, '../'), // Points to the 'backend' directory
        args: [] // We use stdin instead of args for JSON
    };
    // ---

    // --- Prepare Data for Python Script ---
    const inputData = {
      goal_name: goal_name.trim(),
      monthly_income: avgIncome,
      monthly_expense: avgExpense,
      item_cost: cost // Python script expects 'item_cost' key for the cost value
    };
    // ---

    let analysisResult = null; // Variable to store result from Python

    // --- Execute Python Script ---
    const pyShell = new PythonShell('analyze_finances.py', options);

    // Send data via stdin
    pyShell.send(inputData);

    // Listener for messages (JSON output) from Python script
    pyShell.on('message', function (message) {
      analysisResult = message;
    });

    // Listener for errors during Python script execution
    pyShell.on('error', function (err) {
        console.error('PythonShell Runtime Error:', err);
        // Ensure response isn't sent twice if 'end' also catches error
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Error running analysis script.', error: err.message || 'Unknown Python error' });
        }
    });

     // Listener for when the Python script finishes
    pyShell.end(function (err, code, signal) {
        if (err) {
            console.error('PythonShell End Error:', err);
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Failed to finalize analysis script.', error: err.message });
            }
        } else if (code !== 0) {
            // Script exited with an error code
            console.error(`Python script exited with non-zero code ${code}, signal ${signal}`);
             if (!res.headersSent) {
                return res.status(500).json({ message: `Analysis script failed unexpectedly (code ${code}).` });
            }
        } else {
            // Script finished successfully
            console.log('Python script finished successfully.');
            if (analysisResult) {
                res.json(analysisResult); // Send the result back to frontend
            } else if (!res.headersSent) {
                // Should not happen in JSON mode if script worked, but handle just in case
                res.status(500).json({ message: 'Analysis script completed but did not return a result.' });
            }
        }
    });
    // --- End Python Script Execution ---

  } catch (error) {
    // Catch errors from async functions (like DB queries) or unexpected issues
    console.error('Goal analysis route error:', error);
    if (!res.headersSent) { // Avoid error if response already sent by PythonShell handlers
        res.status(500).json({ message: 'Server error during goal analysis.' });
    }
  }
});

module.exports = router; // Export the router