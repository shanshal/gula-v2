const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SurveyAnswer = sequelize.define('SurveyAnswer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  submission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'survey_submissions',
      key: 'id',
    },
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'questions',
      key: 'id',
    },
  },
  answer_value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answer_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'survey_answers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = SurveyAnswer;