import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { creatorAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState({
    title: '',
    content: '',
    excerpt: '',
    type: 'article',
    visibility: 'public',
    mediaUrls: []
  });

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await creatorAPI.getPostById(id);
      setPost(response.data.post);
    } catch (error) {
      toast.error('Failed to load post');
      console.error('Error fetching post:', error);
      navigate('/creator/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPost(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!post.title || !post.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      await creatorAPI.updatePost(id, post);
      toast.success('Post updated successfully');
      navigate('/creator/posts');
    } catch (error) {
      toast.error('Failed to update post');
      console.error('Error updating post:', error);
    } finally {
      setSaving(false);
    }
  };

  const addMediaUrl = () => {
    const url = window.prompt('Enter media URL:');
    if (url) {
      setPost(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, url]
      }));
    }
  };

  const removeMediaUrl = (index) => {
    setPost(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }));
  };

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
        {/* Back Button */}
        <button
          onClick={() => navigate('/creator/posts')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Posts
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
            <p className="text-gray-600 mt-2">Update your post content and settings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Post Details */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Post Details</h2>
            
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={post.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter post title"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={post.content}
                  onChange={handleChange}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your post content here..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  {post.content.length} characters
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt (Optional)
                </label>
                <textarea
                  name="excerpt"
                  value={post.excerpt}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief summary of your post"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Leave empty to auto-generate from content
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Post Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Post Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Post Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'article', icon: DocumentIcon, label: 'Article' },
                    { value: 'video', icon: VideoCameraIcon, label: 'Video' },
                    { value: 'file', icon: PhotoIcon, label: 'File' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setPost(prev => ({ ...prev, type: type.value }))}
                      className={`p-4 border rounded-lg flex flex-col items-center justify-center transition duration-200 ${
                        post.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <type.icon className={`h-6 w-6 mb-2 ${
                        post.type === type.value ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Visibility
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPost(prev => ({ ...prev, visibility: 'public' }))}
                    className={`w-full p-4 border rounded-lg flex items-center transition duration-200 ${
                      post.visibility === 'public'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mr-3">
                      <EyeIcon className={`h-5 w-5 ${
                        post.visibility === 'public' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Public</div>
                      <div className="text-sm text-gray-500">Visible to everyone</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPost(prev => ({ ...prev, visibility: 'subscribers_only' }))}
                    className={`w-full p-4 border rounded-lg flex items-center transition duration-200 ${
                      post.visibility === 'subscribers_only'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 mr-3">
                      <EyeSlashIcon className={`h-5 w-5 ${
                        post.visibility === 'subscribers_only' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Subscribers Only</div>
                      <div className="text-sm text-gray-500">Only for your subscribers</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Media URLs */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Media URLs
                </label>
                <button
                  type="button"
                  onClick={addMediaUrl}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Media
                </button>
              </div>
              
              {post.mediaUrls.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No media added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {post.mediaUrls.map((url, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 truncate">
                        <span className="text-sm text-gray-700">{url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMediaUrl(index)}
                        className="ml-3 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/creator/posts')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                'Update Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPost;