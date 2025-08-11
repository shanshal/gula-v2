// Helper functions

/**
 * Calculate leadership style scores for the leadership survey
 * @param {Array} answers - Array of answer objects with question_id and answer values
 * @returns {Object} - Object containing scores and classification
 */
const calculateLeadershipScores = (answers) => {
  // Question mappings for each leadership style
  const authoritarianQuestions = [1, 2, 6, 10, 15, 16];
  const democraticQuestions = [4, 5, 8, 11, 14, 18];
  const laissezFaireQuestions = [3, 7, 9, 12, 13, 17];

  // Initialize scores
  let authScore = 0;
  let demoScore = 0;
  let laisScore = 0;

  // Calculate scores for each style
  answers.forEach(answer => {
    const questionId = answer.question_id;
    const answerValue = parseInt(answer.answer);

    if (authoritarianQuestions.includes(questionId)) {
      authScore += answerValue;
    }
    if (democraticQuestions.includes(questionId)) {
      demoScore += answerValue;
    }
    if (laissezFaireQuestions.includes(questionId)) {
      laisScore += answerValue;
    }
  });

  // Determine leadership style classification
  let classification = '';
  let styleDescription = '';

  if (authScore >= demoScore + 4 && authScore >= laisScore + 4) {
    classification = 'Dominant Authoritarian';
    styleDescription = 'Strong authoritarian leadership style with emphasis on control and direction';
  } else if (demoScore >= authScore + 4 && demoScore >= laisScore + 4) {
    classification = 'Dominant Democratic';
    styleDescription = 'Strong democratic leadership style with emphasis on participation and collaboration';
  } else if (laisScore >= authScore + 4 && laisScore >= demoScore + 4) {
    classification = 'Dominant Laissez-Faire';
    styleDescription = 'Strong laissez-faire leadership style with emphasis on autonomy and minimal intervention';
  } else if (Math.abs(authScore - demoScore) <= 3 && authScore >= laisScore + 4 && demoScore >= laisScore + 4) {
    classification = 'Mixed Authoritarian/Democratic';
    styleDescription = 'Balanced mix of authoritarian and democratic styles, both significantly higher than laissez-faire';
  } else if (Math.abs(laisScore - demoScore) <= 3 && laisScore >= authScore + 4 && demoScore >= authScore + 4) {
    classification = 'Mixed Democratic/Laissez-Faire';
    styleDescription = 'Balanced mix of democratic and laissez-faire styles, both significantly higher than authoritarian';
  } else if (Math.abs(authScore - demoScore) <= 3 && Math.abs(authScore - laisScore) <= 3 && Math.abs(demoScore - laisScore) <= 3) {
    classification = 'Balanced/Ambivalent';
    styleDescription = 'All leadership styles are within 3 points of each other, indicating balanced or ambivalent approach';
  } else {
    classification = 'Mixed/Unclear';
    styleDescription = 'Complex mix of leadership styles that doesn\'t fit the standard classifications';
  }

  // Calculate score ranges for interpretation
  const getScoreLevel = (score) => {
    if (score >= 26) return 'Very High';
    if (score >= 21) return 'High';
    if (score >= 16) return 'Medium';
    if (score >= 11) return 'Low';
    return 'Very Low';
  };

  return {
    scores: {
      authoritarian: {
        value: authScore,
        level: getScoreLevel(authScore),
        questions: authoritarianQuestions
      },
      democratic: {
        value: demoScore,
        level: getScoreLevel(demoScore),
        questions: democraticQuestions
      },
      laissezFaire: {
        value: laisScore,
        level: getScoreLevel(laisScore),
        questions: laissezFaireQuestions
      }
    },
    classification: classification,
    description: styleDescription,
    interpretation: {
      authoritarian: getAuthoritarianInterpretation(authScore),
      democratic: getDemocraticInterpretation(demoScore),
      laissezFaire: getLaissezFaireInterpretation(laisScore)
    }
  };
};

/**
 * Get interpretation for authoritarian score
 */
