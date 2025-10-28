// index.js (Complete, Corrected File)

// -------------------------------
// 1. IMPORTS & SETUP
// -------------------------------
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// -------------------------------
// 2. MIDDLEWARE
// -------------------------------
app.use(cors());
app.use(express.json());

// -------------------------------
// 3. LOGGING (Optional - remove for production)
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
// ✅ FIX: This line was missing. You need to import the routes.
const dashboardRoutes = require('./routes/dashboardRoutes'); 

// Log route loading (Optional)
console.log("✅ Routes loaded: auth, register, user, transaction, category, tag, budget, dashboard");

// Mount all routes
app.use('/auth', authRoutes);
app.use('/register', registerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes); // This line will now work

// -------------------------------
// 5. START SERVER
// -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});