const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  interval: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly',
    allowNull: false
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'creator_id'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'subscription_plans',
  timestamps: true,
  underscored: true
});

// ========== ASSOCIATIONS ==========
SubscriptionPlan.associate = function(models) {
  SubscriptionPlan.belongsTo(models.User, {
    foreignKey: 'creatorId',
    as: 'creator'
  });
  
  SubscriptionPlan.hasMany(models.Subscription, {
    foreignKey: 'planId',
    as: 'subscriptions'
  });
  
  SubscriptionPlan.hasMany(models.Transaction, {
    foreignKey: 'planId',
    as: 'transactions'
  });
};

module.exports = SubscriptionPlan;