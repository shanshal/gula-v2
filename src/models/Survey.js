const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'archived'),
    defaultValue: 'draft',
  },
  scoring: {
    type: DataTypes.JSONB,
    defaultValue: { type: 'sum' },
  },
  interpretation: {
    type: DataTypes.JSONB,
    defaultValue: {},
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
  tableName: 'surveys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Survey;