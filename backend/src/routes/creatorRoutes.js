const express = require('express');
const router = express.Router();
const { 
  getCreatorStats,
  createPost,
  getMyPosts,
  createSubscriptionPlan,
  getMyPlans,
  updatePost,
  deletePost
} = require('../controllers/creatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply protect middleware to all routes
router.use(protect);

// Dashboard routes
router.get('/dashboard/stats', authorize('creator'), getCreatorStats);

// Post routes
router.post('/posts', authorize('creator'), createPost);
router.get('/posts', authorize('creator'), getMyPosts);
router.put('/posts/:id', authorize('creator'), updatePost);
router.delete('/posts/:id', authorize('creator'), deletePost);

// Subscription plan routes
router.post('/plans', authorize('creator'), createSubscriptionPlan);
router.get('/plans', authorize('creator'), getMyPlans);

module.exports = router;