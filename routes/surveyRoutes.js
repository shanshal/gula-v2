const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

router.get('/', surveyController.getSurveys);
router.get('/:id', surveyController.getSurveyById);
router.post('/', surveyController.createSurvey);
router.put('/:id', surveyController.updateSurvey);
router.delete('/:id', surveyController.deleteSurvey);

module.exports = router;

