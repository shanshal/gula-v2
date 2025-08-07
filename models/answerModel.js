const pool = require('../db');

const getAnswers = async () => {
  const res = await pool.query('SELECT * FROM answers ORDER BY id ASC');
  return res.rows
};
