const User = require('./User');
const Post = require('./Post');
const Subscription = require('./Subscription');
const SubscriptionPlan = require('./SubscriptionPlan');
const Transaction = require('./Transaction');
const WebhookLog = require('./WebhookLog');
const CreatorProfile = require('./CreatorProfile');

// User - CreatorProfile (One-to-One)
User.hasOne(CreatorProfile, { foreignKey: 'userId', as: 'creatorProfile' });
CreatorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Post (Creator has many posts)
User.hasMany(Post, { foreignKey: 'creatorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// User - Subscription (User has many subscriptions)
User.hasMany(Subscription, { foreignKey: 'userId', as: 'userSubscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Creator - Subscription (Creator has many subscribers)
User.hasMany(Subscription, { foreignKey: 'creatorId', as: 'creatorSubscriptions' });
Subscription.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// SubscriptionPlan - Subscription
SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

// User - SubscriptionPlan (Creator creates plans)
User.hasMany(SubscriptionPlan, { foreignKey: 'creatorId', as: 'plans' });
SubscriptionPlan.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// User - Transaction (User makes transactions)
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Creator - Transaction (Creator receives payments)
User.hasMany(Transaction, { foreignKey: 'creatorId', as: 'receivedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// SubscriptionPlan - Transaction
SubscriptionPlan.hasMany(Transaction, { foreignKey: 'planId', as: 'transactions' });
Transaction.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

module.exports = {
  User,
  Post,
  Subscription,
  SubscriptionPlan,
  Transaction,
  WebhookLog,
  CreatorProfile
};