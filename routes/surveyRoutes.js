const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const {
  validateSurveyCreation,
  validateSurveyUpdate,
  validateSurveyPatch,
  validateUuidParam
} = require('../middleware/validation');

/**
 * @swagger
 * /surveys:
 *   get:
 *     summary: Get all surveys
 *     description: Retrieve a list of all surveys in the system
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: List of surveys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *                   name:
 *                     type: string
 *                     example: "Customer Satisfaction Survey"
 *                   status:
 *                     type: string
 *                     enum: [draft, active, archived]
 *                     example: "active"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /surveys/{id}:
 *   get:
 *     summary: Get a survey by ID
 *     description: Retrieve a specific survey with all its questions and configuration
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Survey ID (UUID string)
 *         example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *     responses:
 *       200:
 *         description: Survey retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 survey:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     metadata:
 *                       type: object
 *                     scoring:
 *                       type: object
 *                     status:
 *                       type: string
 *                       enum: [draft, active, archived]
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       question_text:
 *                         type: string
 *                       question_type:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Invalid survey ID
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
 *                       message:
 *                         type: string
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /surveys/create:
 *   post:
 *     summary: Create a new survey
 *     description: Create a new survey with questions, scoring configuration, and optional weights
 *     tags: [Surveys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - questions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Survey name
 *                 example: "Customer Satisfaction Survey"
 *               metadata:
 *                 type: object
 *                 description: Optional metadata for the survey
 *                 properties:
 *                   category:
 *                     type: string
 *                     example: "feedback"
 *                   language:
 *                     type: string
 *                     example: "en"
 *                   description:
 *                     type: string
 *                     example: "Survey to measure customer satisfaction"
 *                   created_by:
 *                     type: string
 *                     example: "Admin"
 *                   version:
 *                     type: string
 *                     example: "1.0"
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *                 description: Survey status
 *                 example: "draft"
 *               questions:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of survey questions
 *                 items:
 *                   type: object
 *                   required:
 *                     - question_text
 *                     - type
 *                   properties:
 *                     text:
 *                       type: string
 *                       description: Question text (alternative to question_text)
 *                     question_text:
 *                       type: string
 *                       description: Question text (preferred field name)
 *                       example: "How satisfied are you with our service?"
 *                     type:
 *                       type: string
 *                       description: Question type (alternative to question_type)
 *                     question_type:
 *                       type: string
 *                       description: Question type (preferred field name)
 *                       enum: [radio, checkbox, text, number, select, textarea, single_choice, multiple_choice]
 *                       example: "radio"
 *                     is_required:
 *                       type: boolean
 *                       description: Whether the question is required
 *                       example: true
 *                     options:
 *                       type: array
 *                       description: Answer options (required for choice-type questions)
 *                       items:
 *                         type: string
 *                       example: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
 *                     question_order:
 *                       type: integer
 *                       description: Order of the question (auto-assigned if not provided)
 *                       example: 1
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       description: Optional weight for the question (default 1)
 *                       example: 2.5
 *                     help_text:
 *                       type: string
 *                       description: Optional help text for the question
 *                     placeholder:
 *                       type: string
 *                       description: Placeholder text for input fields
 *                     min_value:
 *                       type: number
 *                       description: Minimum value for number questions
 *                     max_value:
 *                       type: number
 *                       description: Maximum value for number questions
 *               scoring:
 *                 type: object
 *                 description: Scoring configuration for the survey
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [sum, grouped, paired-options, formula, mixed_sign]
 *                     description: Type of scoring algorithm
 *                     example: "sum"
 *                   mappings:
 *                     type: object
 *                     description: Maps question responses to numeric values
 *                   weight_overrides:
 *                     type: object
 *                     description: Override weights for specific questions
 *                     additionalProperties:
 *                       type: number
 *                       minimum: 0
 *                     example:
 *                       "1": 3
 *                       "7": 2
 *                   weights:
 *                     type: object
 *                     description: Default weights for questions
 *                     additionalProperties:
 *                       type: number
 *                       minimum: 0
 *                   thresholds:
 *                     type: object
 *                     description: Score ranges and their descriptions
 *                     additionalProperties:
 *                       type: string
 *                     example:
 *                       "0-2": "Low satisfaction"
 *                       "3-4": "Medium satisfaction"
 *                       "5-5": "High satisfaction"
 *               interpretation:
 *                 type: object
 *                 description: Interpretation text for different score ranges
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   "0-2": "Consider improving service quality"
 *                   "3-4": "Good service with room for improvement"
 *                   "5-5": "Excellent service quality"
 *           examples:
 *             basic_survey:
 *               summary: Basic survey with weighted questions
 *               value:
 *                 name: "Service Quality Survey"
 *                 questions:
 *                   - question_text: "How would you rate our service?"
 *                     type: "radio"
 *                     options: ["Excellent", "Good", "Fair", "Poor"]
 *                     weight: 2
 *                   - question_text: "Would you recommend us?"
 *                     type: "radio"
 *                     options: ["Yes", "No"]
 *                     weight: 3
 *                 scoring:
 *                   type: "sum"
 *                   mappings:
 *                     "1":
 *                       "Excellent": 4
 *                       "Good": 3
 *                       "Fair": 2
 *                       "Poor": 1
 *                     "2":
 *                       "Yes": 1
 *                       "No": 0
 *     responses:
 *       201:
 *         description: Survey created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 survey:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                     status:
 *                       type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
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
 *                         example: "questions[0].weight"
 *                       message:
 *                         type: string
 *                         example: "Question 1: weight must be a non-negative number if provided"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /surveys/{id}:
 *   put:
 *     summary: Update survey metadata and configuration
 *     description: Update survey properties like name, metadata, scoring, and status (does not update questions)
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Survey ID (UUID string)
 *         example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Survey name
 *                 example: "Updated Survey Name"
 *               metadata:
 *                 type: object
 *                 description: Survey metadata
 *                 properties:
 *                   category:
 *                     type: string
 *                   language:
 *                     type: string
 *                   description:
 *                     type: string
 *                   version:
 *                     type: string
 *               scoring:
 *                 type: object
 *                 description: Complete scoring configuration
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [sum, grouped, paired-options, formula, mixed_sign]
 *                   mappings:
 *                     type: object
 *                   weight_overrides:
 *                     type: object
 *                     additionalProperties:
 *                       type: number
 *                       minimum: 0
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *                 description: Survey status
 *                 example: "active"
 *           examples:
 *             update_status:
 *               summary: Activate survey
 *               value:
 *                 status: "active"
 *             update_scoring:
 *               summary: Update scoring configuration
 *               value:
 *                 scoring:
 *                   type: "sum"
 *                   weight_overrides:
 *                     "1": 2
 *                     "3": 1.5
 *     responses:
 *       200:
 *         description: Survey updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "survey updated with id: 1"
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
 *                       message:
 *                         type: string
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Partially update a survey by ID
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Survey ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Update survey name
 *               metadata:
 *                 type: object
 *                 description: Update metadata (partial merge)
 *               scoring:
 *                 type: object
 *                 description: Update scoring configuration (partial merge)
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *                 description: Update survey status
 *               interpretation:
 *                 type: object
 *                 description: Update interpretation (partial merge)
 *             examples:
 *               update_name:
 *                 summary: Update only survey name
 *                 value:
 *                   name: "New Survey Name"
 *               update_metadata:
 *                 summary: Update metadata properties
 *                 value:
 *                   metadata:
 *                     version: "2.0"
 *                     description: "Updated description"
 *               update_scoring:
 *                 summary: Update scoring thresholds
 *                 value:
 *                   scoring:
 *                     thresholds:
 *                       "0-2": "Low risk"
 *                       "3-5": "Medium risk"
 *               update_interpretation:
 *                 summary: Update interpretation text
 *                 value:
 *                   interpretation:
 *                     "0-2": "Updated interpretation for low scores"
 *     responses:
 *       200:
 *         description: Survey partially updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updatedFields:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Survey not found
 */

/**
 * @swagger
 * /surveys/{id}:
 *   delete:
 *     summary: Delete a survey by ID
 *     description: Permanently delete a survey and all associated questions and answers
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Survey ID (UUID string)
 *         example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *     responses:
 *       200:
 *         description: Survey deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Survey deleted 1"
 *       400:
 *         description: Invalid survey ID
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
 *                         example: "id"
 *                       message:
 *                         type: string
 *                         example: "ID must be a valid UUID string"
 *       404:
 *         description: Survey not found
 *       500:
 *         description: Internal server error
 */

// Routes
router.get('/', surveyController.getSurveys);
router.get('/:id', validateUuidParam, surveyController.getSurveyById);
router.post('/create', validateSurveyCreation, surveyController.createSurvey);
router.put('/:id', validateUuidParam, validateSurveyUpdate, surveyController.updateSurvey);
router.patch('/:id', validateUuidParam, validateSurveyPatch, surveyController.patchSurvey);
router.delete('/:id', validateUuidParam, surveyController.deleteSurvey);

module.exports = router;
