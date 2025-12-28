const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoringController');
const { validateUserSurveyParams, validateSurveyIdParam } = require('../middleware/validation');

const internalAuth = require('../middleware/internalAuth');
const asyncHandler = require('../utils/asyncHandler');

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
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the survey (UUID string)
 *         example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user (UUID string)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
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
 *                   type: string
 *                   format: uuid
 *                   description: ID of the survey
 *                   example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the user
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
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
 *                 surveyId: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *                 userId: "550e8400-e29b-41d4-a716-446655440000"
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
 *                 surveyId: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *                 userId: "550e8400-e29b-41d4-a716-446655440000"
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
router.get(
    '/:surveyId/user/:userId/score',
    internalAuth,
    validateUserSurveyParams,
    asyncHandler(scoringController.getSurveyScore)
);

/**
 * @swagger
 * /scoring/{surveyId}/result-pages:
 *   get:
 *     summary: Get all possible result pages for a survey
 *     description: Retrieve all possible result pages based on survey thresholds, useful for building dynamic result displays
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the survey (UUID string)
 *         example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *     responses:
 *       200:
 *         description: Result pages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surveyId:
 *                   type: string
 *                   format: uuid
 *                   description: ID of the survey
 *                   example: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *                 scoringType:
 *                   type: string
 *                   enum: [sum, grouped, paired-options, formula, mixed_sign]
 *                   description: Type of scoring algorithm used
 *                   example: "sum"
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of result pages
 *                   example: 4
 *                 pages:
 *                   type: array
 *                   description: Array of all possible result pages
 *                   items:
 *                     type: object
 *                     properties:
 *                       pageId:
 *                         type: string
 *                         description: Unique identifier for this result page
 *                         example: "result_page_1"
 *                       level:
 *                         type: integer
 *                         description: Threshold level (1-based)
 *                         example: 1
 *                       levelName:
 *                         type: string
 *                         enum: [low, medium, high, excellent, custom]
 *                         description: Semantic level name
 *                         example: "low"
 *                       range:
 *                         type: string
 *                         description: Score range for this page
 *                         example: "3-8"
 *                       min:
 *                         type: number
 *                         description: Minimum score for this page
 *                         example: 3
 *                       max:
 *                         type: number
 *                         description: Maximum score for this page
 *                         example: 8
 *                       interpretation:
 *                         type: string
 *                         description: Text interpretation for this score range
 *                         example: "Poor satisfaction - needs immediate attention"
 *                       template:
 *                         type: object
 *                         description: Template data for rendering this result page
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Poor satisfaction - needs immediate attention"
 *                           subtitle:
 *                             type: string
 *                             example: "Your survey results"
 *                           description:
 *                             type: string
 *                             example: "Based on your responses, you scored: Poor satisfaction - needs immediate attention"
 *                           recommendations:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Consider areas for improvement", "Seek additional resources or support"]
 *                           styling:
 *                             type: object
 *                             properties:
 *                               theme:
 *                                 type: string
 *                                 example: "low"
 *                               color:
 *                                 type: string
 *                                 example: "#ff6b6b"
 *                       group:
 *                         type: string
 *                         description: Group name (for grouped scoring only)
 *                         example: "leadership"
 *           examples:
 *             simple_thresholds:
 *               summary: Simple threshold-based result pages
 *               value:
 *                 surveyId: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *                 scoringType: "sum"
 *                 totalPages: 4
 *                 pages:
 *                   - pageId: "result_page_1"
 *                     level: 1
 *                     levelName: "low"
 *                     range: "3-8"
 *                     min: 3
 *                     max: 8
 *                     interpretation: "Poor satisfaction - needs immediate attention"
 *                     template:
 *                       title: "Poor satisfaction - needs immediate attention"
 *                       subtitle: "Your survey results"
 *                       recommendations: ["Consider areas for improvement"]
 *                       styling:
 *                         theme: "low"
 *                         color: "#ff6b6b"
 *             grouped_thresholds:
 *               summary: Grouped threshold-based result pages
 *               value:
 *                 surveyId: "0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9"
 *                 scoringType: "grouped"
 *                 totalPages: 6
 *                 pages:
 *                   - pageId: "result_page_leadership_1"
 *                     level: 1
 *                     levelName: "low"
 *                     group: "leadership"
 *                     range: "2-4"
 *                     min: 2
 *                     max: 4
 *                     interpretation: "Low leadership tendency"
 *       404:
 *         description: Survey not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Survey not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve result pages"
 */
router.get(
    '/:surveyId/result-pages',
    internalAuth,
    validateSurveyIdParam,
    asyncHandler(scoringController.getSurveyResultPages)
);

module.exports = router;
