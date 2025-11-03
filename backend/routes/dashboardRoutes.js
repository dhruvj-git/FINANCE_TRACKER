const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /dashboard
// @desc    Get dashboard summary widgets
// @access  Private
router.get('/', authMiddleware, dashboardController.getDashboardSummary);

module.exports = router;