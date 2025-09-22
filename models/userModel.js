const pool = require('../db');
const bcrypt = require('bcryptjs');

const getUsers = async () => {
  const res = await pool.query('SELECT id, name, email, age, sex, weight, created_at FROM users ORDER BY id ASC');
  return res.rows;
};

const getUserById = async (id) => {
  const res = await pool.query('SELECT id, name, email, age, sex, weight, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

const getUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

const createUser = async (name, email, password, age, sex, weight) => {
  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  const res = await pool.query(
    'INSERT INTO users (name, email, password_hash, age, sex, weight) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, age, sex, weight, created_at',
    [name, email, passwordHash, age, sex, weight]
  );
  return res.rows[0];
};

const updateUser = async (id, name, email, age, sex, weight) => {
  await pool.query(
    'UPDATE users SET name = $1, email = $2, age = $3, sex = $4, weight = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
    [name, email, age, sex, weight, id]
  );
};

const updateUserPassword = async (id, newPassword) => {
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, id]
  );
};

const verifyPassword = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }
  
  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  updateUserPassword,
  verifyPassword,
  deleteUser,
};
