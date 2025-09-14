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

    // Build question order map for formula expressions (Q1 -> question_id)
    const questionOrderMap = {};
    if (surveyJSON.questions) {
      for (const question of surveyJSON.questions) {
        questionOrderMap[question.question_order] = question.id;
      }
    }

    // Ensure scoring is an object
    let scoring = surveyJSON.survey.scoring;
    if (!scoring || typeof scoring === 'string') {
      scoring = { type: scoring || 'sum' };
    }

    console.log('Survey ID:', surveyId);
    console.log('Scoring config:', JSON.stringify(scoring, null, 2));
    console.log('Responses:', stringKeyResponses);
    console.log('Question order map:', questionOrderMap);

    let result;
    switch (scoring.type) {
      case 'grouped':
        result = protocoles.scoreGrouped(stringKeyResponses, scoring);
        break;
      case 'paired-options':
        result = protocoles.scorePairedOptions(stringKeyResponses, scoring);
        break;
      case 'formula':
        result = protocoles.scoreFormula(stringKeyResponses, scoring, questionOrderMap);
        break;
      case 'mixed_sign':
        result = protocoles.scoreMixedSign(stringKeyResponses, scoring);
        break;
      case 'sum':
      default:
        result = protocoles.scoreSum(stringKeyResponses, scoring);
        break;
    }

    // Add metadata and result page information
    const enhancedResult = {
      ...result,
      surveyId: parseInt(surveyId),
      userId: parseInt(userId),
      scoringType: scoring.type,
      responseCount: Object.keys(stringKeyResponses).length
    };

    // Add result page information based on thresholds
    if (result.threshold) {
      enhancedResult.resultPage = {
        level: result.threshold.level,
        levelName: result.threshold.levelName,
        totalLevels: result.threshold.totalLevels,
        pageId: `result_page_${result.threshold.level}`,
        pageName: result.threshold.current?.interpretation || 'Unknown Result'
      };
    } else if (result.groupThresholds) {
      // For grouped scoring, find the primary group's result page
      const primaryGroup = Object.keys(result.perGroup).reduce((a, b) => 
        result.perGroup[a] > result.perGroup[b] ? a : b
      );
      const primaryThreshold = result.groupThresholds[primaryGroup];
      
      if (primaryThreshold?.threshold) {
        enhancedResult.resultPage = {
          level: primaryThreshold.threshold.level,
          levelName: primaryThreshold.threshold.levelName,
          totalLevels: primaryThreshold.threshold.totalLevels,
          pageId: `result_page_${primaryGroup}_${primaryThreshold.threshold.level}`,
          pageName: primaryThreshold.threshold.current?.interpretation || `${primaryGroup} Result`,
          primaryGroup
        };
      }
    }

    return enhancedResult;

  } catch (error) {
    console.error('Error calculating survey score:', error);
    throw error;
  }
};

module.exports = { calculateSurveyScore };
