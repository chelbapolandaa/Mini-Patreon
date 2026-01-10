const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPosts, getPostById } = require('../controllers/postController');

router.get('/', getPosts);
router.get('/:id', getPostById);

module.exports = router;