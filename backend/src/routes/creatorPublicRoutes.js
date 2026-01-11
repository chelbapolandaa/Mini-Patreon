const express = require('express');
const router = express.Router();
const { getCreators, getCreatorProfile } = require('../controllers/creatorController');

// Public routes
router.get('/', getCreators);                // GET /api/creators?page=1&limit=12
router.get('/:id/profile', getCreatorProfile); // GET /api/creators/:id/profile

module.exports = router;
