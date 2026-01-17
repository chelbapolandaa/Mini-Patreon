const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { 
  User, 
  Post,
  CreatorProfile 
} = require('../models');

router.get('/', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ 
        success: true, 
        data: { 
          creators: [], 
          posts: [],
          total: 0
        } 
      });
    }

    const searchTerm = query.trim();
    
    // Search creators
    const creators = await User.findAll({
      where: {
        role: 'creator',
        is_banned: false,
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { bio: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      attributes: ['id', 'name', 'avatar_url', 'bio', 'is_verified', 'created_at'],
      include: [{
        model: CreatorProfile,
        as: 'creatorProfile',
        attributes: ['id', 'total_subscribers', 'total_earnings', 'created_at']
      }],
      order: [
        [{ model: CreatorProfile, as: 'creatorProfile' }, 'total_subscribers', 'DESC']
      ],
      limit: limit ? parseInt(limit) : 20
    });

    // Search posts
    const posts = await Post.findAll({
      where: {
        is_published: true,
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchTerm}%` } },
          { content: { [Op.iLike]: `%${searchTerm}%` } },
          { excerpt: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      attributes: [
        'id', 
        'title', 
        'excerpt', 
        'type', 
        'visibility',
        'view_count',
        'media_urls',
        'likes_count',
        'comments_count',
        'created_at'
      ],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'avatar_url', 'is_verified']
      }],
      order: [['created_at', 'DESC']],
      limit: limit ? parseInt(limit) : 20
    });

    // Format creators response
    const formattedCreators = creators.map(user => ({
      _id: user.id,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      isVerified: user.is_verified || false,
      subscriberCount: user.creatorProfile?.total_subscribers || 0,
      totalEarnings: user.creatorProfile?.total_earnings || 0,
      joinedDate: user.created_at
    }));

    // Format posts response - SEKARANG DENGAN DATA LENGKAP
    const formattedPosts = posts.map(post => {
      // Ambil thumbnail pertama dari media_urls jika ada
      const mediaUrls = post.media_urls || [];
      let thumbnail = null;
      
      // Cari image pertama dari media_urls untuk thumbnail
      if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
        // Asumsi media_urls berisi array URL
        thumbnail = mediaUrls[0];
      }

      return {
        _id: post.id,
        title: post.title,
        excerpt: post.excerpt || '',
        type: post.type || 'article',
        thumbnail: thumbnail,
        mediaUrls: mediaUrls,
        visibility: post.visibility || 'public',
        viewCount: post.view_count || 0,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        createdAt: post.created_at,
        creatorId: post.creator?.id,
        creatorName: post.creator?.name,
        creatorAvatar: post.creator?.avatar_url,
        creatorVerified: post.creator?.is_verified || false
      };
    });

    res.json({
      success: true,
      data: {
        creators: formattedCreators,
        posts: formattedPosts,
        total: {
          creators: formattedCreators.length,
          posts: formattedPosts.length,
          all: formattedCreators.length + formattedPosts.length
        }
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    console.error('Error details:', error.message);
    console.error('SQL Error:', error.sql);
    res.status(500).json({ 
      success: false, 
      message: 'Error performing search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/search/creators (search creators only)
router.get('/creators', async (req, res) => {
  try {
    const { q: query, limit } = req.query;
    
    const searchTerm = query?.trim() || '';
    
    const whereClause = {
      role: 'creator',
      is_banned: false
    };
    
    if (searchTerm.length >= 2) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { bio: { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }

    const creators = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'avatar_url', 'bio', 'is_verified', 'created_at'],
      include: [{
        model: CreatorProfile,
        as: 'creatorProfile',
        attributes: ['id', 'total_subscribers', 'total_earnings', 'created_at']
      }],
      order: [
        [{ model: CreatorProfile, as: 'creatorProfile' }, 'total_subscribers', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: limit ? parseInt(limit) : 20
    });

    res.json({
      success: true,
      data: {
        creators: creators.map(user => ({
          _id: user.id,
          name: user.name,
          avatar: user.avatar_url,
          bio: user.bio,
          isVerified: user.is_verified || false,
          subscriberCount: user.creatorProfile?.total_subscribers || 0,
          totalEarnings: user.creatorProfile?.total_earnings || 0,
          joinedDate: user.created_at
        })),
        total: creators.length
      }
    });

  } catch (error) {
    console.error('Search creators error:', error);
    res.status(500).json({ success: false, message: 'Error searching creators' });
  }
});

// GET /api/search/trending/creators
router.get('/trending/creators', async (req, res) => {
  try {
    const creators = await User.findAll({
      where: {
        role: 'creator',
        is_banned: false
      },
      attributes: ['id', 'name', 'avatar_url', 'bio', 'is_verified', 'created_at'],
      include: [{
        model: CreatorProfile,
        as: 'creatorProfile',
        attributes: ['id', 'total_subscribers', 'total_earnings', 'created_at']
      }],
      order: [
        [{ model: CreatorProfile, as: 'creatorProfile' }, 'total_subscribers', 'DESC']
      ],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        creators: creators.map(user => ({
          _id: user.id,
          name: user.name,
          avatar: user.avatar_url,
          bio: user.bio,
          isVerified: user.is_verified || false,
          subscriberCount: user.creatorProfile?.total_subscribers || 0,
          totalEarnings: user.creatorProfile?.total_earnings || 0
        }))
      }
    });
  } catch (error) {
    console.error('Trending creators error:', error);
    res.status(500).json({ success: false, message: 'Error getting trending creators' });
  }
});

// GET /api/search/trending/posts
router.get('/trending/posts', async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { 
        is_published: true,
        visibility: 'public'
      },
      attributes: [
        'id', 
        'title', 
        'excerpt', 
        'type', 
        'visibility',
        'view_count',
        'media_urls',
        'likes_count',
        'comments_count',
        'created_at'
      ],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'avatar_url', 'is_verified']
      }],
      // Trending berdasarkan likes_count dan comments_count
      order: [
        ['likes_count', 'DESC'],
        ['comments_count', 'DESC']
      ],
      limit: 10
    });

    const formattedPosts = posts.map(post => {
      const mediaUrls = post.media_urls || [];
      let thumbnail = null;
      
      if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
        thumbnail = mediaUrls[0];
      }

      return {
        _id: post.id,
        title: post.title,
        excerpt: post.excerpt || '',
        type: post.type || 'article',
        thumbnail: thumbnail,
        mediaUrls: mediaUrls,
        visibility: post.visibility || 'public',
        viewCount: post.view_count || 0,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        createdAt: post.created_at,
        creatorId: post.creator?.id,
        creatorName: post.creator?.name,
        creatorAvatar: post.creator?.avatar_url,
        creatorVerified: post.creator?.is_verified || false
      };
    });

    res.json({
      success: true,
      data: {
        posts: formattedPosts
      }
    });
  } catch (error) {
    console.error('Trending posts error:', error);
    res.status(500).json({ success: false, message: 'Error getting trending posts' });
  }
});

module.exports = router;