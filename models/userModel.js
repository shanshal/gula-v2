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
  const res = await pool.query(
    'INSERT INTO users (name, email, age, sex, weight) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, email, age, sex, weight]
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
