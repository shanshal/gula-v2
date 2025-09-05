const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerControllers');
const { getSurveyScore } = require('../controllers/answerControllers');
const { 
  validateIdParam, 
  validateAnswerSubmission, 
  validateSingleAnswer 
} = require('../middleware/validation');

router.get('/user/:userId/survey/:surveyId/score', getSurveyScore);
router.get('/', answerController.getAnswers);
router.get('/:id', validateIdParam, answerController.getAnswerById);
router.post('/', validateSingleAnswer, answerController.createAnswer);
router.put('/:id', validateIdParam, validateSingleAnswer, answerController.updateAnswer);
router.delete('/:id', validateIdParam, answerController.deleteAnswer);
router.get('/user/:userId', answerController.getAnswersByUserId);
router.get('/question/:questionId', answerController.getAnswersByQuestionId);
router.get('/survey/:surveyId', answerController.getAnswersBySurveyId);
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
 *           type: integer
 *         required: true
 *         description: ID of the user
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the survey
 *     responses:
 *       200:
 *         description: List of questions with the user's answers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   question_id:
 *                     type: integer
 *                     example: 1
 *                   question_text:
 *                     type: string
 *                     example: "How satisfied are you with our service?"
 *                   question_type:
 *                     type: string
 *                     example: "likert"
 *                   answer_value:
 *                     type: integer
 *                     nullable: true
 *                     example: 4
 *                   answer_text:
 *                     type: string
 *                     nullable: true
 *                     example: "Everything was great!"
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
router.get('/user/:userId/survey/:surveyId', answerController.getUserAnswersForSurvey)
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
 *           type: integer
 *         required: true
 *         description: ID of the user submitting answers (must be a positive integer)
 *         example: 1
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the survey (must be a positive integer)
 *         example: 1
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
 *                 submitted_count:
 *                   type: integer
 *                   description: Number of answers successfully submitted
 *                   example: 5
 *                 message:
 *                   type: string
 *                   example: "Answers submitted successfully"
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
router.post('/user/:userId/survey/:surveyId', validateAnswerSubmission, answerController.submitAnswersForSurvey);




// Bulk delete routes
router.delete('/user/:userId/all', answerController.deleteAnswersByUserId);
router.delete('/question/:questionId/all', answerController.deleteAnswersByQuestionId);

module.exports = router;
