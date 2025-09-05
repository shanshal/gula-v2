const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoringController');

/**
 * @swagger
 * /scoring/{surveyId}/user/{userId}/score:
 *   get:
 *     summary: Calculate and retrieve survey score for a user
 *     description: Calculate the score for a specific user's answers to a survey, including weighted scoring and interpretation
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the survey (must be a positive integer)
 *         example: 1
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the user (must be a positive integer)
 *         example: 1
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   description: Final calculated score
 *                   example: 8.5
 *                 total:
 *                   type: number
 *                   description: Total score (same as score for most scoring types)
 *                   example: 8.5
 *                 breakdown:
 *                   type: object
 *                   description: Detailed breakdown of how the score was calculated
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       original:
 *                         description: Original answer value
 *                         example: "Yes"
 *                       mapped:
 *                         type: number
 *                         description: Mapped numeric value
 *                         example: 1
 *                       weight:
 *                         type: number
 *                         description: Weight applied to this question
 *                         example: 3
 *                       weighted:
 *                         type: number
 *                         description: Final weighted score for this question
 *                         example: 3
 *                 surveyId:
 *                   type: integer
 *                   description: ID of the survey
 *                   example: 1
 *                 userId:
 *                   type: integer
 *                   description: ID of the user
 *                   example: 1
 *                 scoringType:
 *                   type: string
 *                   enum: [sum, grouped, paired-options, formula, mixed_sign]
 *                   description: Type of scoring algorithm used
 *                   example: "sum"
 *                 responseCount:
 *                   type: integer
 *                   description: Number of questions answered
 *                   example: 10
 *                 perGroup:
 *                   type: object
 *                   description: Scores per group (for grouped scoring)
 *                   additionalProperties:
 *                     type: number
 *                   example:
 *                     "leadership": 15.5
 *                     "communication": 12.0
 *                 categories:
 *                   type: object
 *                   description: Category results (for paired-options scoring)
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       score:
 *                         type: number
 *                       percentage:
 *                         type: number
 *                       interpretation:
 *                         type: string
 *                 ranking:
 *                   type: array
 *                   description: Ranked categories (for paired-options scoring)
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       score:
 *                         type: number
 *                       rank:
 *                         type: integer
 *           examples:
 *             sum_scoring:
 *               summary: Simple sum scoring with weights
 *               value:
 *                 score: 8
 *                 total: 8
 *                 breakdown:
 *                   "1":
 *                     original: "Yes"
 *                     mapped: 1
 *                     weight: 3
 *                     weighted: 3
 *                   "2":
 *                     original: "No"
 *                     mapped: 0
 *                     weight: 1
 *                     weighted: 0
 *                 surveyId: 1
 *                 userId: 1
 *                 scoringType: "sum"
 *                 responseCount: 10
 *             grouped_scoring:
 *               summary: Grouped scoring results
 *               value:
 *                 score: 27.5
 *                 total: 27.5
 *                 perGroup:
 *                   "leadership": 15.5
 *                   "communication": 12.0
 *                 surveyId: 1
 *                 userId: 1
 *                 scoringType: "grouped"
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid survey or user ID"
 *       404:
 *         description: Survey, user, or answers not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No responses found for this user and survey"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to calculate score"
 */
router.get('/:surveyId/user/:userId/score', scoringController.getSurveyScore);


module.exports = router;
