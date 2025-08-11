const answerModel = require('../models/answerModel');

const createOrUpdateAnswersBulk = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers must be a non-empty array' });
    }
    const result = await answerModel.createOrUpdateAnswersBulk(answers);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnswersByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const answers = await answerModel.getAnswersByUserId(userId);
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnswersBySurveyAndUser = async (req, res) => {
  try {
    const surveyId = parseInt(req.params.surveyId);
    const userId = parseInt(req.params.userId);
    const answers = await answerModel.getAnswersBySurveyAndUser(surveyId, userId);
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnswerByUserAndQuestion = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const questionId = parseInt(req.params.questionId);
    const answer = await answerModel.getAnswerByUserAndQuestion(userId, questionId);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.status(200).json(answer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrUpdateAnswersBulk,
  getAnswersByUserId,
  getAnswersBySurveyAndUser,
  getAnswerByUserAndQuestion,
};
