const answerModel = require('../models/answerModel');
const surveyModel = require('../models/surveyModel');
const protocoles = require('../protocoles');

const calculateSurveyScore = async (userId, surveyId) => {
  try {
    const surveyJSON = await surveyModel.getSurveyById(surveyId);
    if (!surveyJSON) throw new Error('Survey not found');
    
    const responses = await answerModel.getUserAnswersForSurvey(userId, surveyId);
    if (!responses || Object.keys(responses).length === 0) {
      throw new Error('No responses found for this user and survey');
    }

    // Convert responses to have string keys to match scoring mappings
    const stringKeyResponses = {};
    for (const [questionId, value] of Object.entries(responses)) {
      stringKeyResponses[questionId.toString()] = value;
    }

    // Ensure scoring is an object
    let scoring = surveyJSON.survey.scoring;
    if (!scoring || typeof scoring === 'string') {
      scoring = { type: scoring || 'sum' };
    }

    console.log('Survey ID:', surveyId);
    console.log('Scoring config:', JSON.stringify(scoring, null, 2));
    console.log('Responses:', stringKeyResponses);

    let result;
    switch (scoring.type) {
      case 'grouped':
        result = protocoles.scoreGrouped(stringKeyResponses, scoring);
        break;
      case 'paired-options':
        result = protocoles.scorePairedOptions(stringKeyResponses, scoring);
        break;
      case 'formula':
        result = protocoles.scoreFormula(stringKeyResponses, scoring);
        break;
      case 'mixed_sign':
        result = protocoles.scoreMixedSign(stringKeyResponses, scoring.mappings || {});
        break;
      case 'sum':
      default:
        result = protocoles.scoreSum(stringKeyResponses, scoring.mappings || {});
        break;
    }

    // Add some metadata to the result
    return {
      ...result,
      surveyId: parseInt(surveyId),
      userId: parseInt(userId),
      scoringType: scoring.type,
      responseCount: Object.keys(stringKeyResponses).length
    };

  } catch (error) {
    console.error('Error calculating survey score:', error);
    throw error;
  }
};

module.exports = { calculateSurveyScore };
