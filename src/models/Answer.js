const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  survey_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'surveys',
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
    allowNull: true,
  },
  numeric_value: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
  option_selected: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'answers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Answer;