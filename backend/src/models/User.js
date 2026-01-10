const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'creator', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  avatarUrl: {
    type: DataTypes.TEXT,
    field: 'avatar_url'
  },
  bio: {
    type: DataTypes.TEXT
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_banned'
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.passwordHash) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('passwordHash')) {
        user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
      }
    }
  }
});

// ========== ASSOCIATIONS ==========
User.associate = function(models) {
  // User as subscriber (membeli subscription)
  User.hasMany(models.Subscription, {
    foreignKey: 'userId',
    as: 'subscriptions'
  });
  
  // User as creator (dibeli subscription-nya)
  User.hasMany(models.Subscription, {
    foreignKey: 'creatorId',
    as: 'creatorSubscriptions'
  });
  
  // User memiliki subscription plans (jika creator)
  User.hasMany(models.SubscriptionPlan, {
    foreignKey: 'creatorId',
    as: 'plans'
  });
  
  // User melakukan transactions
  User.hasMany(models.Transaction, {
    foreignKey: 'userId',
    as: 'transactions'
  });
  
  // User menerima transactions (jika creator)
  User.hasMany(models.Transaction, {
    foreignKey: 'creatorId',
    as: 'creatorTransactions'
  });
  
  // User membuat posts (jika creator)
  User.hasMany(models.Post, {
    foreignKey: 'creatorId',
    as: 'posts'
  });
};

// Instance method to check password
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Instance method to get public profile
User.prototype.toPublicJSON = function() {
  const { passwordHash, isBanned, ...publicData } = this.toJSON();
  return publicData;
};

module.exports = User;