/*const express = require("express");
const router = express.Router();

// ✅ Import controllers
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

// ✅ Import middleware
const authenticate = require("../middleware/authMiddleware");

// ✅ Routes (all protected by authentication)
router.get("/", authenticate, getCategories);        // Get all categories of logged-in user
router.post("/", authenticate, addCategory);        // Add new category
router.put("/:id", authenticate, updateCategory);   // Update category
router.delete("/:id", authenticate, deleteCategory); // Delete category

module.exports = router;
// In routes/categoryRoutes.js

const express = require("express");
const router = express.Router();

// A VERY SIMPLE TEST ROUTE
router.get("/", (req, res) => {
  // This log MUST appear if the route is working
  console.log("✅✅✅ --- THE /api/categories ROUTE WAS SUCCESSFULLY REACHED! --- ✅✅✅");
  
  // Send back a simple message
  res.status(200).json({ message: "Test successful!" });
});

module.exports = router;*/
// In routes/categoryRoutes.js

// In routes/categoryRoutes.js

// routes/categoryRoutes.js

const express = require("express");
const router = express.Router();

// Import both functions from the controller
const { getCategories, addCategory } = require("../controllers/categoryController");
const authenticate = require("../middleware/authMiddleware");

// Defines the route for GETTING all categories
router.get("/", authenticate, getCategories);

// Defines the route for ADDING (POSTing) a new category
// The 404 error is because this line is missing.
router.post("/", authenticate, addCategory);

module.exports = router;