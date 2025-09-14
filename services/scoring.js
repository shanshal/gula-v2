const answerModel = require('../models/answerModel');
const surveyModel = require('../models/surveyModel');
const protocoles = require('../protocoles');

// Normalize scoring config keys to use DB question IDs instead of question order
// This ensures mappings/groups/weights match the response keys (which are DB IDs)
function normalizeScoringConfig(scoring, surveyJSON) {
  try {
    if (!scoring || !surveyJSON?.questions) return scoring;

    const questions = surveyJSON.questions;
    const orderToId = {};
    const idSet = new Set();
    const orderSet = new Set();

    for (const q of questions) {
      if (q?.id != null) idSet.add(Number(q.id));
      if (q?.question_order != null) orderSet.add(Number(q.question_order));
      if (q?.question_order != null && q?.id != null) {
        orderToId[Number(q.question_order)] = Number(q.id);
      }
    }

    const isNumericKey = (k) => /^\d+$/.test(k);
    const isOrderKey = (k) => isNumericKey(k) && orderSet.has(Number(k));
    const isIdKey = (k) => isNumericKey(k) && idSet.has(Number(k));

    const remapKeyIfOrder = (k) => {
      if (isOrderKey(k)) {
        const id = orderToId[Number(k)];
        return id != null ? String(id) : k;
      }
      return k;
    };

    const remapArrayIndicesToIds = (arr) => {
      if (!Array.isArray(arr)) return arr;
      return arr.map((n) => {
        const num = Number(n);
        if (!Number.isFinite(num)) return n;
        // Prefer mapping order->id; if not found and it's already an id, keep as number
        if (orderToId[num] != null) return Number(orderToId[num]);
        if (idSet.has(num)) return num;
        return num; // leave as-is
      });
    };

    // Create a shallow clone to avoid mutating original
    const normalized = { ...scoring };

    // Normalize mappings: keys should be DB IDs as strings
    if (normalized.mappings && typeof normalized.mappings === 'object') {
      const newMappings = {};
      for (const [k, v] of Object.entries(normalized.mappings)) {
        const targetKey = remapKeyIfOrder(k);
        newMappings[targetKey] = v; // keep value mapping shape unchanged
      }
      normalized.mappings = newMappings;
    }

    // Normalize groups: arrays should contain DB IDs (numbers)
    if (normalized.groups && typeof normalized.groups === 'object') {
      const newGroups = {};
      for (const [groupName, arr] of Object.entries(normalized.groups)) {
        newGroups[groupName] = remapArrayIndicesToIds(arr);
      }
      normalized.groups = newGroups;
    }

    // Normalize weights and weight_overrides: keys should be DB IDs as strings
    if (normalized.weights && typeof normalized.weights === 'object') {
      const newWeights = {};
      for (const [k, v] of Object.entries(normalized.weights)) {
        const targetKey = remapKeyIfOrder(k);
        newWeights[targetKey] = v;
      }
      normalized.weights = newWeights;
    }

    if (normalized.weight_overrides && typeof normalized.weight_overrides === 'object') {
      const newOverrides = {};
      for (const [k, v] of Object.entries(normalized.weight_overrides)) {
        const targetKey = remapKeyIfOrder(k);
        newOverrides[targetKey] = v;
      }
      normalized.weight_overrides = newOverrides;
    }

    // Thresholds are based on score ranges or group names and do not need remapping

    return normalized;
  } catch (e) {
    console.error('Error normalizing scoring config:', e);
    return scoring;
  }
}

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

    // Normalize scoring config to use DB question IDs if it was authored with question orders
    const normalizedScoring = normalizeScoringConfig(scoring, surveyJSON);

    console.log('Survey ID:', surveyId);
    console.log('Scoring config (normalized):', JSON.stringify(normalizedScoring, null, 2));
    console.log('Responses:', stringKeyResponses);
    console.log('Question order map:', questionOrderMap);

    let result;
    switch (normalizedScoring.type) {
      case 'grouped':
        result = protocoles.scoreGrouped(stringKeyResponses, normalizedScoring);
        break;
      case 'paired-options':
        result = protocoles.scorePairedOptions(stringKeyResponses, normalizedScoring);
        break;
      case 'formula':
        // For formula, continue to use order-based Q variables via questionOrderMap
        result = protocoles.scoreFormula(stringKeyResponses, normalizedScoring, questionOrderMap);
        break;
      case 'mixed_sign':
        result = protocoles.scoreMixedSign(stringKeyResponses, normalizedScoring);
        break;
      case 'sum':
      default:
        result = protocoles.scoreSum(stringKeyResponses, normalizedScoring);
        break;
    }

    // Add metadata and result page information
    const enhancedResult = {
      ...result,
      surveyId: parseInt(surveyId),
      userId: parseInt(userId),
      scoringType: normalizedScoring.type,
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
