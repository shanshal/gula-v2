const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const jsonSurveyController = require('../controllers/jsonSurveyController');

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
 * /surveys:
 *   post:
 *     summary: Create a new survey
 *     tags: [Surveys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Survey created
 */

/**
 * @swagger
 * /surveys/{id}:
 *   put:
 *     summary: Update survey by ID
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
 *     responses:
 *       200:
 *         description: Survey updated
 */

/**
 * @swagger
 * /surveys/{id}:
 *   delete:
 *     summary: Delete survey by ID
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

/**
 * @swagger
 * /surveys/json:
 *   post:
 *     summary: Create a new survey with full JSON (questions, scoring, interpretation)
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
 *                     type:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *               scoring:
 *                 type: object
 *               interpretation:
 *                 type: object
 *     responses:
 *       201:
 *         description: Survey with questions created successfully
 */

// Standard survey routes
router.get('/', surveyController.getSurveys);
router.get('/:id', surveyController.getSurveyById);
router.post('/', surveyController.createSurvey);
router.put('/:id', surveyController.updateSurvey);
router.delete('/:id', surveyController.deleteSurvey);

// JSON survey route
router.post('/json', jsonSurveyController.controllerCreateSurveyViaJson);

module.exports = router;
