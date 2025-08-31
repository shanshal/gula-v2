const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoringController');

/**
 * @swagger
 * /scoring/{surveyId}/user/{userId}/score:
 *   get:
 *     summary: Get the calculated score for a survey taken by a user
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the survey
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: The calculated score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalScore:
 *                   type: number
 *                   example: 72
 *                 interpretation:
 *                   type: string
 *                   example: "High leadership score"
 *       404:
 *         description: Survey or user not found
 *       500:
 *         description: Internal server error
 */
router.get('/:surveyId/user/:userId/score', scoringController.getSurveyScore);


module.exports = router;
