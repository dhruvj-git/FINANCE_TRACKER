// controllers/registerController.js (Complete, Corrected File)

const pool = require("../db/db"); // Use 'pool' for consistency
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// This is the only function that should be in this file
const registerUser = async (req, res) => {
  // ✅ FIX: Get 'name' from the form body, not 'username'
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide name, email, and password." });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query("SELECT * FROM app_user WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ FIX: Insert 'name' into the 'username' column
    const newUser = await pool.query(
      "INSERT INTO app_user (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    // Generate JWT token with the auto-incremented user_id
    const token = jwt.sign(
      { user_id: newUser.rows[0].user_id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ token });
  } catch (err) {
    console.error("❌ Registration Server Error:", err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  registerUser,
};