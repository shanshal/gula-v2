const surveyJsonModel = require('../models/jsonSurveyModel');

const controllerCreateSurveyViaJson = async (req, res) => {
  try {
    const surveyData = req.body;
    const newSurvey = await surveyJsonModel.createSurveyViaJson(surveyData);
    res.status(201).json(newSurvey);
  } catch (err) {
    console.error('Error creating survey via JSON:', err);
    res.status(500).json({ error: 'Failed to create survey via JSON' });
  }
};

module.exports = {
  controllerCreateSurveyViaJson,
};

