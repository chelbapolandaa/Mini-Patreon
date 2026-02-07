const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const PostLike = require('../models/PostLike');
const Subscription = require('../models/Subscription');
const { Op } = require('sequelize');

// @desc    Get all posts (with filters)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const {
      creatorId,
      type,
      visibility,
      isPublished,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    
    if (creatorId) whereClause.creatorId = creatorId;
    if (type) whereClause.type = type;
    if (visibility) whereClause.visibility = visibility;
    if (isPublished !== undefined) whereClause.isPublished = isPublished === 'true';

    const offset = (page - 1) * limit;

    const posts = await Post.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'avatar_url', 'is_verified']
      }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        posts: posts.rows,
        total: posts.count,
        page: parseInt(page),
        totalPages: Math.ceil(posts.count / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: 'Error fetching posts' });
  }
};

const getPostById = async (req, res) => {
  try {
    console.log('➡️ Incoming request for postId:', req.params.id);
    console.log('➡️ Current user from JWT:', req.user?.id);

    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'avatar_url', 'bio', 'is_verified', 'created_at']
      }]
    });

    if (!post) {
      console.log('❌ Post not found');
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    console.log('✅ Post found:', post.id, 'creatorId:', post.creatorId, 'creator.id:', post.creator?.id);

    let hasAccess = true;
    let isSubscribed = false;

    // cek akses untuk post subscription
    if (post.visibility === 'subscribers' || post.visibility === 'subscribers_only') {
      if (!req.user) {
        console.log('⚠️ No user, guest access denied');
        hasAccess = false;
      } else if (req.user.id !== post.creatorId) {
        console.log('🔍 Checking subscription for user:', req.user.id, 'creator:', post.creatorId);

        const subscription = await Subscription.findOne({
          where: {
            userId: req.user.id,
            creatorId: post.creatorId,
            status: 'active'
          }
        });

        console.log('📦 Subscription query result:', subscription);

        hasAccess = !!subscription;
        isSubscribed = !!subscription;
      }
    }

    // increment view count hanya kalau punya akses
    if (hasAccess) {
      await post.increment('view_count');
      console.log('👁 View count incremented for post:', post.id);
    }

    // cek apakah user sudah like
    let userLiked = false;
    if (req.user) {
      const like = await PostLike.findOne({
        where: { postId: post.id, userId: req.user.id }
      });
      userLiked = !!like;
      console.log('👍 User liked?', userLiked);
    }

    // bentuk respons aman
    const safePost = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      type: post.type,
      visibility: post.visibility,
      creatorId: post.creatorId,
      creator: post.creator,
      created_at: post.created_at,
      updated_at: post.updated_at,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      userLiked
    };

    if (hasAccess) {
      safePost.content = post.content;
      safePost.mediaUrls = post.mediaUrls;
    }

    console.log('✅ Final access check:', { hasAccess, isSubscribed });

    return res.json({
      success: true,
      data: {
        post: safePost,
        hasAccess,
        isSubscribed
      }
    });

  } catch (error) {
    console.error('💥 Get post by ID error:', error);
    res.status(500).json({ success: false, message: 'Error fetching post' });
  }
};


const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, type, visibility, mediaUrls } = req.body;
    
    console.log('Create post data:', { title, type, visibility, mediaUrls });
    
    // Validasi mediaUrls
    let validMediaUrls = [];
     if (mediaUrls && Array.isArray(mediaUrls)) {
      validMediaUrls = mediaUrls.filter(url => {
        // Filter yang null/undefined dan bukan string
        if (!url || typeof url !== 'string') return false;
        
        // Filter blob URLs
        if (url.startsWith('blob:')) return false;
        
        // Terima URL yang valid (http/https atau /uploads)
        return url.startsWith('http') || url.startsWith('/uploads') || url.startsWith('data:');
      });
    }

    // Validasi required fields
    if (!title || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and type are required'
      });
    }

    // Validasi type - SESUAIKAN DENGAN MODEL
    const validTypes = ['article', 'video', 'file', 'image', 'audio', 'document'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post type. Must be one of: ' + validTypes.join(', ')
      });
    }

    // Validasi visibility - SESUAIKAN DENGAN MODEL
    const validVisibility = ['public', 'private', 'subscribers'];
    const postVisibility = visibility || 'public';
    
    if (!validVisibility.includes(postVisibility)) {
      return res.status(400).json({
        success: false,
        message: `Invalid visibility setting. Must be one of: ${validVisibility.join(', ')}`
      });
    }

    // Buat post
    const post = await Post.create({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      type,
      visibility: postVisibility,
      mediaUrls: validMediaUrls,
      creatorId: req.user.id,
      isPublished: true
    });

    // Get complete post data - PERBAIKI INI
    const completePost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'avatarUrl', 'bio'] // PAKAI 'name' BUKAN 'username'
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: completePost
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating post'
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Creator of the post)
const updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user is the creator of the post
    if (post.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this post' 
      });
    }

    const { title, content, excerpt, type, visibility, mediaUrls, isPublished } = req.body;

    // Update fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (type !== undefined) post.type = type;
    if (visibility !== undefined) post.visibility = visibility;
    if (mediaUrls !== undefined) post.mediaUrls = mediaUrls;
    if (isPublished !== undefined) post.isPublished = isPublished;

    await post.save();

    const updatedPost = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'avatar_url']
      }]
    });

    res.json({
      success: true,
      data: {
        post: updatedPost
      }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Error updating post' });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Creator of the post)
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user is the creator of the post
    if (post.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this post' 
      });
    }

    await post.destroy();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingLike = await PostLike.findOne({
      where: { postId: post.id, userId: req.user.id }
    });

    if (existingLike) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post already liked' 
      });
    }

    // Create like
    await PostLike.create({
      postId: post.id,
      userId: req.user.id
    });

    // Increment like count
    await post.increment('likes_count');

    res.json({
      success: true,
      liked: true,
      likesCount: post.likes_count + 1
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: 'Error liking post' });
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Find the like
    const like = await PostLike.findOne({
      where: { postId: post.id, userId: req.user.id }
    });

    if (!like) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post not liked' 
      });
    }

    // Remove like
    await like.destroy();

    // Decrement like count
    await post.decrement('likes_count');

    res.json({
      success: true,
      liked: false,
      likesCount: post.likes_count - 1
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ success: false, message: 'Error unliking post' });
  }
};

