const surveyModel = require('../models/surveyModel');

const getSurveys = async(req, res) => {
  const surveys = await surveyModel.getSurveys();
  res.status(200).json(surveys);
};
const getSurveyById = async (req, res) => {
  const id = parseInt(req.params.id);
  const survey = await surveyModel.getSurveyById(id);
  res.status(200).json(survey);
};

const createSurvey = async (req, res) => {
  const {name} = req.body;
  const newSurvey = await surveyModel.createSurvey(name);
  res.status(201).json(newSurvey);
};

const updateSurvey = async (req, res) => {
  const id = parseInt(req.params.id);
  const {name} = req.body;
  await surveyModel.updateSurvey(id, name);
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
