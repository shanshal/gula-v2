const {
  normalizeLocalizedOutput,
  normalizeLocalizedArrayOutput,
  pickLocalizedText,
} = require('./surveySchemas/localization');

const leaderShipSurveyHandler = (surveyAnswers) => {
  let authQuestions = [1, 2, 6, 10, 15, 16];
  let auth = 0;
  let demoQuestions = [4, 5, 8, 11, 14, 18];
  let demo = 0;
  let laisQuestions = [3, 7, 9, 12, 13, 17];
  let lais = 0;

  for (const question of Object.keys(surveyAnswers)) {
    const qNum = Number(question); 
    const value = surveyAnswers[qNum];

    if (authQuestions.includes(qNum)) {
      auth += value;
    } else if (demoQuestions.includes(qNum)) {
      demo += value;
    } else if (laisQuestions.includes(qNum)) {
      lais += value;
    }
  }

  return { auth, demo, lais };
};

function scoreSum(responses, scoring = {}) {
  const { mappings = {}, weight_overrides = {}, weights = {}, thresholds = {}, interpretations } = scoring;

  // If no mappings provided, sum all response values directly
  if (!mappings || Object.keys(mappings).length === 0) {
    const values = Object.values(responses).filter(v => typeof v === 'number');
    let total = 0;
    const breakdown = {};
    
    for (const [qid, value] of Object.entries(responses)) {
      if (typeof value === 'number') {
        const weight = weight_overrides[qid.toString()] || weights[qid.toString()] || 1;
        const weightedValue = value * weight;
        total += weightedValue;
        breakdown[qid.toString()] = { original: value, weighted: weightedValue, weight };
      }
    }
    
    console.log('scoreSum - no mappings, total:', total);
    
    // Use new interpretations or fall back to legacy thresholds
    const interpretation = getInterpretation(total, interpretations, thresholds);
    const thresholdData = getThresholdData(total, thresholds);
    const interpretationSummary = pickLocalizedText(interpretation?.description);
    const thresholdSummary = thresholdData?.current
      ? pickLocalizedText(thresholdData.current.interpretation)
      : getThresholdInterpretation(total, thresholds);
    
    return { 
      score: total, 
      total, 
      breakdown,
      interpretation: interpretationSummary || thresholdSummary,
      interpretationData: interpretation,
      threshold: thresholdData
    };
  }

  // Use mappings to transform response values
  let total = 0;
  const breakdown = {};
  
  for (const [qid, responseValue] of Object.entries(responses)) {
    const qidStr = qid.toString();
    if (mappings[qidStr]) {
      const mappedValue = mappings[qidStr][responseValue.toString()];
      if (typeof mappedValue === 'number') {
        const weight = weight_overrides[qidStr] || weights[qidStr] || 1;
        const weightedValue = mappedValue * weight;
        total += weightedValue;
        breakdown[qidStr] = { 
          original: responseValue, 
          mapped: mappedValue,
          weight: weight,
          weighted: weightedValue
        };
      }
    }
  }
  
  console.log('scoreSum - with mappings, total:', total);
  
  // Use new interpretations or fall back to legacy thresholds
  const interpretation = getInterpretation(total, interpretations, thresholds);
  const thresholdData = getThresholdData(total, thresholds);
  const interpretationSummary = pickLocalizedText(interpretation?.description);
  const thresholdSummary = thresholdData?.current
    ? pickLocalizedText(thresholdData.current.interpretation)
    : getThresholdInterpretation(total, thresholds);

  return { 
    score: total, 
    total, 
    breakdown,
    interpretation: interpretationSummary || thresholdSummary,
    interpretationData: interpretation,
    threshold: thresholdData
  };
}

