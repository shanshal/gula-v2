const db = require('../db');
const protocoles = require('../protocoles');

// Auto-detect calculation method based on survey name
const detectCalculationMethod = (surveyName) => {
  const name = surveyName.toLowerCase();
  
  // Only check for surveys that have actual calculation functions implemented
  if (name.includes('leadership') || name.includes('قيادة')) {
    return 'leadership';
  }
  if (name.includes('love language') || name.includes('حب')) {
    return 'love_languages';
  }
  
  // For all other surveys, use default calculation (sum of answers)
  return 'default';
};

// Get answers for a user and survey, then calculate results
const calculateResult = async (userId, surveyId, calculationMethod = null) => {
  try {
    // Get survey name for auto-detection if no method specified
    const surveyQuery = 'SELECT name FROM surveys WHERE id = $1';
    const surveyResult = await db.query(surveyQuery, [surveyId]);
    const surveyName = surveyResult.rows[0]?.name || 'Unknown Survey';
    
    // Auto-detect calculation method if not specified
    if (!calculationMethod || calculationMethod === 'auto') {
      calculationMethod = detectCalculationMethod(surveyName);
    }
    
    // Get all answers for this user and survey with question options
    const answersQuery = `
      SELECT a.question_id, a.answer, q.survey_id, q.options
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = $1 AND q.survey_id = $2
      ORDER BY a.question_id
    `;
    
    const answersResult = await db.query(answersQuery, [userId, surveyId]);
    
    if (answersResult.rows.length === 0) {
      throw new Error('No answers found for this user and survey');
    }

    // Convert text answers to numeric values based on question options
    const answers = answersResult.rows.map(row => {
      let numericAnswer = row.answer;
      
      // If the answer is text and we have options, map it to its index
      if (row.options && Array.isArray(row.options) && isNaN(row.answer)) {
        const optionIndex = row.options.indexOf(row.answer);
        numericAnswer = optionIndex >= 0 ? optionIndex : 0;
      } else if (isNaN(row.answer)) {
        // If it's still not a number, try to extract a number from the text
        const match = row.answer.match(/\((\d+)\)/);
        numericAnswer = match ? parseInt(match[1]) : 0;
      } else {
        // If it's already a number, convert it
        numericAnswer = parseInt(row.answer) || 0;
      }
      
      return {
        question_id: row.question_id,
        answer: numericAnswer,
        survey_id: row.survey_id,
        original_answer: row.answer
      };
    });
    
    // Determine which calculation function to use
    let calculationFunction;
    
    switch (calculationMethod.toLowerCase()) {
      case 'leadership':
        calculationFunction = protocoles.calculateLeadershipScores;
        break;
      case 'love_languages':
      case 'lovelanguages':
        calculationFunction = protocoles.calculateLoveLanguagesScores;
        break;
      case 'default':
      default:
        calculationFunction = protocoles.calculateDefault;
        break;
    }
    
    // Calculate the result
    const result = calculationFunction(answers);
    
    return {
      userId,
      surveyId,
      surveyName,
      calculationMethod,
      totalAnswers: answers.length,
      result,
      calculatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error calculating result:', error);
    throw error;
  }
};

// Calculate result with custom answers (for real-time calculation)
const calculateWithAnswers = (answers, calculationMethod = 'default') => {
  try {
    // Convert text answers to numeric if needed
    const processedAnswers = answers.map(answer => {
      let numericAnswer = answer.answer;
      
      // If answer is text, try to convert to number (for real-time calculations)
      if (isNaN(numericAnswer)) {
        // Extract number from parentheses like "لم تزعجني على الإطلاق (0)"
        const match = numericAnswer.match(/\((\d+)\)/);
        numericAnswer = match ? parseInt(match[1]) : 0;
      } else {
        numericAnswer = parseInt(numericAnswer) || 0;
      }
      
      return {
        ...answer,
        answer: numericAnswer,
        original_answer: answer.answer
      };
    });
    
    let calculationFunction;
    
    switch (calculationMethod.toLowerCase()) {
      case 'leadership':
        calculationFunction = protocoles.calculateLeadershipScores;
        break;
      case 'love_languages':
      case 'lovelanguages':
        calculationFunction = protocoles.calculateLoveLanguagesScores;
        break;
      case 'default':
      default:
        calculationFunction = protocoles.calculateDefault;
        break;
    }
    
    const result = calculationFunction(processedAnswers);
    
    return {
      calculationMethod,
      totalAnswers: answers.length,
      result,
      calculatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error calculating result with answers:', error);
    throw error;
  }
};

// Get available calculation methods
const getAvailableCalculationMethods = () => {
  return [
    {
      name: 'default',
      description: 'Simple sum of all answers',
      suitable_for: 'General surveys, questionnaires'
    },
    {
      name: 'leadership',
      description: 'Leadership style assessment with categorization',
      suitable_for: 'Leadership assessment surveys'
    },
    {
      name: 'love_languages',
      description: 'Love languages assessment with primary/secondary results',
      suitable_for: 'Love languages surveys'
    }
  ];
};

module.exports = {
  calculateResult,
  calculateWithAnswers,
  getAvailableCalculationMethods
};