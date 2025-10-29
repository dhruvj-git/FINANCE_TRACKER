// backend/routes/summaryRoutes.js
const express = require('express');
const router = express.Router(); // <-- Use express.Router(), not app
const summaryController = require('../controllers/summaryController');
const authenticateToken = require('../middleware/authMiddleware');

// --- THIS IS THE FIX ---
// Your old code said "app.get(...)". It must be "router.get(...)".
// We also call summaryController.getSummary because your controller exports an object
router.get('/', authenticateToken, summaryController.getSummary);

module.exports = router; // Export the router