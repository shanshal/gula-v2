const pool = require('../db');

// Get all questions
const getQuestions = async () => {
  const res = await pool.query("SELECT * FROM questions ORDER BY survey_id ASC");
  return res.rows;
}
// Get question by id
const getQuestionById = async (id) => {
  const res = await pool.query("SELECT * FROM questions where id = $1", [id]);
  return res.rows[0];
}

//Create Question
const createQuestion = async (
  text,
  surveyId,
  type = 'text',
  is_required = false,
  options = null,
  min_value = null,
  max_value = null,
  order_index = 0,
  placeholder = null,
  help_text = null
) => {
  const res = await pool.query(
    `INSERT INTO questions
     (text, survey_id, type, is_required, options, min_value, max_value, order_index, placeholder, help_text)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [text, surveyId, type, is_required, options, min_value, max_value, order_index, placeholder, help_text]
  );
  return res.rows[0];
};

// Edit question
const updateQuestion = async (id, updateData) => {
  const sets = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      sets.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
  }

  if (sets.length === 0) {
    throw new Error('No fields to update');
  }

  // Add id as last parameter
  values.push(id);

  const query = `
    UPDATE questions
    SET ${sets.join(', ')}
    WHERE id = $${i}
    RETURNING *;
  `;

  const res = await pool.query(query, values);
  return res.rows[0];
};

// Delete survey
const deleteQuestion = async (id) => {
  await pool.query(`DELETE FROM questions where id = $1`, [id])
}



module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
}
