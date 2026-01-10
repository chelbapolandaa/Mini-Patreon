const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  excerpt: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('article', 'video', 'file'),
    defaultValue: 'article'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'subscribers_only'),
    defaultValue: 'public'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  mediaUrls: {
    type: DataTypes.JSONB,
    field: 'media_urls',
    defaultValue: []
  },
  likesCount: { // ← TAMBAHKAN INI
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'likes_count'
  },
  commentsCount: { // ← TAMBAHKAN INI
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'comments_count'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_published'
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'creator_id'
  }
}, {
  tableName: 'posts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Post;