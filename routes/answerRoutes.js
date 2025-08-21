const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerControllers');

// Basic CRUD routes
router.get('/', answerController.getAnswers);
router.get('/:id', answerController.getAnswerById);
router.post('/', answerController.createAnswer);
router.put('/:id', answerController.updateAnswer);
router.delete('/:id', answerController.deleteAnswer);

// Additional query routes
router.get('/user/:userId', answerController.getAnswersByUserId);
router.get('/question/:questionId', answerController.getAnswersByQuestionId);
router.get('/survey/:surveyId', answerController.getAnswersBySurveyId);

// Bulk delete routes
router.delete('/user/:userId/all', answerController.deleteAnswersByUserId);
router.delete('/question/:questionId/all', answerController.deleteAnswersByQuestionId);

module.exports = router;