const getAuthoritarianInterpretation = (score) => {
  if (score >= 26) return 'Very high authoritarian tendencies - strong control and direction';
  if (score >= 21) return 'High authoritarian tendencies - prefers structured leadership';
  if (score >= 16) return 'Moderate authoritarian tendencies - balanced approach';
  if (score >= 11) return 'Low authoritarian tendencies - prefers collaborative approach';
  return 'Very low authoritarian tendencies - highly collaborative';
};

/**
 * Get interpretation for democratic score
 */
const getDemocraticInterpretation = (score) => {
  if (score >= 26) return 'Very high democratic tendencies - excellent team participation';
  if (score >= 21) return 'High democratic tendencies - strong collaboration skills';
  if (score >= 16) return 'Moderate democratic tendencies - balanced participation';
  if (score >= 11) return 'Low democratic tendencies - prefers individual work';
  return 'Very low democratic tendencies - highly independent';
};

/**
 * Get interpretation for laissez-faire score
 */
const getLaissezFaireInterpretation = (score) => {
  if (score >= 26) return 'Very high laissez-faire tendencies - maximum autonomy';
  if (score >= 21) return 'High laissez-faire tendencies - prefers hands-off approach';
  if (score >= 16) return 'Moderate laissez-faire tendencies - balanced autonomy';
  if (score >= 11) return 'Low laissez-faire tendencies - prefers guidance';
  return 'Very low laissez-faire tendencies - highly structured';
};

/**
 * Calculate Love Languages scores for the Love Languages survey
 * @param {Array} answers - Array of answer objects with question_id and answer values
 * @returns {Object} - Object containing scores and classification
 */
