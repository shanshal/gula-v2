const surveyModel = require('../models/surveyModel');

const getSurveys = async(req, res) => {
  const surveys = await surveyModel.getSurveys();
  res.status(200).json(surveys);
};
const getSurveyById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const fullSurvey = await surveyModel.getSurveyById(id);
    if (!fullSurvey) return res.status(404).json({ error: 'Survey not found' });
    res.status(200).json(fullSurvey);
  } catch (err) {
    console.error('Error fetching survey:', err);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
};;

const createSurvey = async (req, res) => {
  try {
    const surveyData = req.body;
    const newSurvey = await surveyModel.createSurvey(surveyData);
    res.status(201).json(newSurvey);
  } catch (err) {
    console.error('Error creating survey via JSON:', err);
    res.status(500).json({ error: 'Failed to create survey via JSON' });
  }
};

const updateSurvey = async (req, res) => {
  const id = parseInt(req.params.id);
  const {name} = req.body;
  await surveyModel.updateSurvey(name, id);
  res.status(200).send(`survey updated with id: ${id}`);
};

const deleteSurvey = async (req, res) => {
  const id = parseInt(req.params.id);
  await surveyModel.deleteSurvey(id);
  res.status(200).send(`Survey deleted ${id}`);
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey
};
