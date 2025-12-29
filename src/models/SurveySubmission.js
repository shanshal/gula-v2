const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SurveySubmission = sequelize.define('SurveySubmission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    // No foreign key constraint - users are managed by auth microservice
  },
  survey_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'surveys',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('draft', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'completed',
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'survey_submissions',
  timestamps: true,
  createdAt: 'submitted_at',
  updatedAt: 'updated_at',
});

module.exports = SurveySubmission;