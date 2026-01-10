const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WebhookLog = sequelize.define('WebhookLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  eventType: {
    type: DataTypes.STRING(100),
    field: 'event_type'
  },
  payload: {
    type: DataTypes.JSONB
  },
  status: {
    type: DataTypes.STRING(20)
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message'
  }
}, {
  tableName: 'webhook_logs',
  timestamps: true
});

module.exports = WebhookLog;