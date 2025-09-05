const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const {
  validateSurveyCreation,
  validateSurveyUpdate,
  validateSurveyPatch,
  validateIdParam
} = require('../middleware/validation');

/**
 * @swagger
 * /surveys:
 *   get:
 *     summary: Get all surveys
 *     tags: [Surveys]
 *     responses:
 *       200:
 *         description: List of surveys
 */

/**
 * @swagger
 * /surveys/{id}:
 *   get:
 *     summary: Get a survey by ID
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey object
 */

/**
 * @swagger
 * /surveys/create:
 *   post:
 *     summary: Create a new survey (JSON body required)
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
 *               metadata:
 *                 type: object
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     text:
 *                       type: string
 *                       description: Question text (can also use question_text)
 *                     question_text:
 *                       type: string
 *                       description: Alternative field name for question text
 *                     type:
 *                       type: string
 *                       description: Question type (can also use question_type)
 *                     question_type:
 *                       type: string
 *                       description: Alternative field name for question type
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     weight:
 *                       type: number
 *                       description: Optional weight for the question (default 1)
 *               scoring:
 *                 type: object
 *               interpretation:
 *                 type: object
 *     responses:
 *       201:
 *         description: Survey created successfully
 */

/**
 * @swagger
 * /surveys/{id}:
 *   put:
 *     summary: Update a survey by ID (full update)
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
 *               metadata:
 *                 type: object
 *               scoring:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Survey updated
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
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey deleted
 */

// Routes
router.get('/', surveyController.getSurveys);
router.get('/:id', validateIdParam, surveyController.getSurveyById);
router.post('/create', validateSurveyCreation, surveyController.createSurvey);
router.put('/:id', validateIdParam, validateSurveyUpdate, surveyController.updateSurvey);
router.patch('/:id', validateIdParam, validateSurveyPatch, surveyController.patchSurvey);
router.delete('/:id', validateIdParam, surveyController.deleteSurvey);

module.exports = router;
