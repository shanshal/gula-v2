const answerModel = require('../models/answerModel.js');
const scoringService = require('../services/scoring.js')
// Get all answers
const getAnswers = async (req, res) => {
  try {
    const answers = await answerModel.getAnswers();
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get answer by id
const getAnswerById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const answer = await answerModel.getAnswerById(id);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    res.status(200).json(answer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get answers by user id
const getAnswersByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const answers = await answerModel.getAnswersByUserId(userId);
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get answers by question id
const getAnswersByQuestionId = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const answers = await answerModel.getAnswersByQuestionId(questionId);
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get answers by survey id
const getAnswersBySurveyId = async (req, res) => {
  try {
    const surveyId = parseInt(req.params.surveyId);
    const answers = await answerModel.getAnswersBySurveyId(surveyId);
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create answer
const createAnswer = async (req, res) => {
  try {
    const { user_id, question_id, answer_value, answer_text } = req.body;
    
    if (!user_id || !question_id || answer_value === undefined) {
      return res.status(400).json({ 
        error: 'user_id, question_id, and answer_value are required' 
      });
    }

    const newAnswer = await answerModel.createAnswer(
      user_id, 
      question_id, 
      answer_value, 
      answer_text
    );
    
    res.status(201).json(newAnswer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update answer
const updateAnswer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { answer_value, answer_text } = req.body;
    
    if (answer_value === undefined) {
      return res.status(400).json({ error: 'answer_value is required' });
    }

    const updatedAnswer = await answerModel.updateAnswer(id, answer_value, answer_text);
    if (!updatedAnswer) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    
    res.status(200).json(updatedAnswer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete answer
const deleteAnswer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await answerModel.deleteAnswer(id);
    res.status(200).json({ message: `Answer deleted with ID: ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete answers by user id
const deleteAnswersByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await answerModel.deleteAnswersByUserId(userId);
    res.status(200).json({ message: `All answers deleted for user ID: ${userId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete answers by question id
const deleteAnswersByQuestionId = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    await answerModel.deleteAnswersByQuestionId(questionId);
    res.status(200).json({ message: `All answers deleted for question ID: ${questionId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserAnswersForSurvey = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const surveyId = parseInt(req.params.surveyId);

    const answers = await answerModel.getUserAnswersForSurvey(userId, surveyId);
    
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitAnswersForSurvey = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const surveyId = parseInt(req.params.surveyId);
    const answers = req.body; // array of { question_id, answer_value, answer_text }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const createdAnswers = [];

    for (const ans of answers) {
      const { question_id, answer_value, answer_text } = ans;

      if (!question_id || answer_value === undefined) {
        return res.status(400).json({
          error: 'question_id and answer_value are required for each answer'
        });
      }

      const created = await answerModel.createAnswer(userId, question_id, answer_value, answer_text || null);
      createdAnswers.push(created);
    }

    res.status(201).json({
      success: true,
      submitted_count: createdAnswers.length,
      answers: createdAnswers
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getSurveyScore = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const surveyId = parseInt(req.params.surveyId);

    const score = await scoringService.calculateSurveyScore(userId, surveyId);
    res.status(200).json({ score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAnswers,
  getAnswerById,
  getAnswersByUserId,
  getAnswersByQuestionId,
  getAnswersBySurveyId,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  deleteAnswersByUserId,
  deleteAnswersByQuestionId,
  getUserAnswersForSurvey,
  submitAnswersForSurvey,
  getSurveyScore,
};
