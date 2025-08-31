const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerControllers');
const { getSurveyScore } = require('../controllers/answerControllers');

router.get('/user/:userId/survey/:surveyId/score', getSurveyScore);
router.get('/', answerController.getAnswers);
router.get('/:id', answerController.getAnswerById);
router.post('/', answerController.createAnswer);
router.put('/:id', answerController.updateAnswer);
router.delete('/:id', answerController.deleteAnswer);
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
 *     summary: Submit answers for the Leadership Survey (survey ID 13)
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *           example: 1
 *         required: true
 *         description: ID of the user submitting answers
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: integer
 *           example: 13
 *         required: true
 *         description: ID of the survey
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - question_id
 *                 - answer_value
 *               properties:
 *                 question_id:
 *                   type: integer
 *                   example: 36
 *                 answer_value:
 *                   type: integer
 *                   example: 4
 *                 answer_text:
 *                   type: string
 *                   nullable: true
 *                   example: "Everything was great!"
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
 *                   example: 18
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "user_id, question_id, and answer_value are required"
 *       500:
 *         description: Internal server error
 */
router.post('/user/:userId/survey/:surveyId', answerController.submitAnswersForSurvey);




// Bulk delete routes
router.delete('/user/:userId/all', answerController.deleteAnswersByUserId);
router.delete('/question/:questionId/all', answerController.deleteAnswersByQuestionId);

module.exports = router;
