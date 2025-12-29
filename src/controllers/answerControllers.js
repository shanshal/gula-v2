const { Answer, Survey, Question, SurveySubmission, SurveyAnswer } = require('../models');
const scoringService = require('../services/scoring.js');
const authClient = require('../services/authClient');

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 100;

const resolveUserByPublicId = async (publicId, res) => {
  const normalizedId = typeof publicId === 'string' ? publicId.trim() : String(publicId ?? '').trim();
  
  try {
    const user = await authClient.getUserById(normalizedId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error resolving user by public ID:', error.message);
    res.status(500).json({ error: 'Failed to resolve user' });
    return null;
  }
};

const buildResponsesByQuestion = (responses = []) => {
  const map = {};
  for (const response of responses) {
    const key = response?.question_id != null ? String(response.question_id).trim() : '';
    if (!key) continue;
    const value = response.answer_text ?? response.answer_value;
    map[key] = value;
  }
  return map;
};

const serializeSubmission = (submission, responsesByQuestion, scorePayload) => {
  const responses = Array.isArray(submission.responses)
    ? submission.responses.map((response) => ({
        id: response.id,
        questionId: response.question_id,
        questionOrder: response.question?.question_order || 0,
        answerValue: response.answer_value,
        answerText: response.answer_text,
        createdAt: response.created_at,
      }))
    : [];

  const payload = {
    submissionId: submission.id,
    surveyId: submission.survey_id,
    userId: submission.user_id,
    status: submission.status,
    submittedAt: submission.submitted_at,
    updatedAt: submission.updated_at,
    responses,
    responsesByQuestion,
  };

  if (scorePayload && typeof scorePayload === 'object') {
    payload.score = scorePayload;
  }

  return payload;
};
// Get all answers
const getAnswers = async (req, res) => {
  try {
    const answers = await Answer.findAll();
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get answer by id
const getAnswerById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const answer = await Answer.findByPk(id);
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
    const { userId } = req.params;
    const user = await resolveUserByPublicId(userId, res);
    if (!user) {
      return;
    }
    
    // Get all survey answers for this user from the new structure
    const surveyAnswers = await SurveyAnswer.findAll({
      where: {},
      include: [{
        model: SurveySubmission,
        as: 'submission',
        where: { user_id: user.id },
        include: [{
          model: Survey,
          as: 'survey',
        }]
      }, {
        model: Question,
        as: 'question',
      }],
      order: [['created_at', 'DESC']],
    });

    // Format the response to match the expected structure
    const formattedAnswers = surveyAnswers.map(answer => ({
      id: answer.id,
      user_id: answer.submission.user_id,
      survey_id: answer.submission.survey_id,
      question_id: answer.question_id,
      answer_value: answer.answer_value,
      answer_text: answer.answer_text,
      created_at: answer.created_at,
      submission_id: answer.submission_id,
      survey_name: answer.submission.survey?.name || null,
      question_text: answer.question?.question_text || null,
    }));

    res.status(200).json(formattedAnswers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get answers by question id
const getAnswersByQuestionId = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const answers = await Answer.findAll({ where: { question_id: questionId } });
    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get answers by survey id
const getAnswersBySurveyId = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const answers = await Answer.findAll({ where: { survey_id: surveyId } });
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

    const user = await resolveUserByPublicId(String(user_id), res);
    if (!user) {
      return;
    }

    const newAnswer = await Answer.create({
      user_id: user.id,
      question_id,
      answer_value,
      answer_text
    });

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

    const [updatedCount] = await Answer.update(
      { answer_value, answer_text },
      { where: { id } }
    );
    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    const updatedAnswer = await Answer.findByPk(id);
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
    await Answer.destroy({ where: { id } });
    res.status(200).json({ message: `Answer deleted with ID: ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete answers by user id
const deleteAnswersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await resolveUserByPublicId(userId, res);
    if (!user) {
      return;
    }
    await Answer.destroy({ where: { user_id: user.id } });
    res.status(200).json({ message: `All answers deleted for user ID: ${userId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete answers by question id
const deleteAnswersByQuestionId = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    await Answer.destroy({ where: { question_id: questionId } });
    res.status(200).json({ message: `All answers deleted for question ID: ${questionId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserAnswersForSurvey = async (req, res) => {
  try {
    const { userId, surveyId } = req.params;
    const user = await resolveUserByPublicId(userId, res);
    if (!user) {
      return;
    }
    const requestedLimit = Number.parseInt(req.query.limit ?? '', 10);
    const historyLimit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_HISTORY_LIMIT)
      : DEFAULT_HISTORY_LIMIT;

    const requestedOffset = Number.parseInt(req.query.offset ?? '', 10);
    const historyOffset = Number.isFinite(requestedOffset) && requestedOffset >= 0
      ? requestedOffset
      : undefined;

    const submissions = await SurveySubmission.findAll({
      where: {
        user_id: user.id,
        survey_id: surveyId,
      },
      include: [{
        model: SurveyAnswer,
        as: 'responses',
        include: [{
          model: Question,
          as: 'question',
        }],
      }],
      order: [['submitted_at', 'DESC']],
      limit: historyLimit,
      offset: historyOffset,
    });

    if (!submissions || submissions.length === 0) {
      return res.status(200).json({ answered: false, answers: null, history: [] });
    }

    const compiledHistory = [];
    for (const submission of submissions) {
      const responsesByQuestion = buildResponsesByQuestion(submission.responses);
      let scorePayload = null;
      try {
        scorePayload = await scoringService.calculateSurveyScore(
          user.id,
          surveyId,
          { responses: responsesByQuestion },
        );
      } catch (error) {
        console.warn(`Unable to calculate score for submission ${submission.id}:`, error.message);
      }

      compiledHistory.push(
        serializeSubmission(submission, responsesByQuestion, scorePayload),
      );
    }

    const [latest] = compiledHistory;

    res.status(200).json({
      answered: true,
      answers: latest,
      history: compiledHistory,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitAnswersForSurvey = async (req, res) => {
  try {
    const { userId, surveyId } = req.params;
    const user = await resolveUserByPublicId(userId, res);
    if (!user) {
      return;
    }
    const answers = req.body; // array of { question_id, answer_value, answer_text }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    for (const ans of answers) {
      const { question_id, answer_value } = ans;

      if (!question_id || answer_value === undefined) {
        return res.status(400).json({
          error: 'question_id and answer_value are required for each answer'
        });
      }
    }

    // Create or update submission
    const submission = await SurveySubmission.create({
      user_id: user.id,
      survey_id: surveyId,
      status: 'completed',
    });

    // Create new answers for this submission
    const createdAnswers = await Promise.all(
      answers.map(answer => SurveyAnswer.create({
        submission_id: submission.id,
        question_id: answer.question_id,
        answer_value: answer.answer_value,
        answer_text: answer.answer_text,
      }))
    );

    res.status(201).json({
      success: true,
      submission: {
        submissionId: submission.id,
        surveyId: submission.survey_id,
        userId: submission.user_id,
        status: submission.status,
        submittedAt: submission.submitted_at,
        updatedAt: submission.updated_at,
        responses: createdAnswers.map((answer) => ({
          id: answer.id,
          questionId: answer.question_id,
          answerValue: answer.answer_value,
          answerText: answer.answer_text,
          createdAt: answer.created_at,
        })),
      },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getSurveyScore = async (req, res) => {
  try {
    const { userId, surveyId } = req.params;
    const user = await resolveUserByPublicId(userId, res);
    if (!user) {
      return;
    }

    const score = await scoringService.calculateSurveyScore(user.id, surveyId);
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
