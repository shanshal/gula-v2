const Survey = require('./Survey');
const Question = require('./Question');
const Answer = require('./Answer');

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

module.exports = {
  Survey,
  Question,
  Answer,
};