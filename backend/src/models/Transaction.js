// models/Transaction.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    field: 'payment_method'
  },
  midtransOrderId: {
    type: DataTypes.STRING(255),
    unique: true,
    field: 'midtrans_order_id'
  },
  paymentDate: {
    type: DataTypes.DATE,
    field: 'payment_date'
  },
  rawResponse: {
    type: DataTypes.TEXT,
    field: 'raw_response'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'creator_id'
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'plan_id'
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
  tableName: 'transactions',
  timestamps: true,
  underscored: true
});

// Associations
Transaction.associate = (models) => {
  Transaction.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  Transaction.belongsTo(models.User, {
    foreignKey: 'creatorId',
    as: 'creator'
  });
  
  Transaction.belongsTo(models.SubscriptionPlan, {
    foreignKey: 'planId',
    as: 'plan'
  });
  
  Transaction.hasOne(models.Subscription, {
    foreignKey: 'transactionId',
    as: 'subscription'
  });
};

module.exports = Transaction;