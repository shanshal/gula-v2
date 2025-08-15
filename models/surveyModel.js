const pool = require("../db");

// Get all surveys
const getSurveys = async () => {
  const res = await pool.query("SELECT * FROM surveys ORDER BY id ASC");
  return res.rows;
};
 

// Get survey by id
const getSurveyById = async (id) => {
  const res = await pool.query("SELECT * FROM surveys WHERE id = $1", [id]);
  return res.rows[0];
};


//Create Survey
const createSurvey = async (name) => {
  const res = await pool.query(
    "INSERT INTO surveys (name) VALUES ($1) RETURNING *",
    [name],
  );
  return res.rows[0];
};

// Edit survey TODO make it possible to edit other params
const updateSurvey = async (id, name) => {
  await pool.query(
    `UPDATE surveys SET name = $1 WHERE id = $2`,
    [name, id]
  );
};
// Delete survey
const deleteSurvey = async (id) => {
  await pool.query(`DELETE FROM surveys WHERE id = $1`, [id]);
}



module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
}
