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

function scoreSum(responses, mappings = {}) {

  // If no mappings provided, sum all response values directly
  if (!mappings || Object.keys(mappings).length === 0) {
    const values = Object.values(responses).filter(v => typeof v === 'number');
    const total = values.reduce((a, b) => a + b, 0);
    console.log('scoreSum - no mappings, total:', total);
    return { score: total, total, breakdown: responses };
  }

  // Use mappings to transform response values
  let total = 0;
  const breakdown = {};
  
  for (const [qid, responseValue] of Object.entries(responses)) {
    const qidStr = qid.toString();
    if (mappings[qidStr]) {
      const mappedValue = mappings[qidStr][responseValue.toString()];
      if (typeof mappedValue === 'number') {
        total += mappedValue;
        breakdown[qidStr] = { original: responseValue, mapped: mappedValue };
      }
    }
  }
  
  console.log('scoreSum - with mappings, total:', total);
  return { score: total, total, breakdown };
}

function scoreMixedSign(responses, mappings = {}) {
  console.log('scoreMixedSign - responses:', responses);
  console.log('scoreMixedSign - mappings:', mappings);
  
  let total = 0;
  const breakdown = {};
  
  for (const [qid, responseValue] of Object.entries(responses)) {
    const qidStr = qid.toString();
    if (mappings[qidStr]) {
      const mappedValue = mappings[qidStr][responseValue.toString()];
      if (typeof mappedValue === 'number') {
        total += mappedValue;
        breakdown[qidStr] = { original: responseValue, mapped: mappedValue };
      }
    }
  }
  
  console.log('scoreMixedSign - total:', total);
  return { score: total, total, breakdown };
}

function scoreGrouped(responses, scoring) {
  console.log('scoreGrouped - responses:', responses);
  console.log('scoreGrouped - scoring config:', scoring);
  
  const { mappings = {}, groups = {}, group_aggregate = 'sum', weights = {} } = scoring || {};
  
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
  }

  const total = Object.values(perGroup).reduce((a, b) => a + b, 0);
  
  console.log('scoreGrouped - per group:', perGroup);
  console.log('scoreGrouped - total:', total);
  
  return { 
    total: Number(total.toFixed(2)), 
    perGroup, 
    breakdown: mappedValues,
    groupAggregate: group_aggregate
  };
}

// Improved expression evaluator
function evalWithVars(expression, vars) {
  if (!expression || typeof expression !== 'string') return 0;
  
  try {
    console.log('Evaluating expression:', expression);
    console.log('With variables:', vars);
    
    // Replace variable references in the expression with their values
    let evaluableExpression = expression;
    for (const [varName, value] of Object.entries(vars)) {
      // Make sure we replace whole variable names, not partial matches
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      evaluableExpression = evaluableExpression.replace(regex, value);
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


function scoreFormula(responses, scoring) {
  console.log('scoreFormula - responses:', responses);
  console.log('scoreFormula - scoring config:', scoring);
  
  const { mappings = {}, expression } = scoring || {};
  
  // Map response values using mappings
  const mappedValues = {};
  for (const [qid, responseValue] of Object.entries(responses)) {
    const qidStr = qid.toString();
    if (mappings[qidStr]) {
      const mappedValue = mappings[qidStr][responseValue.toString()];
      mappedValues[qidStr] = typeof mappedValue === 'number' ? mappedValue : 0;
    } else {
      // If no mapping, use the response value directly
      mappedValues[qidStr] = typeof responseValue === 'number' ? responseValue : 0;
    }
  }
  
  console.log('scoreFormula - mapped values:', mappedValues);
  
  const total = Number(evalWithVars(expression, mappedValues)) || 0;
  
  console.log('scoreFormula - final total:', total);
  
  return { 
    score: Number(total.toFixed(2)), 
    total: Number(total.toFixed(2)), 
    vars: mappedValues,
    expression: expression
  };
}

module.exports = {
  leaderShipSurveyHandler,
  scoreSum,
  scoreMixedSign,
  scoreGrouped,
  scoreFormula,
  pairedOptions,
};
