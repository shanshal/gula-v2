const scoringService = require('../services/scoring');

const getSurveyScore = async (req, res) => {
  try {
    const { userId, surveyId } = req.params;
    const score = await scoringService.calculateSurveyScore(userId, surveyId);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSurveyScore };
