const questionModel = require('../models/questionModel');

// Get all questions
const getQuestions = async (req, res) => {
  try {
    const questions = await questionModel.getQuestions();
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get question by id
const getQuestionById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const question = await questionModel.getQuestionById(id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get questions by survey ID
const getQuestionsBySurveyId = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const questions = await questionModel.getQuestionsBySurveyId(surveyId);
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create question
const createQuestion = async (req, res) => {
  try {
    const {
      question_text,
      survey_id,
      question_type = 'text',
      is_required = false,
      options = null,
      min_value = null,
      max_value = null,
      question_order = 0,
      placeholder = null,
      help_text = null,
      weight = 1,
    } = req.body;

    const newQuestion = await questionModel.createQuestion(
      question_text,
      survey_id,
      question_type,
      is_required,
      options,
      min_value,
      max_value,
      question_order,
      placeholder,
      help_text,
      weight
    );

    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;

    const updatedQuestion = await questionModel.updateQuestion(id, updateData);
    if (!updatedQuestion)
      return res.status(404).json({ error: 'Question not found or no fields to update' });
    res.status(200).json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await questionModel.deleteQuestion(id);
    res.status(200).json({ message: `Question deleted with ID: ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  getQuestionsBySurveyId,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
