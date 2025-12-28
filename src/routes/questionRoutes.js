const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const {
  validateUuidParam,
  validateSurveyIdParam
} = require('../middleware/validation');

const internalAuth = require('../middleware/internalAuth');
const asyncHandler = require('../utils/asyncHandler');

router.get(
    '/survey/:surveyId',
    internalAuth,
    validateSurveyIdParam,
    asyncHandler(questionController.getQuestionsBySurveyId)
);

router.get(
    '/',
    internalAuth,
    asyncHandler(questionController.getQuestions)
);

router.get(
    '/:id',
    internalAuth,
    validateUuidParam,
    asyncHandler(questionController.getQuestionById)
);

router.post(
    '/',
    internalAuth,
    asyncHandler(questionController.createQuestion)
);

router.put(
    '/:id',
    internalAuth,
    validateUuidParam,
    asyncHandler(questionController.updateQuestion)
);

router.delete(
    '/:id',
    internalAuth,
    validateUuidParam,
    asyncHandler(questionController.deleteQuestion)
);

module.exports = router;