const calculateLoveLanguagesScores = (answers) => {
  // Initialize counters for each love language
  const scores = {
    'Words of Affirmation': 0,    // A
    'Quality Time': 0,            // B
    'Receiving Gifts': 0,         // C
    'Acts of Service': 0,         // D
    'Physical Touch': 0           // E
  };

  // Question mappings for each love language
  const questionMappings = {
    1: { 1: 'A', 2: 'E' },      // Q1: A vs E
    2: { 1: 'B', 2: 'D' },      // Q2: B vs D
    3: { 1: 'C', 2: 'B' },      // Q3: C vs B
    4: { 1: 'D', 2: 'E' },      // Q4: D vs E
    5: { 1: 'E', 2: 'C' },      // Q5: E vs C
    6: { 1: 'B', 2: 'E' },      // Q6: B vs E
    7: { 1: 'A', 2: 'C' },      // Q7: A vs C
    8: { 1: 'E', 2: 'A' },      // Q8: E vs A
    9: { 1: 'B', 2: 'C' },      // Q9: B vs C
    10: { 1: 'D', 2: 'A' },     // Q10: D vs A
    11: { 1: 'B', 2: 'A' },     // Q11: B vs A
    12: { 1: 'E', 2: 'D' },     // Q12: E vs D
    13: { 1: 'A', 2: 'C' },     // Q13: A vs C
    14: { 1: 'E', 2: 'B' },     // Q14: E vs B
    15: { 1: 'A', 2: 'D' },     // Q15: A vs D
    16: { 1: 'E', 2: 'B' },     // Q16: E vs B
    17: { 1: 'C', 2: 'D' },     // Q17: C vs D
    18: { 1: 'A', 2: 'B' },     // Q18: A vs B
    19: { 1: 'E', 2: 'D' },     // Q19: E vs D
    20: { 1: 'D', 2: 'C' },     // Q20: D vs C
    21: { 1: 'B', 2: 'D' },     // Q21: B vs D
    22: { 1: 'C', 2: 'A' },     // Q22: C vs A
    23: { 1: 'D', 2: 'C' },     // Q23: D vs C
    24: { 1: 'C', 2: 'B' },     // Q24: C vs B
    25: { 1: 'B', 2: 'D' },     // Q25: B vs D
    26: { 1: 'E', 2: 'C' },     // Q26: E vs C
    27: { 1: 'A', 2: 'B' },     // Q27: A vs B
    28: { 1: 'C', 2: 'E' },     // Q28: C vs E
    29: { 1: 'A', 2: 'D' },     // Q29: A vs D
    30: { 1: 'E', 2: 'A' }      // Q30: E vs A
  };

  // Count scores based on chosen answers
  answers.forEach(answer => {
    const questionId = answer.question_id;
    const chosenOption = answer.answer;
    
    if (questionMappings[questionId] && questionMappings[questionId][chosenOption]) {
      const loveLanguage = questionMappings[questionId][chosenOption];
      
      switch (loveLanguage) {
        case 'A':
          scores['Words of Affirmation']++;
          break;
        case 'B':
          scores['Quality Time']++;
          break;
        case 'C':
          scores['Receiving Gifts']++;
          break;
        case 'D':
          scores['Acts of Service']++;
          break;
        case 'E':
          scores['Physical Touch']++;
          break;
      }
    }
  });

  // Find the highest score and primary love language
  const maxScore = Math.max(...Object.values(scores));
  const primaryLoveLanguage = Object.keys(scores).find(key => scores[key] === maxScore);

  // Find secondary love language (second highest)
  const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
  const secondaryLoveLanguage = sortedScores[1] ? sortedScores[1][0] : null;

  // Determine classification based on scores
  let classification = 'Balanced';
  let description = '';

  if (maxScore >= 8) {
    classification = `Strong ${primaryLoveLanguage}`;
    description = `You have a very strong preference for ${primaryLoveLanguage.toLowerCase()}. This is clearly your primary love language.`;
  } else if (maxScore >= 6) {
    classification = `Moderate ${primaryLoveLanguage}`;
    description = `You have a moderate preference for ${primaryLoveLanguage.toLowerCase()}. This is likely your primary love language.`;
  } else if (maxScore >= 4) {
    classification = `Mild ${primaryLoveLanguage}`;
    description = `You have a mild preference for ${primaryLoveLanguage.toLowerCase()}. This may be your primary love language.`;
  } else {
    classification = 'Balanced';
    description = 'Your love language preferences are relatively balanced across all categories.';
  }

  // Add secondary language info if significant
  if (secondaryLoveLanguage && sortedScores[1][1] >= 4) {
    description += ` You also show a preference for ${secondaryLoveLanguage.toLowerCase()}.`;
  }

  return {
    scores: scores,
    primary: primaryLoveLanguage,
    secondary: secondaryLoveLanguage,
    classification: classification,
    description: description,
    interpretation: {
      'Words of Affirmation': 'You feel most loved when your partner expresses their feelings through words, compliments, and verbal encouragement.',
      'Quality Time': 'You feel most loved when your partner gives you their undivided attention and spends meaningful time with you.',
      'Receiving Gifts': 'You feel most loved when your partner gives you thoughtful gifts and tokens of affection.',
      'Acts of Service': 'You feel most loved when your partner helps you with tasks and shows their love through actions.',
      'Physical Touch': 'You feel most loved when your partner shows affection through physical contact like hugs, holding hands, and touch.'
    }
  };
};

/**
 * Calculate Somatic Symptom Scale scores
 * @param {Array} answers - Array of answer objects with question_id and answer values
 * @returns {Object} - Object containing total score and severity classification
 */
