const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Get all questions
 *     tags: [Questions]
 *     responses:
 *       200:
 *         description: List of questions
 */

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Question object
 *       404:
 *         description: Question not found
 */

/**
 * @swagger
 * /questions/survey/{surveyId}:
 *   get:
 *     summary: Get all questions for a specific survey
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of questions for the survey
 */
router.get('/survey/:surveyId', questionController.getQuestionsBySurveyId);

router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', questionController.createQuestion);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
