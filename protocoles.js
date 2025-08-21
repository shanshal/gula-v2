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

console.log(leaderShipSurveyHandler(surveyAnswers)); 

