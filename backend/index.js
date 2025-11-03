// backend/index.js

// -------------------------------
// 1. IMPORTS & SETUP
// -------------------------------
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// --- Import Middleware ---
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// -------------------------------
// 2. MIDDLEWARE
// -------------------------------
app.use(cors());
app.use(express.json());

// -------------------------------
// 3. LOGGING (Optional)
// -------------------------------
console.log("🧪 JWT_SECRET from .env:", process.env.JWT_SECRET);

// -------------------------------
// 4. ROUTES
// -------------------------------

// Import all route modules
const authRoutes = require('./routes/authRoutes');
const registerRoutes = require('./routes/registerRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const tagRoutes = require('./routes/tagRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes.js'); 
// ✅ This line imports the file from Step 2
const analysisRoutes = require('./routes/analysisRoutes');     
const chartRoutes = require('./routes/chartRoutes.js');
console.log("✅ Routes loaded: auth, register, user, transaction, category, tag, budget, dashboard, analysis, charts");

// --- Mount Public Routes ---
app.use('/auth', authRoutes);
app.use('/register', registerRoutes);

// --- Mount Protected API Routes ---
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/tags', authMiddleware, tagRoutes);
app.use('/api/budgets', authMiddleware, budgetRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes); 

// ✅ This line (line 58) will now work
app.use('/api/analysis', authMiddleware, analysisRoutes); 
// The corrected line
app.use('/api/charts', authMiddleware, chartRoutes);

// -------------------------------
// 5. START SERVER
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});