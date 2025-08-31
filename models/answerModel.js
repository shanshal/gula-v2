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
    SELECT a.*, q.question_text, q.question_type, q.question_order 
    FROM answers a 
    JOIN questions q ON a.question_id = q.id 
    WHERE q.survey_id = $1 
    ORDER BY q.question_order ASC, a.id ASC
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

const getUserAnswersForSurvey = async (userId, surveyId) => {
  const res = await pool.query(`
    SELECT DISTINCT ON (a.question_id) a.question_id, a.answer_value, a.answer_text, a.created_at, q.question_order
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.user_id = $1 AND q.survey_id = $2
    ORDER BY a.question_id, a.created_at DESC
  `, [userId, surveyId]);
  return res.rows.reduce((acc, row) => {
    // Use question_order as the key instead of question_id
    acc[row.question_order] = parseInt(row.answer_value);
    return acc;
  }, {});
};

// Bulk operations might be the only one we use after all
const createAnswers = async (userId, answers) => {
  const createdAnswers = [];
  for (const ans of answers) {
    const { question_id, answer_value, answer_text } = ans;
    const created = await createAnswer(userId, question_id, answer_value, answer_text || null);
    createdAnswers.push(created);
  }
  return createdAnswers;
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
  getUserAnswersForSurvey,
};
