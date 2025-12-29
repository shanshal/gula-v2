const Survey = require('./Survey');
const Question = require('./Question');
const Answer = require('./Answer');
const SurveySubmission = require('./SurveySubmission');
const SurveyAnswer = require('./SurveyAnswer');

// Define associations
Survey.hasMany(Question, {
  foreignKey: 'survey_id',
  as: 'questions',
  onDelete: 'CASCADE',
});

Question.belongsTo(Survey, {
  foreignKey: 'survey_id',
  as: 'survey',
});

// Note: User associations are handled through the auth microservice
// user_id in Answer model still exists as a foreign key reference
// but User model operations are done via authClient service

Survey.hasMany(Answer, {
  foreignKey: 'survey_id',
  as: 'answers',
  onDelete: 'CASCADE',
});

Answer.belongsTo(Survey, {
  foreignKey: 'survey_id',
  as: 'survey',
});

Question.hasMany(Answer, {
  foreignKey: 'question_id',
  as: 'answers',
  onDelete: 'CASCADE',
});

Answer.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});

// New submission-based associations
Survey.hasMany(SurveySubmission, {
  foreignKey: 'survey_id',
  as: 'submissions',
  onDelete: 'CASCADE',
});

SurveySubmission.belongsTo(Survey, {
  foreignKey: 'survey_id',
  as: 'survey',
});

SurveySubmission.hasMany(SurveyAnswer, {
  foreignKey: 'submission_id',
  as: 'responses',
  onDelete: 'CASCADE',
});

SurveyAnswer.belongsTo(SurveySubmission, {
  foreignKey: 'submission_id',
  as: 'submission',
});

SurveyAnswer.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
});

Question.hasMany(SurveyAnswer, {
  foreignKey: 'question_id',
  as: 'survey_answers',
  onDelete: 'CASCADE',
});

module.exports = {
  Survey,
  Question,
  Answer,
  SurveySubmission,
  SurveyAnswer,
};