// backend/db/db.js
require('dotenv').config();
const { Pool } = require('pg');

// Optional: Validate all required environment variables
const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  Environment variable ${key} is not defined`);
  }
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10), // default to 5432 if not set
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database successfully.'))
  .catch((err) => {
    console.error('❌ Failed to connect to the database:', err.message);
    process.exit(1); // stop the server if db fails
  });

module.exports = pool;