const calculateSomaticSymptomScores = (answers) => {
  // Calculate total score by summing all answer values
  let totalScore = 0;
  
  answers.forEach(answer => {
    // Convert answer to number (0, 1, or 2)
    const score = parseInt(answer.answer);
    if (!isNaN(score)) {
      totalScore += score;
    }
  });

  // Determine severity level based on total score
  let severity = '';
  let description = '';
  let interpretation = '';

  if (totalScore >= 0 && totalScore <= 4) {
    severity = 'ضئيلة';
    description = 'Minimal somatic symptoms';
    interpretation = 'You report minimal somatic symptoms. This suggests good physical health and low levels of somatic distress.';
  } else if (totalScore >= 5 && totalScore <= 9) {
    severity = 'منخفضة';
    description = 'Low somatic symptoms';
    interpretation = 'You report low levels of somatic symptoms. This is within normal range and suggests good physical health.';
  } else if (totalScore >= 10 && totalScore <= 14) {
    severity = 'متوسطة';
    description = 'Moderate somatic symptoms';
    interpretation = 'You report moderate somatic symptoms. This may indicate some physical distress that could benefit from attention.';
  } else if (totalScore >= 15 && totalScore <= 30) {
    severity = 'عالية';
    description = 'High somatic symptoms';
    interpretation = 'You report high levels of somatic symptoms. This suggests significant physical distress that may require medical attention and support.';
  }

  // Calculate percentage of maximum possible score (30)
  const maxPossibleScore = 30;
  const percentageScore = ((totalScore / maxPossibleScore) * 100).toFixed(1);

  return {
    totalScore: totalScore,
    maxPossibleScore: maxPossibleScore,
    percentageScore: percentageScore,
    severity: severity,
    description: description,
    interpretation: interpretation,
    severityLevels: {
      'ضئيلة': '0-4 points - Minimal somatic symptoms',
      'منخفضة': '5-9 points - Low somatic symptoms', 
      'متوسطة': '10-14 points - Moderate somatic symptoms',
      'عالية': '15-30 points - High somatic symptoms'
    }
  };
};

/**
 * Calculate PHQ-9 depression screening scores
 * @param {Array} answers - Array of answer objects with question_id and answer values
 * @returns {Object} - Object containing total score and depression severity classification
 */
const calculatePHQ9Scores = (answers) => {
  // Calculate total score by summing all answer values
  let totalScore = 0;
  
  answers.forEach(answer => {
    // Convert answer to number (0, 1, 2, or 3)
    const score = parseInt(answer.answer);
    if (!isNaN(score)) {
      totalScore += score;
    }
  });

  // Determine depression severity based on total score
  let severity = '';
  let description = '';
  let interpretation = '';
  let recommendation = '';

  if (totalScore >= 1 && totalScore <= 4) {
    severity = 'ضئيلة';
    description = 'Minimal depression';
    interpretation = 'You report minimal depressive symptoms. This suggests good mental health with very mild symptoms that are unlikely to interfere with daily functioning.';
    recommendation = 'Continue monitoring your mood. These symptoms are common and usually resolve on their own.';
  } else if (totalScore >= 5 && totalScore <= 9) {
    severity = 'خفيفة';
    description = 'Mild depression';
    interpretation = 'You report mild depressive symptoms. This suggests some depression that may benefit from attention and support.';
    recommendation = 'Consider talking to a mental health professional or trusted person. Self-care strategies may be helpful.';
  } else if (totalScore >= 10 && totalScore <= 14) {
    severity = 'متوسطة';
    description = 'Moderate depression';
    interpretation = 'You report moderate depressive symptoms. This suggests clinically significant depression that likely requires treatment.';
    recommendation = 'Strongly recommend seeking professional help from a mental health provider or doctor.';
  } else if (totalScore >= 15 && totalScore <= 19) {
    severity = 'متوسطة إلى شديدة';
    description = 'Moderately severe depression';
    interpretation = 'You report moderately severe depressive symptoms. This suggests significant depression that requires immediate attention.';
    recommendation = 'Urgently seek professional mental health treatment. This level of depression can significantly impact daily life.';
  } else if (totalScore >= 20 && totalScore <= 27) {
    severity = 'شديدة';
    description = 'Severe depression';
    interpretation = 'You report severe depressive symptoms. This suggests major depression that requires immediate professional intervention.';
    recommendation = 'Immediately seek professional mental health treatment. This level of depression requires urgent care and support.';
  } else if (totalScore === 0) {
    severity = 'لا توجد أعراض';
    description = 'No depression symptoms';
    interpretation = 'You report no depressive symptoms. This suggests good mental health with no signs of depression.';
    recommendation = 'Continue maintaining your current mental health practices.';
  }

  // Calculate percentage of maximum possible score (27)
  const maxPossibleScore = 27;
  const percentageScore = totalScore > 0 ? ((totalScore / maxPossibleScore) * 100).toFixed(1) : 0;

  // Check for suicidal ideation (Question 9)
  const suicidalThoughts = answers.find(a => a.question_id === 9);
  const hasSuicidalThoughts = suicidalThoughts && parseInt(suicidalThoughts.answer) > 0;

  return {
    totalScore: totalScore,
    maxPossibleScore: maxPossibleScore,
    percentageScore: percentageScore,
    severity: severity,
    description: description,
    interpretation: interpretation,
    recommendation: recommendation,
    hasSuicidalThoughts: hasSuicidalThoughts,
    severityLevels: {
      'لا توجد أعراض': '0 points - No depression symptoms',
      'ضئيلة': '1-4 points - Minimal depression',
      'خفيفة': '5-9 points - Mild depression',
      'متوسطة': '10-14 points - Moderate depression',
      'متوسطة إلى شديدة': '15-19 points - Moderately severe depression',
      'شديدة': '20-27 points - Severe depression'
    },
    clinicalNote: hasSuicidalThoughts ? 'IMPORTANT: This assessment indicates suicidal ideation. Immediate professional evaluation is strongly recommended.' : 'No suicidal ideation detected in this assessment.'
  };
};

