// db.js
const pkg = require('pg');
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

module.exports = pool;
