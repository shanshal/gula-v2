const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerControllers');

/**
 * @swagger
 * /answers:
 *   get:
 *     summary: Get all answers
 *     description: Retrieve all survey answers
 *     tags: [Answers]
 *     responses:
 *       200:
 *         description: List of answers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Answer'
 */
router.get('/', answerController.getAnswers);

/**
 * @swagger
 * /answers/{id}:
 *   get:
 *     summary: Get answer by ID
 *     description: Retrieve a specific answer by its ID
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The answer ID
 *     responses:
 *       200:
 *         description: Answer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Answer'
 *       404:
 *         description: Answer not found
 */
router.get('/:id', answerController.getAnswerById);

/**
 * @swagger
 * /answers:
 *   post:
 *     summary: Submit an answer
 *     description: Submit a user's answer to a survey question
 *     tags: [Answers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - question_id
 *               - answer_value
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user providing the answer
 *                 example: 1
 *               question_id:
 *                 type: integer
 *                 description: ID of the question being answered
 *                 example: 1
 *               answer_value:
 *                 type: string
 *                 description: The answer value (1-5 for Likert scale)
 *                 example: "4"
 *               answer_text:
 *                 type: string
 *                 description: Optional text explanation
 *                 example: "أوافق - الإشراف المنتظم مهم لضمان الجودة"
 *     responses:
 *       201:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Answer'
 *       400:
 *         description: Invalid input data
 */
router.post('/', answerController.createAnswer);

/**
 * @swagger
 * /answers/{id}:
 *   put:
 *     summary: Update answer
 *     description: Update an existing answer
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The answer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer_value
 *             properties:
 *               answer_value:
 *                 type: string
 *               answer_text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Answer'
 */
router.put('/:id', answerController.updateAnswer);

/**
 * @swagger
 * /answers/{id}:
 *   delete:
 *     summary: Delete answer
 *     description: Delete a specific answer
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The answer ID
 *     responses:
 *       200:
 *         description: Answer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Answer deleted with ID: 1"
 */
router.delete('/:id', answerController.deleteAnswer);

/**
 * @swagger
 * /answers/user/{userId}:
 *   get:
 *     summary: Get answers by user
 *     description: Retrieve all answers submitted by a specific user
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of user's answers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Answer'
 */
router.get('/user/:userId', answerController.getAnswersByUserId);

/**
 * @swagger
 * /answers/question/{questionId}:
 *   get:
 *     summary: Get answers by question
 *     description: Retrieve all answers for a specific question
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The question ID
 *     responses:
 *       200:
 *         description: List of answers for the question
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Answer'
 */
router.get('/question/:questionId', answerController.getAnswersByQuestionId);

/**
 * @swagger
 * /answers/survey/{surveyId}:
 *   get:
 *     summary: Get answers by survey
 *     description: Retrieve all answers for a specific survey with question details
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The survey ID
 *     responses:
 *       200:
 *         description: List of answers for the survey
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Answer'
 *                   - type: object
 *                     properties:
 *                       question_text:
 *                         type: string
 *                       question_type:
 *                         type: string
 */
router.get('/survey/:surveyId', answerController.getAnswersBySurveyId);

// Bulk delete routes
router.delete('/user/:userId/all', answerController.deleteAnswersByUserId);
router.delete('/question/:questionId/all', answerController.deleteAnswersByQuestionId);

module.exports = router;