/**
 * Calculate PSS-10 Perceived Stress Scale scores
 * @param {Array} answers - Array of answer objects with question_id and answer values
 * @returns {Object} - Object containing total score and stress level classification
 */
const calculatePSS10Scores = (answers) => {
  // Calculate total score with reverse scoring for positively worded items
  let totalScore = 0;
  
  answers.forEach(answer => {
    const questionId = parseInt(answer.question_id);
    let score = parseInt(answer.answer);
    
    if (!isNaN(score)) {
      // Reverse scoring for positively worded items (questions 4, 5, 7, 8)
      if ([4, 5, 7, 8].includes(questionId)) {
        score = 4 - score; // Reverse: 0->4, 1->3, 2->2, 3->1, 4->0
      }
      totalScore += score;
    }
  });

  // Determine stress level based on total score
  let stressLevel = '';
  let description = '';
  let interpretation = '';
  let recommendation = '';

  if (totalScore >= 0 && totalScore <= 13) {
    stressLevel = 'منخفض';
    description = 'Low perceived stress';
    interpretation = 'You report low levels of perceived stress. This suggests good stress management and coping abilities.';
    recommendation = 'Continue maintaining your current stress management practices. Your coping strategies are effective.';
  } else if (totalScore >= 14 && totalScore <= 26) {
    stressLevel = 'متوسط';
    description = 'Moderate perceived stress';
    interpretation = 'You report moderate levels of perceived stress. This is within normal range for most people.';
    recommendation = 'Consider stress management techniques like exercise, meditation, or time management strategies.';
  } else if (totalScore >= 27 && totalScore <= 40) {
    stressLevel = 'عالي';
    description = 'High perceived stress';
    interpretation = 'You report high levels of perceived stress. This suggests significant stress that may impact daily functioning.';
    recommendation = 'Strongly recommend stress management interventions. Consider professional help if stress persists.';
  }

  // Calculate percentage of maximum possible score (40)
  const maxPossibleScore = 40;
  const percentageScore = ((totalScore / maxPossibleScore) * 100).toFixed(1);

  // Identify high-stress areas based on individual question scores
  const highStressQuestions = [];
  answers.forEach(answer => {
    const questionId = parseInt(answer.question_id);
    const score = parseInt(answer.answer);
    
    if (!isNaN(score)) {
      let adjustedScore = score;
      // Apply reverse scoring for positively worded items
      if ([4, 5, 7, 8].includes(questionId)) {
        adjustedScore = 4 - score;
      }
      
      if (adjustedScore >= 3) { // High stress (3 or 4 points)
        highStressQuestions.push({
          questionId: questionId,
          originalScore: score,
          adjustedScore: adjustedScore
        });
      }
    }
  });

  return {
    totalScore: totalScore,
    maxPossibleScore: maxPossibleScore,
    percentageScore: percentageScore,
    stressLevel: stressLevel,
    description: description,
    interpretation: interpretation,
    recommendation: recommendation,
    highStressAreas: highStressQuestions,
    stressLevels: {
      'منخفض': '0-13 points - Low perceived stress',
      'متوسط': '14-26 points - Moderate perceived stress',
      'عالي': '27-40 points - High perceived stress'
    },
    scoringNote: 'Questions 4, 5, 7, and 8 use reverse scoring (positively worded items).',
    clinicalNote: totalScore >= 27 ? 'High stress levels detected. Consider stress management interventions and professional support if needed.' : 'Stress levels within manageable range.'
  };
};

