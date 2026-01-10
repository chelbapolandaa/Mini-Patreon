import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { creatorAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    type: 'article',
    visibility: 'public',
    mediaUrls: []
  });

  // Fix ESLint warning
  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await creatorAPI.getPostById(id);
      console.log('Post data received:', response.data);
      
      // Extract post data from response
      const postData = response.data.post || response.data.data?.post || response.data;
      
      if (postData) {
        setFormData({
          title: postData.title || '',
          content: postData.content || '',
          excerpt: postData.excerpt || '',
          type: postData.type || 'article',
          visibility: postData.visibility || 'public',
          mediaUrls: postData.mediaUrls || postData.media_urls || []
        });
      } else {
        toast.error('Post not found');
        navigate('/creator/posts');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/creator/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      console.log('Updating post with data:', formData);
      await creatorAPI.updatePost(id, formData);
      toast.success('Post updated successfully!');
      navigate('/creator/posts');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = formData.content.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/creator/posts')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Posts
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
          <p className="text-gray-600 mt-2">Update your content and settings</p>
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
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${
                    formData.type === 'article'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <DocumentIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Article</span>
                  <span className="text-sm text-gray-500">Text-based content</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${
                    formData.type === 'video'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <VideoCameraIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Video</span>
                  <span className="text-sm text-gray-500">Video content</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'file' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${
                    formData.type === 'file'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                placeholder="Write your content here..."
              />
            </div>

            {/* Media URLs */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Media URLs (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt('Enter media URL (image, video, etc):');
                    if (url) {
                      setFormData(prev => ({
                        ...prev,
                        mediaUrls: [...prev.mediaUrls, url]
                      }));
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Media URL
                </button>
              </div>
              
              {formData.mediaUrls.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No media URLs added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add image or video URLs for your post</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.mediaUrls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1 truncate">
                        <span className="text-sm text-gray-700">{url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
                          }));
                        }}
                        className="ml-3 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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
                  className={`p-4 rounded-lg border-2 flex items-center ${
                    formData.visibility === 'public'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
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
                  className={`p-4 rounded-lg border-2 flex items-center ${
                    formData.visibility === 'subscribers_only'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
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
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200 flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Post'
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

export default EditPost;