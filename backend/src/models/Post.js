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
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_published'
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
  tableName: 'posts',
  timestamps: true,
  underscored: true, // ← TAMBAHKAN INI
  createdAt: 'created_at', // ← TAMBAHKAN INI
  updatedAt: 'updated_at' // ← TAMBAHKAN INI
});

module.exports = Post;