/**
 * Calculate GAD-7 Generalized Anxiety Disorder screening scores
 * @param {Array} answers - Array of answer objects with question_id and answer values
 * @returns {Object} - Object containing anxiety score and severity classification
 */
const calculateGAD7Scores = (answers) => {
  // Calculate anxiety score from first 7 questions only
  let anxietyScore = 0;
  let functionalImpairment = null;
  
  answers.forEach(answer => {
    const questionId = parseInt(answer.question_id);
    const score = parseInt(answer.answer);
    
    if (!isNaN(score)) {
      if (questionId >= 1 && questionId <= 7) {
        // Main anxiety questions (1-7)
        anxietyScore += score;
      } else if (questionId === 8) {
        // Functional impairment question (8)
        functionalImpairment = score;
      }
    }
  });

  // Determine anxiety severity based on score from questions 1-7
  let severity = '';
  let description = '';
  let interpretation = '';
  let recommendation = '';
  let clinicalAction = '';

  if (anxietyScore >= 0 && anxietyScore <= 4) {
    severity = 'ضئيل';
    description = 'Minimal anxiety';
    interpretation = 'You report minimal anxiety symptoms. This suggests good mental health with very mild anxiety that is unlikely to interfere with daily functioning.';
    recommendation = 'Continue maintaining your current mental health practices. These symptoms are common and usually resolve on their own.';
    clinicalAction = 'No clinical intervention needed. Monitor if symptoms worsen.';
  } else if (anxietyScore >= 5 && anxietyScore <= 9) {
    severity = 'خفيف';
    description = 'Mild anxiety';
    interpretation = 'You report mild anxiety symptoms. This suggests some anxiety that may benefit from attention and support.';
    recommendation = 'Consider anxiety management techniques like relaxation exercises, mindfulness, or talking to a trusted person.';
    clinicalAction = 'Consider brief intervention or self-help strategies.';
  } else if (anxietyScore >= 10 && anxietyScore <= 14) {
    severity = 'متوسط';
    description = 'Moderate anxiety';
    interpretation = 'You report moderate anxiety symptoms. This suggests clinically significant anxiety that likely requires treatment.';
    recommendation = 'Strongly recommend seeking professional help from a mental health provider or doctor.';
    clinicalAction = 'Clinical assessment recommended. Consider therapy or medication evaluation.';
  } else if (anxietyScore >= 15 && anxietyScore <= 21) {
    severity = 'شديد';
    description = 'Severe anxiety';
    interpretation = 'You report severe anxiety symptoms. This suggests significant anxiety that requires immediate attention and treatment.';
    recommendation = 'Urgently seek professional mental health treatment. This level of anxiety can significantly impact daily life.';
    clinicalAction = 'Immediate clinical intervention required. Consider medication and intensive therapy.';
  }

  // Analyze functional impairment (Question 8)
  let impairmentLevel = '';
  let impairmentDescription = '';
  
  if (functionalImpairment !== null) {
    if (functionalImpairment === 1) {
      impairmentLevel = 'لا توجد صعوبة';
      impairmentDescription = 'No difficulty with daily activities';
    } else if (functionalImpairment === 2) {
      impairmentLevel = 'صعوبة بسيطة';
      impairmentDescription = 'Mild difficulty with daily activities';
    } else if (functionalImpairment === 3) {
      impairmentLevel = 'صعوبة متوسطة';
      impairmentDescription = 'Moderate difficulty with daily activities';
    } else if (functionalImpairment === 4) {
      impairmentLevel = 'صعوبة شديدة';
      impairmentDescription = 'Severe difficulty with daily activities';
    }
  }

  // Calculate percentage of maximum possible anxiety score (21)
  const maxAnxietyScore = 21;
  const percentageScore = anxietyScore > 0 ? ((anxietyScore / maxAnxietyScore) * 100).toFixed(1) : 0;

  // Check for clinically significant anxiety (score ≥ 10)
  const isClinicallySignificant = anxietyScore >= 10;

  return {
    anxietyScore: anxietyScore,
    maxAnxietyScore: maxAnxietyScore,
    percentageScore: percentageScore,
    severity: severity,
    description: description,
    interpretation: interpretation,
    recommendation: recommendation,
    clinicalAction: clinicalAction,
    functionalImpairment: {
      score: functionalImpairment,
      level: impairmentLevel,
      description: impairmentDescription
    },
    isClinicallySignificant: isClinicallySignificant,
    severityLevels: {
      'ضئيل': '0-4 points - Minimal anxiety',
      'خفيف': '5-9 points - Mild anxiety',
      'متوسط': '10-14 points - Moderate anxiety',
      'شديد': '15-21 points - Severe anxiety'
    },
    clinicalNote: isClinicallySignificant ? 
      'IMPORTANT: This assessment indicates clinically significant anxiety. Professional evaluation is strongly recommended.' : 
      'Anxiety levels within normal range. Continue monitoring if symptoms persist.',
    screeningNote: 'GAD-7 is a screening tool. Clinical diagnosis requires comprehensive evaluation by a mental health professional.'
  };
};

