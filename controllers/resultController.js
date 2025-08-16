const resultModel = require('../models/resultModel');

// Calculate result for a user's survey answers
const calculateResult = async (req, res) => {
  try {
    const { userId, surveyId, calculationMethod } = req.body;
    
    if (!userId || !surveyId) {
      return res.status(400).json({ 
        error: 'userId and surveyId are required' 
      });
    }
    
    const result = await resultModel.calculateResult(userId, surveyId, calculationMethod);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error in calculateResult controller:', error);
    res.status(500).json({ 
      error: 'Failed to calculate result',
      message: error.message 
    });
  }
};

// Calculate result with provided answers (real-time calculation)
const calculateWithAnswers = async (req, res) => {
  try {
    const { answers, calculationMethod } = req.body;
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ 
        error: 'answers array is required and must not be empty' 
      });
    }
    
    // Validate answer format
    const isValidAnswerFormat = answers.every(answer => 
      answer.hasOwnProperty('question_id') && 
      answer.hasOwnProperty('answer')
    );
    
    if (!isValidAnswerFormat) {
      return res.status(400).json({ 
        error: 'Each answer must have question_id and answer properties' 
      });
    }
    
    const result = resultModel.calculateWithAnswers(answers, calculationMethod);
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error in calculateWithAnswers controller:', error);
    res.status(500).json({ 
      error: 'Failed to calculate result with answers',
      message: error.message 
    });
  }
};

// Get available calculation methods
const getCalculationMethods = async (req, res) => {
  try {
    const methods = resultModel.getAvailableCalculationMethods();
    
    res.status(200).json({
      success: true,
      data: methods
    });
    
  } catch (error) {
    console.error('Error in getCalculationMethods controller:', error);
    res.status(500).json({ 
      error: 'Failed to get calculation methods',
      message: error.message 
    });
  }
};

module.exports = {
  calculateResult,
  calculateWithAnswers,
  getCalculationMethods
};