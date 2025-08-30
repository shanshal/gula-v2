const express = require('express');
const router = express.Router();
const jsonSurveyController = require('../controllers/jsonSurveyController');

/**
 * @swagger
 * /surveys/json:
 *   post:
 *     summary: Create a new survey with full JSON (including questions and metadata)
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
 *                     question_text:
 *                       type: string
 *                     question_type:
 *                       type: string
 *                     is_required:
 *                       type: boolean
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     min_value:
 *                       type: integer
 *                     max_value:
 *                       type: integer
 *                     question_order:
 *                       type: integer
 *                     placeholder:
 *                       type: string
 *                     help_text:
 *                       type: string
 *                     question_route:
 *                       type: string
 *     responses:
 *       201:
 *         description: Survey created with questions
 */
router.post('/', jsonSurveyController.controllerCreateSurveyViaJson);

module.exports = router;

