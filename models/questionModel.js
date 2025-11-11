const pool = require('../db');
const {
  normalizeLocalizedInput,
  normalizeLocalizedOptionalInput,
  normalizeOptionsInput,
  normalizeLocalizedOutput,
  normalizeOptionsOutput,
} = require('../surveySchemas/localization');

const formatQuestionRow = (row) => {
  if (!row) return row;
  const formatted = { ...row };
  formatted.question_text = normalizeLocalizedOutput(formatted.question_text);
  formatted.placeholder = formatted.placeholder !== undefined ? normalizeLocalizedOutput(formatted.placeholder) : null;
  formatted.help_text = formatted.help_text !== undefined ? normalizeLocalizedOutput(formatted.help_text) : null;
  if (formatted.options !== undefined && formatted.options !== null) {
    formatted.options = normalizeOptionsOutput(formatted.options);
  }
  if (formatted.weight !== undefined && formatted.weight !== null) {
    const weightNum = Number(formatted.weight);
    formatted.weight = Number.isFinite(weightNum) ? weightNum : formatted.weight;
  }
  return formatted;
};

// Get all questions
const getQuestions = async () => {
  const res = await pool.query("SELECT * FROM questions ORDER BY survey_id ASC");
  return res.rows.map(formatQuestionRow);
}
// Get question by id
const getQuestionById = async (id) => {
  const res = await pool.query("SELECT * FROM questions where id = $1", [id]);
  return formatQuestionRow(res.rows[0]);
}

//Create Question
const createQuestion = async (
  question_text,
  surveyId,
  question_type = 'text',
  is_required = false,
  options = null,
  min_value = null,
  max_value = null,
  question_order = 0,
  placeholder = null,
  help_text = null,
  weight = 1
) => {
  const localizedText = normalizeLocalizedInput(question_text, 'question.question_text');
  const normalizedOptions = normalizeOptionsInput(options, 'question.options');
  const localizedPlaceholder = normalizeLocalizedOptionalInput(placeholder, 'question.placeholder');
  const localizedHelpText = normalizeLocalizedOptionalInput(help_text, 'question.help_text');
  const weightValue = weight != null ? Number(weight) : 1;
  const normalizedWeight = Number.isFinite(weightValue) ? weightValue : 1;

  const res = await pool.query(
    `INSERT INTO questions
     (question_text, survey_id, question_type, is_required, options, min_value, max_value, question_order, placeholder, help_text, weight)
     VALUES ($1::jsonb, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
     RETURNING *`,
    [
      JSON.stringify(localizedText),
      surveyId,
      question_type,
      is_required,
      normalizedOptions ? JSON.stringify(normalizedOptions) : null,
      min_value,
      max_value,
      question_order,
      localizedPlaceholder ? JSON.stringify(localizedPlaceholder) : null,
      localizedHelpText ? JSON.stringify(localizedHelpText) : null,
      normalizedWeight,
    ]
  );
  return formatQuestionRow(res.rows[0]);
};

// Edit question
const updateQuestion = async (id, updateData) => {
  const sets = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      let normalizedValue = value;
      let isJsonField = false;

      if (key === 'question_text') {
        normalizedValue = normalizeLocalizedInput(value, 'question.question_text');
        isJsonField = true;
      } else if (key === 'options') {
        normalizedValue = normalizeOptionsInput(value, 'question.options');
        isJsonField = true;
      } else if (key === 'placeholder') {
        normalizedValue = normalizeLocalizedOptionalInput(value, 'question.placeholder');
        isJsonField = true;
      } else if (key === 'help_text') {
        normalizedValue = normalizeLocalizedOptionalInput(value, 'question.help_text');
        isJsonField = true;
      }

      if (isJsonField) {
        sets.push(`${key} = $${i}::jsonb`);
        values.push(normalizedValue === null ? null : JSON.stringify(normalizedValue));
      } else {
        sets.push(`${key} = $${i}`);
        values.push(normalizedValue);
      }
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
  return formatQuestionRow(res.rows[0]);
};

// Delete survey
const deleteQuestion = async (id) => {
  await pool.query(`DELETE FROM questions where id = $1`, [id])
}
const getQuestionsBySurveyId = async (surveyId) => {
  const res = await pool.query(
    `SELECT * FROM questions 
     WHERE survey_id = $1
     ORDER BY order_index ASC, id ASC`,
    [surveyId]
  );
  return res.rows.map(formatQuestionRow);
};



module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySurveyId,
}
