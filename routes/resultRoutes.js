const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');

// POST /results/calculate - Calculate result for user's survey answers
router.post('/calculate', resultController.calculateResult);

// POST /results/calculate-with-answers - Calculate result with provided answers
router.post('/calculate-with-answers', resultController.calculateWithAnswers);

// GET /results/methods - Get available calculation methods
router.get('/methods', resultController.getCalculationMethods);

module.exports = router;