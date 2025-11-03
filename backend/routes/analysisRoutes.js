// backend/routes/analysisRoutes.js

const express = require('express');
const router = express.Router();
// This line imports the controller from Step 1
const analysisController = require('../controllers/analysisController');

// @route   POST /affordability
// @desc    Check if a user can afford an item
router.post('/affordability', analysisController.checkAffordability);

// @route   POST /budget-rule
// @desc    Calculate the 50/30/20 budget rule
router.post('/budget-rule', analysisController.calculateBudgetRule);

// ✅ THIS IS THE LINE THAT FIXES THE CRASH
// It exports the router so index.js can use it.
module.exports = router;