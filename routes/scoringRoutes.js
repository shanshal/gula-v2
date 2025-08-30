const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoringController');

/**
 * @swagger
 * /scoring/leadership/{userId}/{surveyId}:
 *   get:
 *     summary: Calculate leadership scores for a specific user and survey
 *     description: Analyzes a user's survey responses to determine their leadership style with detailed pros, cons, and recommendations
 *     tags: [Leadership Scoring]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *         example: 1
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The survey ID (5 for leadership survey)
 *         example: 5
 *     responses:
 *       200:
 *         description: Leadership analysis results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadershipProfile'
 *       404:
 *         description: No answers found for this user and survey
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid userId or surveyId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/leadership/:userId/:surveyId', scoringController.calculateLeadershipScores);

/**
 * @swagger
 * /scoring/leadership/calculate:
 *   post:
 *     summary: Calculate leadership scores from direct answer data
 *     description: Analyzes leadership style directly from answer values without storing in database. Useful for testing or bulk processing.
 *     tags: [Leadership Scoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: object
 *                 description: Question numbers mapped to answer values (1-5)
 *                 example:
 *                   "1": 4
 *                   "2": 2
 *                   "3": 5
 *                   "4": 4
 *                   "5": 3
 *                   "6": 4
 *                   "7": 2
 *                   "8": 4
 *                   "9": 3
 *                   "10": 3
 *                   "11": 4
 *                   "12": 5
 *                   "13": 2
 *                   "14": 4
 *                   "15": 3
 *                   "16": 3
 *                   "17": 4
 *                   "18": 5
 *     responses:
 *       200:
 *         description: Leadership analysis results
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LeadershipProfile'
 *                 - type: object
 *                   properties:
 *                     userId:
 *                       type: null
 *                       description: Not applicable for direct calculation
 *                     surveyId:
 *                       type: null
 *                       description: Not applicable for direct calculation
 *                     answersCount:
 *                       type: null
 *                       description: Not applicable for direct calculation
 *       400:
 *         description: Invalid answers format or missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/leadership/calculate', scoringController.calculateScoresFromAnswers);

module.exports = router;

