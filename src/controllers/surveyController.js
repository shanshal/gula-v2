const { Survey, Question } = require('../models');
const { Op } = require('sequelize');
const { seedSurveys } = require('../../scripts/seed_surveys');

const getSurveys = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      category
    } = req.query;

    const where = {};

    // Add search filter
    if (search) {
      where[Op.or] = [
        { '$name.en$': { [Op.iLike]: `%${search}%` } },
        { '$name.ar$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add category filter
    if (category) {
      where['$metadata.category$'] = category;
    }

    const surveys = await Survey.findAll({
      where,
      include: [{
        model: Question,
        as: 'questions',
        order: [['question_order', 'ASC']]
      }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(surveys);
  } catch (error) {
    console.error('Error loading surveys:', error);
    res.status(500).json({ error: 'Failed to load surveys' });
  }
};

const getSurveyById = async (req, res) => {
  const { id } = req.params;
  try {
    const survey = await Survey.findByPk(id, {
      include: [{
        model: Question,
        as: 'questions',
        order: [['question_order', 'ASC']]
      }]
    });

    if (!survey) return res.status(404).json({ error: 'Survey not found' });

    res.status(200).json({
      survey,
      questions: survey.questions
    });
  } catch (err) {
    console.error('Error fetching survey:', err);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
};

const createSurvey = async (req, res) => {
  try {
    const surveyData = req.body;
    const questions = surveyData.questions || [];
    delete surveyData.questions;

    const newSurvey = await Survey.create(surveyData);

    // Create questions if provided
    if (questions.length > 0) {
      const questionsToCreate = questions.map((q, index) => ({
        ...q,
        survey_id: newSurvey.id,
        question_order: q.question_order || index + 1
      }));

      await Question.bulkCreate(questionsToCreate);
    }

    // Fetch the complete survey with questions
    const completeSurvey = await Survey.findByPk(newSurvey.id, {
      include: [{
        model: Question,
        as: 'questions',
        order: [['question_order', 'ASC']]
      }]
    });

    res.status(201).json({
      survey: completeSurvey,
      questions: completeSurvey.questions
    });
  } catch (err) {
    console.error('Error creating survey:', err);
    res.status(500).json({ error: 'Failed to create survey' });
  }
};

const updateSurvey = async (req, res) => {
  const { id } = req.params;
  try {
    const updateData = req.body;
    const questions = updateData.questions;
    delete updateData.questions;

    const [updatedRowsCount] = await Survey.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Update questions if provided
    if (questions && Array.isArray(questions)) {
      // Delete existing questions and create new ones
      await Question.destroy({ where: { survey_id: id } });

      if (questions.length > 0) {
        const questionsToCreate = questions.map((q, index) => ({
          ...q,
          survey_id: id,
          question_order: q.question_order || index + 1
        }));

        await Question.bulkCreate(questionsToCreate);
      }
    }

    res.status(200).json({ message: `Survey updated with id: ${id}` });
  } catch (err) {
    console.error('Error updating survey:', err);
    res.status(500).json({ error: 'Failed to update survey' });
  }
};

const patchSurvey = async (req, res) => {
  const { id } = req.params;

  try {
    const updateData = req.body;

    // Validate that we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const [updatedRowsCount] = await Survey.update(updateData, {
      where: { id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Fetch updated survey
    const updatedSurvey = await Survey.findByPk(id, {
      include: [{
        model: Question,
        as: 'questions',
        order: [['question_order', 'ASC']]
      }]
    });

    res.status(200).json({
      message: `Survey ${id} updated successfully`,
      updatedFields: Object.keys(updateData),
      survey: updatedSurvey,
      questions: updatedSurvey.questions
    });

  } catch (err) {
    console.error('Error partially updating survey:', err);
    res.status(500).json({
      error: 'Failed to update survey',
      details: err.message
    });
  }
};

const deleteSurvey = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRowsCount = await Survey.destroy({
      where: { id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.status(200).json({ message: `Survey deleted ${id}` });
  } catch (err) {
    console.error('Error deleting survey:', err);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
};

const runSeeder = async (req, res) => {
  try {
    const count = await seedSurveys();
    res.status(200).json({ 
      message: 'Seeder completed successfully', 
      surveysCreated: count 
    });
  } catch (error) {
    console.error('Error running seeder:', error);
    res.status(500).json({ error: 'Failed to run seeder' });
  }
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  patchSurvey,
  deleteSurvey,
  runSeeder
};