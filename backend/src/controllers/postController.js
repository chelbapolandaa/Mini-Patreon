const Post = require('../models/Post');
const Subscription = require('../models/Subscription');

// @desc    Get posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { creatorId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { isPublished: true };
    if (creatorId) where.creatorId = creatorId;
    
    // For non-logged in users, only show public posts
    if (!req.user) {
      where.visibility = 'public';
    }
    
    const posts = await Post.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: require('../models/User'),
          as: 'creator',
          attributes: ['id', 'name', 'avatarUrl']
        }
      ]
    });
    
    // Check access for each post if user is logged in
    const postsWithAccess = await Promise.all(
      posts.map(async (post) => {
        const postData = post.toJSON();
        
        if (req.user) {
          // Check if user has access
          if (post.visibility === 'subscribers_only') {
            const hasAccess = await Subscription.findOne({
              where: {
                userId: req.user.id,
                creatorId: post.creatorId,
                status: 'active'
              }
            });
            
            postData.hasAccess = !!hasAccess;
            
            // If no access, hide full content
            if (!hasAccess) {
              postData.content = postData.content.substring(0, 200) + '...';
              postData.isLocked = true;
            }
          } else {
            postData.hasAccess = true;
          }
        } else {
          // Non-logged in users only see public content
          if (post.visibility === 'subscribers_only') {
            postData.content = postData.content.substring(0, 200) + '...';
            postData.isLocked = true;
            postData.hasAccess = false;
          } else {
            postData.hasAccess = true;
          }
        }
        
        return postData;
      })
    );
    
    const total = await Post.count({ where });
    
    res.json({
      success: true,
      count: posts.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      posts: postsWithAccess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: require('../models/User'),
          as: 'creator',
          attributes: ['id', 'name', 'avatarUrl', 'bio']
        }
      ]
    });
    
    if (!post || !post.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    let hasAccess = false;
    let isLocked = false;
    
    if (post.visibility === 'public') {
      hasAccess = true;
    } else if (post.visibility === 'subscribers_only') {
      if (req.user) {
        const subscription = await Subscription.findOne({
          where: {
            userId: req.user.id,
            creatorId: post.creatorId,
            status: 'active'
          }
        });
        hasAccess = !!subscription;
      }
      
      if (!hasAccess) {
        isLocked = true;
        post.content = post.content.substring(0, 200) + '...';
      }
    }
    
    // Increment view count
    await post.increment('viewCount');
    
    res.json({
      success: true,
      post: {
        ...post.toJSON(),
        hasAccess,
        isLocked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getPosts,
  getPostById
};