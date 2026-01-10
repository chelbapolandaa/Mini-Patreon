const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadMedia, 
  uploadMultipleMedia,
  deleteMedia 
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Upload single file
router.post('/', protect, upload.single('file'), uploadMedia);

// Upload multiple files
router.post('/multiple', protect, upload.array('files', 10), uploadMultipleMedia);

// Delete file
router.delete('/:filename', protect, deleteMedia);

module.exports = router;