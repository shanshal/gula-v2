const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerControllers');
const { getSurveyScore } = require('../controllers/answerControllers');
const {
  validateIdParam,
  validateAnswerSubmission,
  validateSingleAnswer,
  validateUserSurveyParams,
  validateUserIdParam,
  validateSurveyIdParam,
} = require('../middleware/validation');

const internalAuth = require('../middleware/internalAuth');
const asyncHandler = require('../utils/asyncHandler');

router.get(
    '/user/:userId/survey/:surveyId/score',
    internalAuth,
    validateUserSurveyParams,
    asyncHandler(getSurveyScore)
);
router.get(
    '/',
    internalAuth,
    asyncHandler(answerController.getAnswers)
);
router.get(
    '/:id',
    internalAuth,
    validateIdParam,
    asyncHandler(answerController.getAnswerById)
);
router.post(
    '/',
    internalAuth,
    validateSingleAnswer,
    asyncHandler(answerController.createAnswer)
);
router.put(
    '/:id',
    internalAuth,
    validateIdParam,
    validateSingleAnswer,
    asyncHandler(answerController.updateAnswer)
);
router.delete(
    '/:id',
    internalAuth,
    validateIdParam,
    asyncHandler(answerController.deleteAnswer)
);
router.get(
    '/user/:userId',
    internalAuth,
    validateUserIdParam,
    asyncHandler(answerController.getAnswersByUserId)
);
router.get(
    '/question/:questionId',
    internalAuth,
    asyncHandler(answerController.getAnswersByQuestionId)
);
router.get(
    '/survey/:surveyId',
    internalAuth,
    validateSurveyIdParam,
    asyncHandler(answerController.getAnswersBySurveyId)
);
/**
 * @swagger
 * components:
 *   schemas:
 *     SurveySubmissionSummary:
 *       type: object
 *       properties:
 *         submissionId:
 *           type: string
 *           format: uuid
 *         surveyId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [draft, completed, cancelled]
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         responses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               questionId:
 *                 type: integer
 *               questionOrder:
 *                 type: integer
 *               answerValue:
 *                 type: string
 *               answerText:
 *                 type: string
 *                 nullable: true
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         responsesByQuestion:
 *           type: object
 *           additionalProperties:
 *             type: string
 *         score:
 *           type: object
 *           description: Calculated scoring payload for the submission
 */
/**
 * @swagger
 * /answers/user/{userId}/survey/{surveyId}:
 *   get:
 *     summary: Get all answers of a specific user for a specific survey
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the survey
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         required: false
 *         description: Maximum number of submissions to return in the history array (defaults to 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         required: false
 *         description: Skip this many submissions when building the history array
 *     responses:
 *       200:
 *         description: Latest submission summary for the requested user and survey
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answered:
 *                   type: boolean
 *                   description: Indicates whether the user has at least one completed submission for the survey
 *                 answers:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     surveyId:
 *                       type: string
 *                       format: uuid
 *                     submissionId:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [draft, completed, cancelled]
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     responses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           questionId:
 *                             type: integer
 *                           questionOrder:
 *                             type: integer
 *                           answerValue:
 *                             type: string
 *                           answerText:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     responsesByQuestion:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                     score:
 *                       type: object
 *                       description: Calculated scoring payload for the submission
 *                 history:
 *                   type: array
 *                   description: Recent submissions for the user ordered by newest first
 *                   items:
 *                     $ref: '#/components/schemas/SurveySubmissionSummary'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get(
    '/user/:userId/survey/:surveyId',
    internalAuth,
    validateUserSurveyParams,
    asyncHandler(answerController.getUserAnswersForSurvey)
);
/**
 * @swagger
 * /answers/user/{userId}/survey/{surveyId}:
 *   post:
 *     summary: Submit bulk answers for a survey
 *     description: Submit multiple answers for a specific user and survey in a single request
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user submitting answers (UUID string)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the survey (UUID string)
 *         example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             minItems: 1
 *             description: Array of answer objects
 *             items:
 *               type: object
 *               required:
 *                 - question_id
 *                 - answer_value
 *               properties:
 *                 question_id:
 *                   type: integer
 *                   minimum: 1
 *                   description: ID of the question being answered
 *                   example: 1
 *                 answer_value:
 *                   description: The answer value (can be string, number, or boolean)
 *                   oneOf:
 *                     - type: string
 *                       example: "Yes"
 *                     - type: number
 *                       example: 4
 *                     - type: boolean
 *                       example: true
 *                 answer_text:
 *                   type: string
 *                   nullable: true
 *                   description: Optional additional text for the answer
 *                   example: "This is my detailed response"
 *           examples:
 *             simple_answers:
 *               summary: Simple yes/no answers
 *               value:
 *                 - question_id: 1
 *                   answer_value: "Yes"
 *                 - question_id: 2
 *                   answer_value: "No"
 *             detailed_answers:
 *               summary: Answers with additional text
 *               value:
 *                 - question_id: 1
 *                   answer_value: "Satisfied"
 *                   answer_text: "The service was excellent"
 *                 - question_id: 2
 *                   answer_value: 4
 *                   answer_text: "Rating out of 5"
 *     responses:
 *       201:
 *         description: Answers successfully submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submission:
 *                   type: object
 *                   properties:
 *                     submissionId:
 *                       type: string
 *                       format: uuid
 *                     surveyId:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [draft, completed, cancelled]
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     responses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           questionId:
 *                             type: integer
 *                           answerValue:
 *                             type: string
 *                           answerText:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "answers[0].question_id"
 *                       message:
 *                         type: string
 *                         example: "question_id must be a positive integer"
 *       404:
 *         description: User or survey not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/user/:userId/survey/:surveyId',
    internalAuth,
    validateAnswerSubmission,
    asyncHandler(answerController.submitAnswersForSurvey)
);




// Bulk delete routes
router.delete(
    '/user/:userId/all',
    internalAuth,
    validateUserIdParam,
    asyncHandler(answerController.deleteAnswersByUserId)
);
router.delete(
    '/question/:questionId/all',
    internalAuth,
    asyncHandler(answerController.deleteAnswersByQuestionId)
);

module.exports = router;

