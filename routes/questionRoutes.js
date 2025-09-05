const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

/**
 * @swagger
 * /questions/survey/{surveyId}:
 *   get:
 *     summary: Get all questions for a specific survey
 *     description: Retrieve all questions belonging to a specific survey
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Survey ID (must be a positive integer)
 *         example: 1
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   question_text:
 *                     type: string
 *                     example: "How satisfied are you with our service?"
 *                   question_type:
 *                     type: string
 *                     example: "radio"
 *                   is_required:
 *                     type: boolean
 *                     example: true
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
 *                   question_order:
 *                     type: integer
 *                     example: 1
 *                   help_text:
 *                     type: string
 *                     nullable: true
 *                   placeholder:
 *                     type: string
 *                     nullable: true
 *                   min_value:
 *                     type: number
 *                     nullable: true
 *                   max_value:
 *                     type: number
 *                     nullable: true
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Internal server error
 */
router.get('/survey/:surveyId', questionController.getQuestionsBySurveyId);

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Get all questions
 *     description: Retrieve all questions from all surveys
 *     tags: [Questions]
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   question_text:
 *                     type: string
 *                   question_type:
 *                     type: string
 *                   survey_id:
 *                     type: integer
 *                   question_order:
 *                     type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/', questionController.getQuestions);

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: Get a question by ID
 *     description: Retrieve a specific question by its ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Question ID (must be a positive integer)
 *         example: 1
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 question_text:
 *                   type: string
 *                 question_type:
 *                   type: string
 *                 survey_id:
 *                   type: integer
 *                 is_required:
 *                   type: boolean
 *                 options:
 *                   type: array
 *                   items:
 *                     type: string
 *                 question_order:
 *                   type: integer
 *                 help_text:
 *                   type: string
 *                   nullable: true
 *                 placeholder:
 *                   type: string
 *                   nullable: true
 *                 min_value:
 *                   type: number
 *                   nullable: true
 *                 max_value:
 *                   type: number
 *                   nullable: true
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', questionController.getQuestionById);

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Create a new question
 *     description: Create a new question for a survey (Note - typically questions are created with the survey)
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - survey_id
 *               - question_text
 *               - question_type
 *             properties:
 *               survey_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the survey this question belongs to
 *                 example: 1
 *               question_text:
 *                 type: string
 *                 minLength: 1
 *                 description: The question text
 *                 example: "How would you rate our service?"
 *               question_type:
 *                 type: string
 *                 enum: [radio, checkbox, text, number, select, textarea, single_choice, multiple_choice]
 *                 description: Type of question
 *                 example: "radio"
 *               is_required:
 *                 type: boolean
 *                 description: Whether the question is required
 *                 example: true
 *               options:
 *                 type: array
 *                 description: Answer options (required for choice-type questions)
 *                 items:
 *                   type: string
 *                 example: ["Excellent", "Good", "Fair", "Poor"]
 *               question_order:
 *                 type: integer
 *                 minimum: 1
 *                 description: Order of the question in the survey
 *                 example: 1
 *               help_text:
 *                 type: string
 *                 description: Optional help text
 *               placeholder:
 *                 type: string
 *                 description: Placeholder text for input fields
 *               min_value:
 *                 type: number
 *                 description: Minimum value for number questions
 *               max_value:
 *                 type: number
 *                 description: Maximum value for number questions
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question created successfully"
 *                 question:
 *                   type: object
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/', questionController.createQuestion);

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     summary: Update a question
 *     description: Update an existing question
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Question ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question_text:
 *                 type: string
 *                 description: Updated question text
 *               question_type:
 *                 type: string
 *                 enum: [radio, checkbox, text, number, select, textarea, single_choice, multiple_choice]
 *               is_required:
 *                 type: boolean
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               help_text:
 *                 type: string
 *               placeholder:
 *                 type: string
 *               min_value:
 *                 type: number
 *               max_value:
 *                 type: number
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', questionController.updateQuestion);

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     description: Delete a question and all its associated answers
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Question ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question deleted successfully"
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