function scoreMixedSign(responses, scoring = {}) {
  const { mappings = {}, weight_overrides = {}, weights = {}, thresholds = {}, interpretations } = scoring;
  
  console.log('scoreMixedSign - responses:', responses);
  console.log('scoreMixedSign - scoring config:', scoring);
  
  let total = 0;
  const breakdown = {};
  
  for (const [qid, responseValue] of Object.entries(responses)) {
    const qidStr = qid.toString();
    if (mappings[qidStr]) {
      const mappedValue = mappings[qidStr][responseValue.toString()];
      if (typeof mappedValue === 'number') {
        const weight = weight_overrides[qidStr] || weights[qidStr] || 1;
        const weightedValue = mappedValue * weight;
        total += weightedValue;
        breakdown[qidStr] = { 
          original: responseValue, 
          mapped: mappedValue,
          weight: weight,
          weighted: weightedValue
        };
      }
    }
  }
  
  console.log('scoreMixedSign - total:', total);
  
  // Use new interpretations or fall back to legacy thresholds
  const interpretation = getInterpretation(total, interpretations, thresholds);
  const thresholdData = getThresholdData(total, thresholds);
  const interpretationSummary = pickLocalizedText(interpretation?.description);
  const thresholdSummary = thresholdData?.current
    ? pickLocalizedText(thresholdData.current.interpretation)
    : getThresholdInterpretation(total, thresholds);
  
  return { 
    score: total, 
    total, 
    breakdown,
    interpretation: interpretationSummary || thresholdSummary,
    interpretationData: interpretation,
    threshold: thresholdData
  };
}

function scoreGrouped(responses, scoring) {
  console.log('scoreGrouped - responses:', responses);
  console.log('scoreGrouped - scoring config:', scoring);
  
  const { mappings = {}, groups = {}, group_aggregate = 'sum', weights = {}, thresholds = {}, interpretations } = scoring || {};
  
  // First, map each response value using the mappings
  const mappedValues = {};
  for (const [qid, responseValue] of Object.entries(responses)) {
    const qidStr = qid.toString();
    if (mappings[qidStr]) {
      let mappedValue;
      
      // Check if the mapping is a nested object (correct format) or a direct value (incorrect format)
      if (typeof mappings[qidStr] === 'object' && mappings[qidStr] !== null) {
        // Correct format: { "1": {"1": 1, "2": 2, ...} }
        mappedValue = mappings[qidStr][responseValue.toString()];
      } else {
        // Incorrect format: { "1": 1, "2": 2, ... } - treat as direct mapping
        // This means the response value should be used directly as the score
        mappedValue = parseInt(responseValue);
      }
      
      mappedValues[qidStr] = typeof mappedValue === 'number' ? mappedValue : 0;
    } else {
      // If no mapping, use the response value directly
      mappedValues[qidStr] = typeof responseValue === 'number' ? responseValue : parseInt(responseValue) || 0;
    }
  }
  
  console.log('scoreGrouped - mapped values:', mappedValues);

  // Then calculate group scores
  const perGroup = {};
  const groupThresholds = {};
  const groupInterpretations = {};
  
  for (const [groupName, questionIds] of Object.entries(groups)) {
    const groupValues = questionIds
      .map(id => mappedValues[id.toString()] || 0)
      .filter(val => typeof val === 'number');
    
    let groupScore = 0;
    if (group_aggregate === 'avg' && groupValues.length > 0) {
      groupScore = groupValues.reduce((a, b) => a + b, 0) / groupValues.length;
    } else if (group_aggregate === 'weighted_sum') {
      groupScore = questionIds.reduce((acc, id) => {
        const val = mappedValues[id.toString()] || 0;
        const weight = weights[id.toString()] || 1;
        return acc + (val * weight);
      }, 0);
    } else {
      // default: sum
      groupScore = groupValues.reduce((a, b) => a + b, 0);
    }
    
    perGroup[groupName] = Number(groupScore.toFixed(2));
    
    // Use new interpretations or fall back to legacy thresholds for this group
    const groupInterpretationArray = interpretations && typeof interpretations === 'object' ? interpretations[groupName] : null;
    const groupThreshold = thresholds[groupName];
    
    const interpretation = getInterpretation(groupScore, groupInterpretationArray, groupThreshold);
    const thresholdData = getThresholdData(groupScore, groupThreshold);
    const interpretationSummary = pickLocalizedText(interpretation?.description);
    const thresholdSummary = thresholdData?.current
      ? pickLocalizedText(thresholdData.current.interpretation)
      : getThresholdInterpretation(groupScore, groupThreshold);
    
    if (interpretation) {
      groupInterpretations[groupName] = interpretation;
    }
    
    if (groupThreshold) {
      groupThresholds[groupName] = {
        interpretation: interpretationSummary || thresholdSummary,
        interpretationData: interpretation,
        threshold: thresholdData
      };
    }
  }

  const total = Object.values(perGroup).reduce((a, b) => a + b, 0);
  
  // Apply overall interpretations/thresholds if they exist
  const overallInterpretationArray = Array.isArray(interpretations) ? interpretations : null;
  const overallInterpretation = getInterpretation(total, overallInterpretationArray, thresholds.overall || thresholds);
  const overallThresholdData = getThresholdData(total, thresholds.overall || thresholds);
  const overallInterpretationSummary = pickLocalizedText(overallInterpretation?.description);
  const overallThresholdSummary = overallThresholdData?.current
    ? pickLocalizedText(overallThresholdData.current.interpretation)
    : getThresholdInterpretation(total, thresholds.overall || thresholds);
  
  console.log('scoreGrouped - per group:', perGroup);
  console.log('scoreGrouped - total:', total);
  
  return { 
    total: Number(total.toFixed(2)), 
    perGroup, 
    breakdown: mappedValues,
    groupAggregate: group_aggregate,
    interpretation: overallInterpretationSummary || overallThresholdSummary,
    interpretationData: overallInterpretation,
    threshold: overallThresholdData,
    groupThresholds,
    groupInterpretations
  };
}

