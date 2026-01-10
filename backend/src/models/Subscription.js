const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
    defaultValue: 'pending'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  midtransOrderId: {
    type: DataTypes.STRING(255),
    field: 'midtrans_order_id',
    unique: true // ← IDEMPOTENCY: mencegah duplicate berdasarkan order ID
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'creator_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'plan_id',
    references: {
      model: 'subscription_plans',
      key: 'id'
    }
  },
  transactionId: {
    type: DataTypes.UUID,
    field: 'transaction_id',
    unique: true, // ← IDEMPOTENCY: satu transaksi hanya satu subscription
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  isAutoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_auto_renew'
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
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'creator_id'],
      where: {
        status: 'active'
      },
      name: 'unique_active_subscription_per_creator' // ← Mencegah multiple active subscriptions ke creator yang sama
    }
  ]
});

// Associations
Subscription.associate = (models) => {
  Subscription.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  Subscription.belongsTo(models.User, {
    foreignKey: 'creatorId',
    as: 'creator'
  });
  
  Subscription.belongsTo(models.SubscriptionPlan, {
    foreignKey: 'planId',
    as: 'plan'
  });
  
  Subscription.belongsTo(models.Transaction, {
    foreignKey: 'transactionId',
    as: 'transaction'
  });
};

module.exports = Subscription;