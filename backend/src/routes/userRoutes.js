const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Temporary basic routes
router.get('/profile', protect, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;