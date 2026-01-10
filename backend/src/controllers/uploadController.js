const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = path.join(__dirname, '../../uploads/');
    
    if (file.mimetype.startsWith('video/')) {
      folder = path.join(folder, 'videos/');
    } else if (file.mimetype.startsWith('image/')) {
      folder = path.join(folder, 'images/');
    } else {
      folder = path.join(folder, 'files/');
    }
    
    // Create folder if doesn't exist
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept videos, images, and common document types
  const allowedMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// @desc    Upload single media file
// @route   POST /api/upload
// @access  Private
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate URL based on file type
    let fileUrl = '';
    if (req.file.mimetype.startsWith('video/')) {
      fileUrl = `/uploads/videos/${req.file.filename}`;
    } else if (req.file.mimetype.startsWith('image/')) {
      fileUrl = `/uploads/images/${req.file.filename}`;
    } else {
      fileUrl = `/uploads/files/${req.file.filename}`;
    }

    // Full URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullUrl = `${baseUrl}${fileUrl}`;

    res.status(201).json({
      success: true,
      data: {
        url: fullUrl,
        localUrl: fileUrl,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file'
    });
  }
};

// @desc    Upload multiple media files
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultipleMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const filesData = req.files.map(file => {
      let fileUrl = '';
      if (file.mimetype.startsWith('video/')) {
        fileUrl = `/uploads/videos/${file.filename}`;
      } else if (file.mimetype.startsWith('image/')) {
        fileUrl = `/uploads/images/${file.filename}`;
      } else {
        fileUrl = `/uploads/files/${file.filename}`;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fullUrl = `${baseUrl}${fileUrl}`;

      return {
        url: fullUrl,
        localUrl: fileUrl,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname
      };
    });

    res.status(201).json({
      success: true,
      data: {
        files: filesData,
        count: req.files.length
      }
    });
  } catch (error) {
    console.error('Upload multiple media error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading files'
    });
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Private
const deleteMedia = async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'files' } = req.query; // 'videos', 'images', or 'files'

    const allowedTypes = ['videos', 'images', 'files'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type'
      });
    }

    const filePath = path.join(__dirname, '../../uploads', type, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

module.exports = {
  upload,
  uploadMedia,
  uploadMultipleMedia,
  deleteMedia
};