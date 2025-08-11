const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerControllers');

router.post('/bulk', answerController.createOrUpdateAnswersBulk);

router.get('/user/:userId', answerController.getAnswersByUserId);

router.get('/survey/:surveyId/user/:userId', answerController.getAnswersBySurveyAndUser);

router.get('/user/:userId/question/:questionId', answerController.getAnswerByUserAndQuestion);

router.get('/test', (req, res) => res.send('Answers route working'));

module.exports = router;
