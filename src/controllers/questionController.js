const { Question, Survey } = require('../models');

// Get all questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.findAll({
      include: [{ model: Survey, as: 'survey' }],
      order: [['question_order', 'ASC']]
    });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get question by id
const getQuestionById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const question = await Question.findByPk(id, {
      include: [{ model: Survey, as: 'survey' }]
    });
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
    const questions = await Question.findAll({
      where: { survey_id: surveyId },
      include: [{ model: Survey, as: 'survey' }],
      order: [['question_order', 'ASC']]
    });
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

    const newQuestion = await Question.create({
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
    });

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

    const [updatedRowsCount] = await Question.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Question not found or no fields to update' });
    }

    const updatedQuestion = await Question.findByPk(id);
    res.status(200).json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deletedRowsCount = await Question.destroy({
      where: { id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

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
