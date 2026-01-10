import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { creatorAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  PaperClipIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    type: 'article',
    visibility: 'public',
    mediaUrls: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    const validFiles = Array.from(files).filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        // Create FormData for file upload
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        
        // In a real app, you would upload to your server or cloud storage
        // For now, we'll simulate and create object URLs
        const objectUrl = URL.createObjectURL(file);
        uploadedUrls.push(objectUrl);
        
        // Store file info for display
        setUploadedFiles(prev => [...prev, {
          id: Date.now() + i,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2),
          type: file.type,
          url: objectUrl,
          file: file
        }]);

        clearInterval(progressInterval);
        setUploadProgress(prev => prev + (100 / validFiles.length));
      }

      // Add uploaded URLs to form data
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...uploadedUrls]
      }));

      toast.success(`${validFiles.length} file(s) uploaded successfully`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index) => {
    const fileToRemove = uploadedFiles[index];
    if (fileToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would upload files to your server first
      // Then get the actual URLs and add them to formData
      
      const postData = {
        ...formData,
        // In production, replace with actual uploaded URLs
        mediaUrls: uploadedFiles.map(file => file.url)
      };
      
      await creatorAPI.createPost(postData);
      toast.success('Post created successfully!');
      navigate('/creator/posts');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = formData.content.length;

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-blue-500" />;
    } else if (fileType.startsWith('video/')) {
      return <VideoCameraIcon className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes('pdf')) {
      return <DocumentIcon className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <DocumentIcon className="h-5 w-5 text-blue-500" />;
    } else {
      return <PaperClipIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/creator/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
          <p className="text-gray-600 mt-2">Share your content with your subscribers</p>
          {user?.role === 'creator' && (
            <p className="text-sm text-blue-600 mt-1">Creating as: {user.name}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            {/* Post Type Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Post Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'article' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition duration-200 ${
                    formData.type === 'article'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <DocumentIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Article</span>
                  <span className="text-sm text-gray-500">Text-based content</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition duration-200 ${
                    formData.type === 'video'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <VideoCameraIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Video</span>
                  <span className="text-sm text-gray-500">Video content</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'file' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition duration-200 ${
                    formData.type === 'file'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <PhotoIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">File</span>
                  <span className="text-sm text-gray-500">PDF, images, etc</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                placeholder="Enter a compelling title"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Excerpt */}
            <div className="mb-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt (Optional)
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows="2"
                value={formData.excerpt}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                placeholder="Brief description of your post"
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.excerpt.length}/300 characters - This will be shown in post previews
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content *
                </label>
                <div className="text-sm text-gray-500">
                  {wordCount} words • {charCount} characters
                </div>
              </div>
              <textarea
                id="content"
                name="content"
                rows="12"
                required
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono transition duration-200"
                placeholder="Write your content here..."
              />
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Files (Optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                    Upload Files
                  </button>
                </div>
              </div>
              
              {/* Upload Progress */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Uploading...</span>
                    <span className="text-sm font-medium text-blue-600">{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 ? (
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.size} MB • {file.type.split('/')[1] || 'File'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.type.startsWith('image/') && (
                          <button
                            type="button"
                            onClick={() => window.open(file.url, '_blank')}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            Preview
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Image Preview Grid */}
                  {uploadedFiles.some(f => f.type.startsWith('image/')) && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Image Previews:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {uploadedFiles
                          .filter(f => f.type.startsWith('image/'))
                          .map((file, index) => (
                            <div key={file.id} className="relative group">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-200 rounded-lg flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeFile(uploadedFiles.findIndex(f => f.id === file.id))}
                                  className="opacity-0 group-hover:opacity-100 text-white bg-red-500 hover:bg-red-600 p-1 rounded-full transition duration-200"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Click to upload files</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports images, videos, PDF, Word documents (max 50MB each)
                  </p>
                  <div className="mt-4 flex justify-center space-x-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <PhotoIcon className="h-3 w-3 mr-1" />
                      Images
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <VideoCameraIcon className="h-3 w-3 mr-1" />
                      Videos
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <DocumentIcon className="h-3 w-3 mr-1" />
                      Documents
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Visibility</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                  className={`p-4 rounded-lg border-2 flex items-center transition duration-200 ${
                    formData.visibility === 'public'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-500">Visible to everyone</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visibility: 'subscribers_only' }))}
                  className={`p-4 rounded-lg border-2 flex items-center transition duration-200 ${
                    formData.visibility === 'subscribers_only'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Subscribers Only</div>
                    <div className="text-sm text-gray-500">Only for paying subscribers</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {formData.visibility === 'subscribers_only' ? (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 text-purple-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      This post will be locked for non-subscribers
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      This post will be visible to everyone
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/creator/posts')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      'Publish Post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;