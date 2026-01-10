const { User, Post, Subscription, SubscriptionPlan, Transaction } = require('../models');

// @desc    Get creator stats
// @route   GET /api/creators/dashboard/stats
// @access  Private (Creator only)
const getCreatorStats = async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    // Get subscriber count
    const subscriberCount = await Subscription.count({
      where: { 
        creatorId, 
        status: 'active' 
      }
    });
    
    // Get total earnings
    const earningsResult = await Transaction.sum('amount', {
      where: { 
        creatorId,
        status: 'success'
      }
    });
    const totalEarnings = earningsResult || 0;
    
    // Get post count
    const postCount = await Post.count({
      where: { creatorId }
    });
    
    // Get total views
    const viewsResult = await Post.sum('viewCount', {
      where: { creatorId }
    });
    const totalViews = viewsResult || 0;
    
    // Get recent subscribers (last 5)
    const recentSubscribers = await Subscription.findAll({
      where: { creatorId, status: 'active' },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });
    
    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { creatorId, status: 'success' },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name']
      }]
    });
    
    res.json({
      success: true,
      stats: {
        subscribers: subscriberCount,
        earnings: totalEarnings,
        posts: postCount,
        views: totalViews
      },
      recentSubscribers,
      recentTransactions
    });
  } catch (error) {
    console.error('Error getting creator stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator stats'
    });
  }
};

// @desc    Create a new post
// @route   POST /api/creators/posts
// @access  Private (Creator only)
const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, type, visibility, mediaUrls } = req.body;
    const creatorId = req.user.id;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    // Create the post
    const post = await Post.create({
      title,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      type: type || 'article',
      visibility: visibility || 'public',
      mediaUrls: mediaUrls || [],
      creatorId
    });
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

// @desc    Get creator's posts
// @route   GET /api/creators/posts
// @access  Private (Creator only)
const getMyPosts = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: posts } = await Post.findAndCountAll({
      where: { creatorId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      posts,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts'
    });
  }
};

// @desc    Create subscription plan
// @route   POST /api/creators/plans
// @access  Private (Creator only)
const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, description, price, interval, features } = req.body;
    const creatorId = req.user.id;
    
    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }
    
    // Validate price
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }
    
    // Create the subscription plan
    const plan = await SubscriptionPlan.create({
      name,
      description,
      price,
      interval: interval || 'monthly',
      features: features || [],
      creatorId
    });
    
    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription plan'
    });
  }
};

// @desc    Get creator's subscription plans
// @route   GET /api/creators/plans
// @access  Private (Creator only)
const getMyPlans = async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    const plans = await SubscriptionPlan.findAll({
      where: { creatorId, isActive: true },
      order: [['price', 'ASC']]
    });
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plans'
    });
  }
};

// @desc    Update a post
// @route   PUT /api/creators/posts/:id
// @access  Private (Creator only)
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;
    const { title, content, excerpt, visibility, isPublished } = req.body;
    
    // Find the post
    const post = await Post.findOne({
      where: { id, creatorId }
    });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Update the post
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (visibility !== undefined) post.visibility = visibility;
    if (isPublished !== undefined) post.isPublished = isPublished;
    
    await post.save();
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/creators/posts/:id
// @access  Private (Creator only)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;
    
    // Find and delete the post
    const post = await Post.findOne({
      where: { id, creatorId }
    });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    await post.destroy();
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

module.exports = {
  getCreatorStats,
  createPost,
  getMyPosts,
  createSubscriptionPlan,
  getMyPlans,
  updatePost,
  deletePost
};