const express = require('express');
const router = express.Router();
const { 
  getCreatorStats,
  createPost,
  getMyPosts,
  getPostById,
  createSubscriptionPlan,
  getMyPlans,
  updatePost,
  deletePost
} = require('../controllers/creatorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const Post = require('../models/Post');

// ================== Public route ==================
// Get published PUBLIC posts by creatorId
router.get('/:id/posts', async (req, res) => {
  try {
    const creatorId = req.params.id;
    const posts = await Post.findAll({
      where: {
        creator_id: creatorId,
        is_published: true,
      },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================== Protected routes (creator dashboard) ==================
router.use(protect);

// Dashboard routes
router.get('/dashboard/stats', authorize('creator'), getCreatorStats);

// Post routes (creator dashboard)
router.post('/posts', authorize('creator'), createPost);
router.get('/posts', authorize('creator'), getMyPosts);
router.get('/posts/:id', authorize('creator'), getPostById);
router.put('/posts/:id', authorize('creator'), updatePost);
router.delete('/posts/:id', authorize('creator'), deletePost);

// Subscription plan routes
router.post('/plans', authorize('creator'), createSubscriptionPlan);
router.get('/plans', authorize('creator'), getMyPlans);

module.exports = router;