// Improved expression evaluator with question order support
function evalWithVars(expression, vars, questionOrderMap = null) {
  if (!expression || typeof expression !== 'string') return 0;
  
  try {
    console.log('Evaluating expression:', expression);
    console.log('With variables:', vars);
    console.log('With question order map:', questionOrderMap);
    
    let evaluableExpression = expression;
    
    // First, handle Q1, Q2, etc. variables if questionOrderMap is provided
    if (questionOrderMap) {
      // Replace Q1, Q2, etc. with actual question IDs
      for (const [questionOrder, questionId] of Object.entries(questionOrderMap)) {
        const qVariable = `Q${questionOrder}`;
        const questionIdStr = questionId.toString();
        
        if (vars[questionIdStr] !== undefined) {
          const regex = new RegExp(`\\b${qVariable}\\b`, 'g');
          evaluableExpression = evaluableExpression.replace(regex, vars[questionIdStr]);
          console.log(`Replaced ${qVariable} with ${vars[questionIdStr]} (from question ID ${questionIdStr})`);
        }
      }
    }
    
    // Skip direct variable replacement when using question order mapping
    // The Q variables should have already been replaced above
    if (!questionOrderMap) {
      // Only do direct variable replacement if not using Q variables
      for (const [varName, value] of Object.entries(vars)) {
        // Make sure we replace whole variable names, not partial matches
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evaluableExpression = evaluableExpression.replace(regex, value);
      }
    }
    
    console.log('Expression after variable substitution:', evaluableExpression);
    
    // Enhanced safety check - allow numbers, operators, parentheses, and decimal points
    if (!/^[0-9+\-*/.() ]+$/.test(evaluableExpression)) {
      throw new Error(`Invalid expression: ${evaluableExpression}`);
    }
    
    // Use Function constructor for safe evaluation
    const result = new Function('return ' + evaluableExpression)();
    console.log('Expression result:', result);
    return result;
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return 0;
  }
}

function pairedOptions(responses, groupsMapping) {
  // responses: { "1": "option1", "2": "option2", ... }
  // groupsMapping: { "1": { "option1": "A", "option2": "E" }, ... }

  const groupScores = {};

  for (const [qid, selectedOption] of Object.entries(responses)) {
    const qidStr = qid.toString();
    if (groupsMapping[qidStr] && groupsMapping[qidStr][selectedOption]) {
      const group = groupsMapping[qidStr][selectedOption];
      if (!groupScores[group]) groupScores[group] = 0;
      groupScores[group] += 1; // increment 1 point for the chosen option
    }
  }

  return groupScores;
}


