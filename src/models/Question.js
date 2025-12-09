const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  survey_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'surveys',
      key: 'id',
    },
  },
  question_text: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  question_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  min_value: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  max_value: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  question_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  placeholder: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  help_text: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  question_route: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  weight: {
    type: DataTypes.DECIMAL,
    defaultValue: 1,
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
  tableName: 'questions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Question;