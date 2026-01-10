// utils/uploadHelper.js

/**
 * Upload file(s) to server
 * @param {File|File[]} files - Single file or array of files
 * @returns {Promise<string|string[]>} URL or array of URLs
 */
export const uploadMedia = async (files) => {
  try {
    if (!files) {
      throw new Error('No files provided');
    }

    const formData = new FormData();
    
    if (Array.isArray(files)) {
      // Multiple files
      files.forEach(file => {
        if (!(file instanceof File)) {
          throw new Error('Invalid file object');
        }
        formData.append('files', file);
      });
    } else {
      // Single file
      if (!(files instanceof File)) {
        throw new Error('Invalid file object');
      }
      formData.append('file', files);
    }

    // Gunakan uploadAPI yang sudah diperbaiki
    const { uploadAPI } = await import('../api');
    
    let response;
    if (Array.isArray(files)) {
      response = await uploadAPI.uploadMultipleFiles(formData);
      return response.data.files.map(file => file.url);
    } else {
      response = await uploadAPI.uploadFile(formData);
      return response.data.url;
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload file');
  }
};

/**
 * Validate file before upload
 * @param {File} file 
 * @returns {boolean}
 */
export const validateFile = (file) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
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

  if (file.size > maxSize) {
    throw new Error('File size exceeds 100MB limit');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported');
  }

  return true;
};

/**
 * Extract filename from URL
 * @param {string} url 
 * @returns {string}
 */
export const getFilenameFromUrl = (url) => {
  return url.split('/').pop();
};

/**
 * Get file type from URL or mime type
 * @param {string} url 
 * @param {string} mimeType 
 * @returns {string}
 */
export const getFileType = (url, mimeType = '') => {
  if (mimeType) {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
  }
  
  // Fallback based on extension
  const ext = url.split('.').pop().toLowerCase();
  const videoExts = ['mp4', 'mpeg', 'mov', 'webm', 'avi'];
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];
  
  if (videoExts.includes(ext)) return 'video';
  if (imageExts.includes(ext)) return 'image';
  if (audioExts.includes(ext)) return 'audio';
  
  return 'document';
};