// @desc    Get post likes
// @route   GET /api/posts/:id/likes
// @access  Public
const getPostLikes = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const likes = await PostLike.findAll({
      where: { postId: post.id },
      include: [{
        model: User,
        attributes: ['id', 'name', 'avatar_url']
      }],
      limit: 50
    });

    res.json({
      success: true,
      data: {
        likes,
        total: post.likes_count
      }
    });
  } catch (error) {
    console.error('Get post likes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching likes' });
  }
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Public
const getPostComments = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = await Comment.findAll({
      where: { postId: post.id },
      include: [{
        model: User,
        as: 'user', // <-- TAMBAHKAN INI
        attributes: ['id', 'name', 'avatar_url']
      }],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: {
        comments,
        total: post.comments_count
      }
    });
  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check access for subscribers-only posts
    if (post.visibility === 'subscribers_only') {
      if (req.user.id !== post.creatorId) {
        const subscription = await Subscription.findOne({
          where: {
            userId: req.user.id,
            creatorId: post.creatorId,
            status: 'active'
          }
        });
        
        if (!subscription) {
          return res.status(403).json({ 
            success: false, 
            message: 'Subscribers only' 
          });
        }
      }
    }

    // Create comment
    const comment = await Comment.create({
      content: content.trim(),
      postId: post.id,
      userId: req.user.id
    });

    // Increment comment count
    await post.increment('comments_count');

    // Get comment with user info
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user', // <-- TAMBAHKAN INI
        attributes: ['id', 'name', 'avatar_url']
      }]
    });

    res.status(201).json({
      success: true,
      data: {
        comment: commentWithUser
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private (Comment owner or post creator)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.commentId, {
      include: [{
        model: Post,
        attributes: ['id', 'creatorId']
      }]
    });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check permissions
    const isCommentOwner = comment.userId === req.user.id;
    const isPostCreator = comment.Post.creatorId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCommentOwner && !isPostCreator && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this comment' 
      });
    }

    await comment.destroy();

    // Decrement comment count
    await Post.decrement('comments_count', {
      where: { id: comment.postId }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
};

// @desc    Check if user has access to post
// @route   GET /api/posts/:id/access
// @access  Private
const checkPostAccess = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let hasAccess = true;
    let isSubscribed = false;

    if (post.visibility === 'subscribers_only') {
      if (!req.user) {
        hasAccess = false;
      } else {
        // Check if user is the creator
        if (req.user.id === post.creatorId) {
          hasAccess = true;
        } else {
          // Check if user is subscribed
          const subscription = await Subscription.findOne({
            where: {
              userId: req.user.id,
              creatorId: post.creatorId,
              status: 'active'
            }
          });
          
          hasAccess = !!subscription;
          isSubscribed = !!subscription;
        }
      }
    }

    res.json({
      success: true,
      data: {
        hasAccess,
        isSubscribed,
        postId: post.id,
        creatorId: post.creatorId
      }
    });
  } catch (error) {
    console.error('Check post access error:', error);
    res.status(500).json({ success: false, message: 'Error checking access' });
  }
};

// @desc    Increment post view count
// @route   POST /api/posts/:id/view
// @access  Public
const incrementViewCount = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await post.increment('view_count');

    res.json({
      success: true,
      data: {
        viewCount: post.view_count + 1
      }
    });
  } catch (error) {
    console.error('Increment view count error:', error);
    res.status(500).json({ success: false, message: 'Error incrementing view count' });
  }
};

// @desc    Get all public posts
// @route   GET /api/posts/public
// @access  Public
const getPublicPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { visibility: 'public', isPublished: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'avatar_url', 'is_verified']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get public posts error:', error);
    res.status(500).json({ success: false, message: 'Error fetching public posts' });
  }
};


module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostLikes,
  getPostComments,
  addComment,
  deleteComment,
  checkPostAccess,
  incrementViewCount,
  getPublicPosts,
};