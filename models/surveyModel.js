const pool = require("../db");

const getSurveys = async () => {
  const res = await pool.query("SELECT * FROM surveys ORDER BY id ASC");
  return res.rows;
};

const getSurveyById = async (id) => {
  const client = await pool.connect();
  try {
    const surveyRes = await client.query(
      `SELECT * FROM surveys WHERE id = $1`,
      [id]
    );
    const survey = surveyRes.rows[0];
    if (!survey) return null;

    const questionsRes = await client.query(
      `SELECT
         id,
         question_text, 
         question_type, 
         is_required, 
         options, 
         min_value, 
         max_value, 
         question_order, 
         placeholder, 
         help_text, 
         question_route
       FROM questions
       WHERE survey_id = $1
       ORDER BY question_order ASC`,
      [id]
    );

    return {
      survey,
      questions: questionsRes.rows
    };
  } finally {
    client.release();
  }
};

const createSurvey = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const metadata =
      data.metadata && typeof data.metadata === "object"
        ? JSON.stringify(data.metadata)
        : JSON.stringify({});

    const surveyRes = await client.query(
      `INSERT INTO surveys (name, metadata)
       VALUES ($1, $2::jsonb)
       RETURNING *`,
      [data.name, metadata]
    );
    const survey = surveyRes.rows[0];

    const questionResults = [];
    if (Array.isArray(data.questions)) {
      for (const q of data.questions) {
        const {
          text,
          type,
          is_required = false,
          options = null,
          min_value = null,
          max_value = null,
          question_order = 0,
          placeholder = null,
          help_text = null,
          question_route = null,
        } = q;

        const normalizedOptions =
          options && Array.isArray(options)
            ? JSON.stringify(options)
            : options
            ? JSON.stringify(options)
            : null;

        const questionRes = await client.query(
          `INSERT INTO questions
           (survey_id, question_text, question_type, is_required, options, min_value, max_value, question_order, placeholder, help_text, question_route)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            survey.id,
            text,
            type,
            is_required,
            normalizedOptions,
            min_value,
            max_value,
            question_order,
            placeholder,
            help_text,
            question_route,
          ]
        );

        questionResults.push(questionRes.rows[0]);
      }
    }

    await client.query("COMMIT");

    return {
      survey,
      questions: questionResults,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateSurvey = async (name, id) => {
  await pool.query(`UPDATE surveys SET name = $1 WHERE id = $2`, [name, id]);
};

const deleteSurvey = async (id) => {
  await pool.query(`DELETE FROM surveys WHERE id = $1`, [id]);
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
};
