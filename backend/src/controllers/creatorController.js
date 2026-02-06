const { User, Post, Subscription, SubscriptionPlan, Transaction } = require('../models');

// @desc    Get all creators (browse)
// @route   GET /api/creators
// @access  Public
const getCreators = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { role: 'creator' };
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const creators = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        creators: creators.rows,
        total: creators.count,
        page: parseInt(page),
        totalPages: Math.ceil(creators.count / limit)
      }
    });
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ success: false, message: 'Error fetching creators' });
  }
};

// @desc    Get creator profile
// @route   GET /api/creators/:id/profile
// @access  Public
const getCreatorProfile = async (req, res) => {
  try {
    const creatorId = req.params.id;

    // Ambil data creator
    const creator = await User.findByPk(creatorId, {
      attributes: ['id', 'name', 'avatar_url', 'bio', 'is_verified', 'created_at', 'role']
    });

    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ success: false, message: 'Creator not found' });
    }

    // Ambil subscription plans aktif
    const plans = await SubscriptionPlan.findAll({
      where: { creatorId, isActive: true },
      attributes: ['id', 'name', 'description', 'price', 'interval', 'features']
    });

    // Hitung stats
    const subscribersCount = await Subscription.count({
      where: { creatorId, status: 'active' }
    });

    const totalPosts = await Post.count({
      where: { creatorId }
    });

    const publicPosts = await Post.count({
      where: { creatorId, visibility: 'public' }
    });

    // Kalau ada user login, cek apakah dia sudah subscribe
    let isSubscribed = false;
    if (req.user) {
      const activeSub = await Subscription.findOne({
        where: { creatorId, userId: req.user.id, status: 'active' }
      });
      isSubscribed = !!activeSub;
    }

    res.json({
      success: true,
      data: {
        id: creator.id,
        name: creator.name,
        avatar_url: creator.avatar_url,
        bio: creator.bio,
        is_verified: creator.is_verified,
        created_at: creator.created_at,
        role: creator.role,
        stats: {
          subscribers: subscribersCount,
          totalPosts,
          publicPosts
        },
        plans,
        isSubscribed
      }
    });
  } catch (error) {
    console.error('Get creator profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching creator profile' });
  }
};

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


const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, type, visibility, mediaUrls } = req.body;
    const creatorId = req.user.id;
    
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

// @desc    Get single post by ID (for editing)
// @route   GET /api/creators/posts/:id
// @access  Private (Creator only)
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;
    
    const post = await Post.findOne({
      where: { 
        id: id,
        creatorId: creatorId 
      }
    });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        type: post.type,
        visibility: post.visibility,
        mediaUrls: post.mediaUrls || [],
        viewCount: post.viewCount,
        isPublished: post.isPublished,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        creatorId: post.creatorId
      }
    });
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post'
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
    const { title, content, excerpt, visibility, isPublished, mediaUrls, type } = req.body;
    
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
    
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (visibility !== undefined) post.visibility = visibility;
    if (isPublished !== undefined) post.isPublished = isPublished;
    if (mediaUrls !== undefined) post.mediaUrls = mediaUrls;
    if (type !== undefined) post.type = type;
    
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
  getPostById,
  createSubscriptionPlan,
  getMyPlans,
  updatePost,
  deletePost,
  getCreators, 
  getCreatorProfile
};