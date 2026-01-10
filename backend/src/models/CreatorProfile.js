const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CreatorProfile = sequelize.define('CreatorProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stripeAccountId: {
    type: DataTypes.STRING(255),
    field: 'stripe_account_id'
  },
  totalSubscribers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_subscribers'
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_earnings'
  }
}, {
  tableName: 'creator_profiles',
  timestamps: true
});

module.exports = CreatorProfile;