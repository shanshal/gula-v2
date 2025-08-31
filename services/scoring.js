const answerModel = require('../models/answerModel');
const surveyModel = require('../models/surveyModel');
const protocoles = require('../protocoles');

const calculateSurveyScore = async (userId, surveyId) => {
  const surveyJSON = await surveyModel.getSurveyById(surveyId);
  if (!surveyJSON) throw new Error('Survey not found');

  const responses = await answerModel.getUserAnswersForSurvey(userId, surveyId);

  switch (surveyJSON.survey.scoring?.type) {
    case 'grouped':
      return protocoles.scoreGrouped(responses, surveyJSON.survey.scoring);
    case 'formula':
      return protocoles.scoreFormula(responses, surveyJSON.survey.scoring);
    case 'sum':
      return protocoles.scoreSum(responses, surveyJSON.survey.scoring?.mappings);
    default:
      return protocoles.leaderShipSurveyHandler(responses);
  }
};

module.exports = { calculateSurveyScore };
