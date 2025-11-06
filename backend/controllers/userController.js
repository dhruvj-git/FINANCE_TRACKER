const db = require('../db/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ✅ Token generator (moved to helper style)
const generateToken = (userId) => {
  return jwt.sign({ user_id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ✅ Register a new user
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existingUser = await db.query('SELECT * FROM app_user WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await db.query(
      'INSERT INTO app_user (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email',
      [username, email, hash]
    );

    const user = result.rows[0];
    const token = generateToken(user.user_id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
};

// ✅ Login an existing user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query('SELECT * FROM app_user WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user.user_id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};
s