


//Example for testing
const surveyAnswers = {
  1: 4,
  2: 2,
  3: 5,
  4: 1,
  5: 3,
  6: 4,
  9: 2,
};


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
  let total = 0;
  for (const [qid, optsMap] of Object.entries(mappings)) {
    const ans = responses[qid];
    if (ans == null) continue;
    const v = optsMap[ans];
    if (typeof v === 'number') total += v;
  }
  return { score: total, total };
}

function scoreMixedSign(responses, mappings = {}) {
  let total = 0;
  for (const [qid, optsMap] of Object.entries(mappings)) {
    const ans = responses[qid];
    if (ans == null) continue;
    const v = optsMap[ans];
    if (typeof v === 'number') total += v;
  }
  return { score: total, total };
}
function scoreGrouped(responses, scoring) {
  const { mappings = {}, groups = {}, group_aggregate = 'sum', weights = {} } = scoring || {};
  const qval = {};
  for (const [qid, optsMap] of Object.entries(mappings)) {
    const ans = responses[qid];
    const v = ans != null ? optsMap[ans] : 0;
    qval[qid] = typeof v === 'number' ? v : 0;
  }

  const perGroup = {};
  for (const [g, qids] of Object.entries(groups)) {
    const arr = qids.map(id => qval[id] || 0);
    let val = 0;
    if (group_aggregate === 'avg') {
      val = arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;
    } else if (group_aggregate === 'weighted_sum') {
      val = qids.reduce((acc, id) => acc + (qval[id] || 0) * (weights[id] || 1), 0);
    } else {
      val = arr.reduce((a,b)=>a+b,0);
    }
    perGroup[g] = Number(val);
  }

  const total = Object.values(perGroup).reduce((a,b)=>a+b,0);
  return { total, perGroup };
}


// Simple expression evaluator for formula scoring
function evalWithVars(expression, vars) {
  if (!expression || typeof expression !== 'string') return 0;
  
  try {
    // Replace variable references in the expression with their values
    let evaluableExpression = expression;
    for (const [varName, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      evaluableExpression = evaluableExpression.replace(regex, value);
    }
    
    // Basic safety check - only allow numbers, operators, and parentheses
    if (!/^[0-9+\-*/.() ]+$/.test(evaluableExpression)) {
      throw new Error('Invalid expression');
    }
    
    // Use Function constructor for safe evaluation
    return new Function('return ' + evaluableExpression)();
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return 0;
  }
}

function scoreFormula(responses, scoring) {
  const { mappings = {}, expression } = scoring || {};
  const vals = {};
  for (const [qid, optsMap] of Object.entries(mappings)) {
    const ans = responses[qid];
    const v = ans != null ? optsMap[ans] : 0;
    vals[qid] = typeof v === 'number' ? v : 0;
  }
  const total = Number(evalWithVars(expression, vals)) || 0;
  return { score: total, total, vars: vals };
}
module.exports = {
  leaderShipSurveyHandler,
  scoreSum,
  scoreMixedSign,
  scoreGrouped,
  scoreFormula,
};

 