function scoreFormula(responses, scoring, questionOrderMap = null) {
  console.log('scoreFormula - responses:', responses);
  console.log('scoreFormula - scoring config:', scoring);
  console.log('scoreFormula - questionOrderMap:', questionOrderMap);
  
  const { mappings = {}, expression, weight_overrides = {}, weights = {} } = scoring || {};
  
  // Map response values using mappings and apply weights
  const mappedValues = {};
  const weightedValues = {};
  const breakdown = {};
  
  for (const [qid, responseValue] of Object.entries(responses)) {
    const qidStr = qid.toString();
    let mappedValue;
    
    if (mappings[qidStr]) {
      mappedValue = mappings[qidStr][responseValue.toString()];
      mappedValue = typeof mappedValue === 'number' ? mappedValue : 0;
    } else {
      // If no mapping, use the response value directly (convert string to number if needed)
      mappedValue = typeof responseValue === 'number' ? responseValue : parseFloat(responseValue) || 0;
    }
    
    const weight = weight_overrides[qidStr] || weights[qidStr] || 1;
    const weightedValue = mappedValue * weight;
    
    mappedValues[qidStr] = mappedValue;
    weightedValues[qidStr] = weightedValue;
    breakdown[qidStr] = {
      original: responseValue,
      mapped: mappedValue,
      weight: weight,
      weighted: weightedValue
    };
  }
  
  console.log('scoreFormula - mapped values:', mappedValues);
  console.log('scoreFormula - weighted values:', weightedValues);
  
  // Use weighted values in the expression evaluation with question order mapping
  const total = Number(evalWithVars(expression, weightedValues, questionOrderMap)) || 0;
  
  console.log('scoreFormula - final total:', total);
  
  // Use new interpretations or fall back to legacy thresholds
  const interpretation = getInterpretation(total, scoring.interpretations, scoring.thresholds || {});
  const thresholdData = getThresholdData(total, scoring.thresholds || {});
  const interpretationSummary = pickLocalizedText(interpretation?.description);
  const thresholdSummary = thresholdData?.current
    ? pickLocalizedText(thresholdData.current.interpretation)
    : getThresholdInterpretation(total, scoring.thresholds || {});
  
  return { 
    score: Number(total.toFixed(2)), 
    total: Number(total.toFixed(2)), 
    vars: mappedValues,
    weightedVars: weightedValues,
    breakdown: breakdown,
    expression: expression,
    interpretation: interpretationSummary || thresholdSummary,
    interpretationData: interpretation,
    threshold: thresholdData
  };
}

