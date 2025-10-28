const db = require('../db/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ✅ Register a new user
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if email already exists
    const existingUser = await db.query('SELECT * FROM app_user WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO app_user (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email',
      [username, email, hash]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ message: 'User registered successfully', user, token });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ✅ Login an existing user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM app_user WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = generateToken(user);
      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials.' });
    }
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};
