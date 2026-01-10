const User = require('./User');
const Post = require('./Post');
const Subscription = require('./Subscription');
const SubscriptionPlan = require('./SubscriptionPlan');
const Transaction = require('./Transaction');
const WebhookLog = require('./WebhookLog');
const CreatorProfile = require('./CreatorProfile');
const Comment = require('./Comment'); // ← TAMBAHKAN
const PostLike = require('./PostLike'); // ← TAMBAHKAN

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

// User - Comment (User has many comments)
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post - Comment (Post has many comments)
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Comment - Comment (Replies)
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// User - PostLike (User has many likes)
User.hasMany(PostLike, { foreignKey: 'userId', as: 'likes' });
PostLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post - PostLike (Post has many likes)
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'postLikes' });
PostLike.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

module.exports = {
  User,
  Post,
  Subscription,
  SubscriptionPlan,
  Transaction,
  WebhookLog,
  CreatorProfile,
  Comment, // ← TAMBAHKAN
  PostLike // ← TAMBAHKAN
};