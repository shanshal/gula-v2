const pool = require('../db');

// Get all answers
const getAnswers = async () => {
  const res = await pool.query('SELECT * FROM answers ORDER BY id ASC');
  return res.rows;
};

// Get answer by id
const getAnswerById = async (id) => {
  const res = await pool.query('SELECT * FROM answers WHERE id = $1', [id]);
  return res.rows[0];
};

// Get answers by user id
const getAnswersByUserId = async (userId) => {
  const res = await pool.query('SELECT * FROM answers WHERE user_id = $1 ORDER BY id ASC', [userId]);
  return res.rows;
};

// Get answers by question id
const getAnswersByQuestionId = async (questionId) => {
  const res = await pool.query('SELECT * FROM answers WHERE question_id = $1 ORDER BY id ASC', [questionId]);
  return res.rows;
};

// Get answers by survey id (through questions)
const getAnswersBySurveyId = async (surveyId) => {
  const res = await pool.query(`
    SELECT a.*, q.text as question_text, q.type as question_type 
    FROM answers a 
    JOIN questions q ON a.question_id = q.id 
    WHERE q.survey_id = $1 
    ORDER BY a.id ASC
  `, [surveyId]);
  return res.rows;
};

// Create answer
const createAnswer = async (userId, questionId, answerValue, answerText = null) => {
  const res = await pool.query(
    'INSERT INTO answers (user_id, question_id, answer_value, answer_text, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [userId, questionId, answerValue, answerText]
  );
  return res.rows[0];
};

// Update answer
const updateAnswer = async (id, answerValue, answerText = null) => {
  const res = await pool.query(
    'UPDATE answers SET answer_value = $1, answer_text = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [answerValue, answerText, id]
  );
  return res.rows[0];
};

// Delete answer
const deleteAnswer = async (id) => {
  await pool.query('DELETE FROM answers WHERE id = $1', [id]);
};

// Delete answers by user id
const deleteAnswersByUserId = async (userId) => {
  await pool.query('DELETE FROM answers WHERE user_id = $1', [userId]);
};

// Delete answers by question id
const deleteAnswersByQuestionId = async (questionId) => {
  await pool.query('DELETE FROM answers WHERE question_id = $1', [questionId]);
};

module.exports = {
  getAnswers,
  getAnswerById,
  getAnswersByUserId,
  getAnswersByQuestionId,
  getAnswersBySurveyId,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  deleteAnswersByUserId,
  deleteAnswersByQuestionId,
};
