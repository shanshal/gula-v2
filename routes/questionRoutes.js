const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.get('/survey/:surveyId', questionController.getQuestionsBySurveyId);

router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', questionController.createQuestion);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