/**
 * Calculate ASRS v1.1 Adult ADHD Self-Report Scale scores
 * @param {Array} answers - Array of answer objects with question_id and answer values
 * @returns {Object} - Object containing Part A and Part B scores with ADHD assessment
 */
const calculateASRSScores = (answers) => {
  // Calculate Part A score (questions 1-6) - Core ADHD symptoms
  let partAScore = 0;
  let partBScore = 0;
  
  answers.forEach(answer => {
    const questionId = parseInt(answer.question_id);
    const score = parseInt(answer.answer);
    
    if (!isNaN(score)) {
      if (questionId >= 1 && questionId <= 6) {
        // Part A: Core ADHD symptoms (DSM criteria)
        partAScore += score;
      } else if (questionId >= 7 && questionId <= 18) {
        // Part B: Broader ADHD symptoms and functional impact
        partBScore += score;
      }
    }
  });

  // Determine Part A clinical significance (DSM criteria)
  let partASignificance = '';
  let partADescription = '';
  let partAInterpretation = '';
  let partAClinicalAction = '';

  if (partAScore >= 0 && partAScore <= 8) {
    partASignificance = 'منخفض';
    partADescription = 'Low likelihood of ADHD';
    partAInterpretation = 'Your responses suggest a low likelihood of meeting DSM criteria for adult ADHD.';
    partAClinicalAction = 'No clinical intervention needed for ADHD. Monitor if symptoms worsen.';
  } else if (partAScore >= 9 && partAScore <= 16) {
    partASignificance = 'متوسط';
    partADescription = 'Moderate likelihood of ADHD';
    partAInterpretation = 'Your responses suggest a moderate likelihood of meeting DSM criteria for adult ADHD.';
    partAClinicalAction = 'Consider clinical evaluation for ADHD. Monitor symptoms and functional impact.';
  } else if (partAScore >= 17 && partAScore <= 24) {
    partASignificance = 'عالي';
    partADescription = 'High likelihood of ADHD';
    partAInterpretation = 'Your responses suggest a high likelihood of meeting DSM criteria for adult ADHD.';
    partAClinicalAction = 'Strongly recommend clinical evaluation for ADHD. Consider referral to specialist.';
  }

  // Determine Part B severity (broader symptoms and functional impact)
  let partBSeverity = '';
  let partBDescription = '';
  let partBInterpretation = '';

  if (partBScore >= 0 && partBScore <= 16) {
    partBSeverity = 'منخفض';
    partBDescription = 'Low ADHD symptom severity';
    partBInterpretation = 'You report low levels of ADHD-related symptoms and functional difficulties.';
  } else if (partBScore >= 17 && partBScore <= 32) {
    partBSeverity = 'متوسط';
    partBDescription = 'Moderate ADHD symptom severity';
    partBInterpretation = 'You report moderate levels of ADHD-related symptoms that may impact daily functioning.';
  } else if (partBScore >= 33 && partBScore <= 48) {
    partBSeverity = 'عالي';
    partBDescription = 'High ADHD symptom severity';
    partBInterpretation = 'You report high levels of ADHD-related symptoms that likely significantly impact daily functioning.';
  }

  // Calculate percentages
  const maxPartAScore = 24;
  const maxPartBScore = 48;
  const partAPercentage = partAScore > 0 ? ((partAScore / maxPartAScore) * 100).toFixed(1) : 0;
  const partBPercentage = partBScore > 0 ? ((partBScore / maxPartBScore) * 100).toFixed(1) : 0;

  // Overall assessment
  let overallAssessment = '';
  let overallRecommendation = '';
  let isClinicallySignificant = false;

  if (partAScore >= 17) {
    overallAssessment = 'احتمال عالي لاضطراب فرط الحركة ونقص الانتباه';
    overallRecommendation = 'يوصى بشدة بإجراء تقييم سريري شامل من قبل أخصائي في اضطرابات فرط الحركة ونقص الانتباه لدى البالغين.';
    isClinicallySignificant = true;
  } else if (partAScore >= 9) {
    overallAssessment = 'احتمال متوسط لاضطراب فرط الحركة ونقص الانتباه';
    overallRecommendation = 'يوصى بإجراء تقييم سريري إذا كانت الأعراض تؤثر على الأداء اليومي.';
    isClinicallySignificant = false;
  } else {
    overallAssessment = 'احتمال منخفض لاضطراب فرط الحركة ونقص الانتباه';
    overallRecommendation = 'لا يلزم تدخل سريري لاضطراب فرط الحركة ونقص الانتباه. راقب إذا ساءت الأعراض.';
    isClinicallySignificant = false;
  }

  return {
    partA: {
      score: partAScore,
      maxScore: maxPartAScore,
      percentage: partAPercentage,
      significance: partASignificance,
      description: partADescription,
      interpretation: partAInterpretation,
      clinicalAction: partAClinicalAction
    },
    partB: {
      score: partBScore,
      maxScore: maxPartBScore,
      percentage: partBPercentage,
      severity: partBSeverity,
      description: partBDescription,
      interpretation: partBInterpretation
    },
    overall: {
      assessment: overallAssessment,
      recommendation: overallRecommendation,
      isClinicallySignificant: isClinicallySignificant
    },
    scoringInfo: {
      'Part A (Core Symptoms)': 'Questions 1-6: DSM criteria for adult ADHD (0-24 points)',
      'Part B (Broader Impact)': 'Questions 7-18: Broader symptoms and functional impact (0-48 points)',
      'Clinical Threshold': 'Part A score ≥17 suggests high likelihood of ADHD'
    },
    clinicalNote: isClinicallySignificant ? 
      'IMPORTANT: This assessment suggests clinically significant ADHD symptoms. Comprehensive clinical evaluation is strongly recommended.' : 
      'ADHD symptoms within normal range. Continue monitoring if symptoms persist or worsen.',
    screeningNote: 'ASRS v1.1 is a screening tool. Clinical diagnosis requires comprehensive evaluation by a mental health professional specializing in adult ADHD.'
  };
};

module.exports = {
  calculateLeadershipScores,
  calculateLoveLanguagesScores,
  calculateSomaticSymptomScores,
  calculatePHQ9Scores,
  calculatePSS10Scores,
  calculateGAD7Scores,
  calculateASRSScores
};

