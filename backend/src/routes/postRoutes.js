const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostComments,
  addComment,
  deleteComment,
  getPostLikes,
  checkPostAccess,
  incrementViewCount
} = require('../controllers/postController');

// Public routes
router.get('/', getPosts);
router.get('/:id', getPostById);
router.get('/:id/comments', getPostComments);
router.get('/:id/likes', getPostLikes);
router.get('/:id/access', checkPostAccess);

// Protected routes (require authentication)
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.delete('/:id/like', protect, unlikePost);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/view', incrementViewCount);

// Creator only routes (for their own posts)
router.put('/:id/status', protect, authorize('creator'), updatePost);
router.get('/creator/my-posts', protect, authorize('creator'), getPosts);

module.exports = router;