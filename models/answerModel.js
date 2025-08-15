const pool = require('../db');

const createOrUpdateAnswersBulk = async (answers) => {
  const values = [];
  const placeholders = [];

  answers.forEach((ans, i) => {
    const baseIndex = i * 4;
    placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`);
    values.push(ans.user_id, ans.question_id, ans.survey_id, ans.answer);
  });

  const query = `
    INSERT INTO answers (user_id, question_id, survey_id, answer)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (user_id, question_id)
    DO UPDATE SET answer = EXCLUDED.answer
    RETURNING *;
  `;

  const res = await pool.query(query, values);
  return res.rows;
};

const getAnswersByUserId = async (userId) => {
  const res = await pool.query(
    'SELECT * FROM answers WHERE user_id = $1 ORDER BY survey_id, question_id',
    [userId]
  );
  return res.rows;
};

const getAnswersBySurveyAndUser = async (surveyId, userId) => {
  const res = await pool.query(
    'SELECT * FROM answers WHERE survey_id = $1 AND user_id = $2 ORDER BY question_id',
    [surveyId, userId]
  );
  return res.rows;
};

const getAnswerByUserAndQuestion = async (userId, questionId) => {
  const res = await pool.query(
    'SELECT * FROM answers WHERE user_id = $1 AND question_id = $2',
    [userId, questionId]
  );
  return res.rows[0];
};

const getAnswersBySurvey = async (surveyId) => {
  const res = await pool.query(
    'SELECT question_id, answer FROM answers WHERE survey_id = $1',
    [surveyId]
  );
  return res.rows;
};

module.exports = {
  createOrUpdateAnswersBulk,
  getAnswersByUserId,
  getAnswersBySurveyAndUser,
  getAnswerByUserAndQuestion,
  getAnswersBySurvey,
};
