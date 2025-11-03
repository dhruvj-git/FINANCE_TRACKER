// backend/routes/chartRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller
const chartController = require('../controllers/chartController');

// --- Define the routes ---

// @route   GET /api/charts/expense-by-category
// @desc    Get data for expense pie chart
router.get('/expense-by-category', chartController.getExpenseByCategory);

// @route   GET /api/charts/income-vs-expense
// @desc    Get data for income/expense line chart
router.get('/income-vs-expense', chartController.getIncomeVsExpense);

// @route   GET /api/charts/monthly-expenditure
// @desc    Get data for monthly expense bar chart
router.get('/monthly-expenditure', chartController.getMonthlyExpenditure);


// ✅ This exports the router so index.js can use it.
module.exports = router;