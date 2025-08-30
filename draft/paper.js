const fs = require("fs");

async function loadJson() {
  const data = await fs.promises.readFile("example.json", "utf8");
  return JSON.parse(data);
}

async function main() {
  const obj = await loadJson();
  console.log(obj.questions[0].options); 
}

main();
;

const modelCreateSurveyViaJson = async (data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const surveyRes = await client.query(
      "INSERT INTO surveys (name) VALUES ($1) RETURNING *",
      [data.name]
    );
    const survey = surveyRes.rows[0];

    const questionResults = [];
    if (Array.isArray(data.questions)) {
      for (const q of data.questions) {
        const {
          question_text,
          question_type = 'text',
          is_required = false,
          options = null,
          min_value = null,
          max_value = null,
          question_order = 0,
          placeholder = null,
          help_text = null,
          question_route = null,
        } = q;

        const questionRes = await client.query(
          `INSERT INTO questions
           (question_text, survey_id, question_type, is_required, options, min_value, max_value, question_order, placeholder, help_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [question_text, survey.id, question_type, is_required, options, min_value, max_value, question_order, placeholder, help_text, question_route]
        );
        questionResults.push(questionRes.rows[0]);
      }
    }

    await client.query('COMMIT');

    return {
      survey,
      questions: questionResults
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const controllerCreateSurveyViaJson = async (req, res) => {
  const data = req.body;

  // Basic validation
  if (!data.name || !Array.isArray(data.questions) || data.questions.length === 0) {
    return res.status(400).json({ error: "Invalid survey JSON: missing 'name' or 'questions'" });
  }

  try {
    // Call the model function that handles full JSON
    const result = await createSurveyFull(data);

    // Return the inserted survey and questions
    res.status(201).json(result);

  } catch (error) {
    console.error("Error creating survey:", error);
    res.status(500).json({ error: "Failed to create survey" });
  }
};
