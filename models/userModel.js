const pool = require('../db');

const getUsers = async () => {
  const res = await pool.query('SELECT * FROM users ORDER BY id ASC');
  return res.rows;
};

const getUserById = async (id) => {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

const createUser = async (name, email, age, sex, weight) => {
  // Generate username from email (before @) or use name, make it unique
  const baseUsername = email ? email.split('@')[0] : name.toLowerCase().replace(/\s+/g, '');
  const timestamp = Date.now().toString().slice(-4);
  const username = `${baseUsername}_${timestamp}`;
  const defaultPassword = 'temp_password_123';
  
  const res = await pool.query(
    'INSERT INTO users (name, email, age, sex, weight, username, password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, email, age, sex, weight, username, defaultPassword]
  );
  return res.rows[0];
};

const updateUser = async (id, name, email, age, sex, weight) => {
  await pool.query(
    'UPDATE users SET name = $1, email = $2, age = $3, sex = $4, weight = $5 WHERE id = $6',
    [name, email, age, sex, weight, id]
  );
};


const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