// Enhanced paired-options scoring for Love Languages and similar surveys
function scorePairedOptions(responses, scoring) {
  console.log('scorePairedOptions - responses:', responses);
  console.log('scorePairedOptions - scoring config:', scoring);
  
  const { mappings = {}, groups = {}, thresholds = {}, group_aggregate = 'sum' } = scoring || {};
  
  // Get group mapping
  const groupMapping = scoring.group_mapping;
  if (!groupMapping) {
    throw new Error('group_mapping is required for paired-options scoring');
  }
  
  // Initialize group counters based on the group_mapping values (the love language names)
  const groupScores = {};
  Object.values(groupMapping).forEach(categoryName => {
    groupScores[categoryName] = 0;
  });
  
  // Get weights configuration
  const { weight_overrides = {}, weights = {} } = scoring;
  
  // Process each response - count the selected groups with weights
  const processedResponses = {};
  let validResponses = 0;
  
  for (const [questionId, selectedGroup] of Object.entries(responses)) {
    const qidStr = questionId.toString();
    
    // Check if this is a valid group selection for this question
    if (mappings[qidStr] && mappings[qidStr][selectedGroup]) {
      // Map the group letter to category and apply weight
      const category = groupMapping[selectedGroup];
      if (category && groupScores.hasOwnProperty(category)) {
        const weight = weight_overrides[qidStr] || weights[qidStr] || 1;
        const weightedScore = 1 * weight; // Base score is 1, multiplied by weight
        groupScores[category] += weightedScore;
        validResponses++;
        
        processedResponses[qidStr] = {
          selectedGroup,
          category,
          baseScore: 1,
          weight: weight,
          score: weightedScore,
          valid: true
        };
      } else {
        processedResponses[qidStr] = {
          selectedGroup,
          category: null,
          baseScore: 0,
          weight: 1,
          score: 0,
          valid: false,
          error: 'Unknown group mapping'
        };
      }
    } else {
      processedResponses[qidStr] = {
        selectedGroup,
        category: null,
        baseScore: 0,
        weight: 1,
        score: 0,
        valid: false,
        error: 'Invalid group for this question'
      };
    }
  }
  
  // Calculate additional metrics
  const totalPossibleQuestions = Object.keys(mappings).length;
  const results = {};
  const groupInterpretations = {};
  const groupThresholds = {};
  const interpretationConfig = scoring.interpretations || {};
  
  for (const [category, score] of Object.entries(groupScores)) {
    const percentage = validResponses > 0 ? (score / validResponses) * 100 : 0;
    const interpretationEntries = interpretationConfig[category];
    const interpretation = getInterpretation(score, interpretationEntries, thresholds[category]);
    const thresholdData = getThresholdData(score, thresholds[category]);
    const interpretationSummary = pickLocalizedText(interpretation?.description);
    const thresholdSummary = thresholdData?.current
      ? pickLocalizedText(thresholdData.current.interpretation)
      : getThresholdInterpretation(score, thresholds[category]);
    
    if (interpretation) {
      groupInterpretations[category] = interpretation;
    }
    if (thresholdData) {
      groupThresholds[category] = {
        interpretation: interpretationSummary || thresholdSummary,
        interpretationData: interpretation,
        threshold: thresholdData,
      };
    }
    
    results[category] = {
      score,
      percentage: Number(percentage.toFixed(1)),
      maxPossible: totalPossibleQuestions,
      interpretation:
        interpretationSummary ||
        thresholdSummary ||
        (score >= Math.ceil(totalPossibleQuestions * 0.3)
          ? 'High'
          : score >= Math.ceil(totalPossibleQuestions * 0.15)
            ? 'Medium'
            : 'Low'),
    };
  }
  
  // Create ranking
  const ranking = Object.entries(results)
    .map(([name, data]) => ({
      category: name,
      score: data.score,
      percentage: data.percentage,
      interpretation: data.interpretation
    }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  
  // Calculate total score
  const total = Object.values(groupScores).reduce((a, b) => a + b, 0);
  
  console.log('scorePairedOptions - group mapping:', groupMapping);
  console.log('scorePairedOptions - group scores:', groupScores);
  console.log('scorePairedOptions - total:', total);
  
  return {
    total: Number(total.toFixed(2)),
    perGroup: groupScores,
    breakdown: processedResponses,
    groupAggregate: group_aggregate,
    groupInterpretations,
    groupThresholds,
    // Enhanced results for paired-options
    categories: results,
    ranking,
    primary_category: ranking[0]?.category || null,
    secondary_category: ranking[1]?.category || null,
    total_responses: validResponses,
    max_possible_responses: totalPossibleQuestions,
    completion_rate: Number(((validResponses / totalPossibleQuestions) * 100).toFixed(1)),
    
    // Metadata
    valid_responses: validResponses,
    invalid_responses: Object.keys(responses).length - validResponses
  };
}

// Enhanced function to get interpretation from new interpretations array or legacy thresholds
function getInterpretation(score, interpretations, legacyThresholds = null) {
  if (interpretations && Array.isArray(interpretations)) {
    const match = interpretations.find(
      (interp) => score >= interp.min_score && score <= interp.max_score
    );
    if (match) {
      const title = normalizeLocalizedOutput(match.title);
      const description = normalizeLocalizedOutput(match.description);
      const recommendations = normalizeLocalizedArrayOutput(match.recommendations || []);

      return {
        min_score: match.min_score,
        max_score: match.max_score,
        title,
        description,
        titleText: pickLocalizedText(title),
        descriptionText: pickLocalizedText(description),
        recommendations,
        color: match.color,
        icon: match.icon,
        theme: match.theme || 'custom',
        isNew: true,
      };
    }
  }

  if (legacyThresholds) {
    const legacyInterpretation = getThresholdInterpretation(score, legacyThresholds);
    if (legacyInterpretation) {
      const title = normalizeLocalizedOutput('Score Result');
      const description = normalizeLocalizedOutput(legacyInterpretation);
      return {
        title,
        description,
        titleText: pickLocalizedText(title),
        descriptionText: pickLocalizedText(description),
        recommendations: [],
        theme: 'custom',
        isNew: false,
      };
    }
  }

  return null;
}

// Legacy helper function for backward compatibility
function getThresholdInterpretation(score, thresholds) {
  if (!thresholds) return null;
  
  for (const [range, interpretation] of Object.entries(thresholds)) {
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      if (score >= min && score <= max) {
        return pickLocalizedText(normalizeLocalizedOutput(interpretation));
      }
    } else {
      // Handle single value thresholds (e.g., "5": "interpretation")
      const threshold = Number(range);
      if (score === threshold) {
        return pickLocalizedText(normalizeLocalizedOutput(interpretation));
      }
    }
  }
  return null;
}

// Enhanced function to get comprehensive threshold data
function getThresholdData(score, thresholds) {
  if (!thresholds || Object.keys(thresholds).length === 0) {
    return null;
  }
  
  // Parse all thresholds to find which one the score falls into
  const thresholdRanges = [];
  for (const [range, interpretation] of Object.entries(thresholds)) {
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      thresholdRanges.push({
        min,
        max,
        range,
        interpretation: normalizeLocalizedOutput(interpretation),
        summary: pickLocalizedText(normalizeLocalizedOutput(interpretation)),
        isMatch: score >= min && score <= max
      });
    } else {
      const threshold = Number(range);
      thresholdRanges.push({
        min: threshold,
        max: threshold,
        range,
        interpretation: normalizeLocalizedOutput(interpretation),
        summary: pickLocalizedText(normalizeLocalizedOutput(interpretation)),
        isMatch: score === threshold
      });
    }
  }
  
  // Sort by min value to establish order
  thresholdRanges.sort((a, b) => a.min - b.min);
  
  // Find current threshold
  const currentThreshold = thresholdRanges.find(t => t.isMatch);
  
  // Find next and previous thresholds
  const currentIndex = currentThreshold ? thresholdRanges.indexOf(currentThreshold) : -1;
  const nextThreshold = currentIndex >= 0 && currentIndex < thresholdRanges.length - 1 
    ? thresholdRanges[currentIndex + 1] 
    : null;
  const previousThreshold = currentIndex > 0 
    ? thresholdRanges[currentIndex - 1] 
    : null;
  
  // Calculate progress within current range
  let progress = 0;
  if (currentThreshold && currentThreshold.max > currentThreshold.min) {
    progress = ((score - currentThreshold.min) / (currentThreshold.max - currentThreshold.min)) * 100;
  }
  
  // Find which "page" or level this represents (for multiple result pages)
  let level = 0;
  let levelName = 'unknown';
  if (currentThreshold) {
    level = currentIndex + 1;
    // Extract level name from interpretation or use generic names
    const interpretation = (currentThreshold.summary || '').toLowerCase();
    if (interpretation.includes('poor') || interpretation.includes('low')) {
      levelName = 'low';
    } else if (interpretation.includes('fair') || interpretation.includes('medium') || interpretation.includes('moderate')) {
      levelName = 'medium';
    } else if (interpretation.includes('good') || interpretation.includes('high')) {
      levelName = 'high';
    } else if (interpretation.includes('excellent') || interpretation.includes('very')) {
      levelName = 'excellent';
    } else {
      levelName = `level_${level}`;
    }
  }
  
  return {
    score,
    current: currentThreshold ? {
      range: currentThreshold.range,
      min: currentThreshold.min,
      max: currentThreshold.max,
      interpretation: currentThreshold.interpretation,
      summary: currentThreshold.summary,
      progress: Math.round(progress)
    } : null,
    next: nextThreshold ? {
      range: nextThreshold.range,
      min: nextThreshold.min,
      max: nextThreshold.max,
      interpretation: nextThreshold.interpretation,
      summary: nextThreshold.summary,
      pointsToNext: nextThreshold.min - score
    } : null,
    previous: previousThreshold ? {
      range: previousThreshold.range,
      min: previousThreshold.min,
      max: previousThreshold.max,
      interpretation: previousThreshold.interpretation,
      summary: previousThreshold.summary
    } : null,
    level,
    levelName,
    totalLevels: thresholdRanges.length,
    allThresholds: thresholdRanges.map(t => ({
      range: t.range,
      min: t.min,
      max: t.max,
      interpretation: t.interpretation,
      summary: t.summary
    }))
  };
}

// Custom functions removed due to security concerns with code injection

// scoreFunction removed due to security concerns with code injection

module.exports = {
  leaderShipSurveyHandler,
  scoreSum,
  scoreMixedSign,
  scoreGrouped,
  scoreFormula,
  pairedOptions,
  scorePairedOptions,
  getInterpretation,
  getThresholdInterpretation,
  getThresholdData
};
