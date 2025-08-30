const pool = require("../db");

const createSurveyViaJson = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Normalize metadata into valid JSON
    const metadata =
      data.metadata && typeof data.metadata === "object"
        ? JSON.stringify(data.metadata)
        : JSON.stringify({});

    // Insert survey
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

        // Normalize options into valid JSON (array or null)
        const normalizedOptions =
          options && Array.isArray(options)
            ? JSON.stringify(options)
            : options
            ? JSON.stringify(options)
            : null;

        const questionRes = await client.query(
          `INSERT INTO questions
           (text, survey_id, type, is_required, options, min_value, max_value, order_index, placeholder, help_text, question_route)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            text,
            survey.id,
            type,
            is_required,
            normalizedOptions,
            min_value,
            max_value,
            order_index,
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

module.exports = {
  createSurveyViaJson,
};
