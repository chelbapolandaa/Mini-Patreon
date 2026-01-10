import React, { useState, useEffect, useCallback } from 'react'; // ← TAMBAHKAN useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  EyeIcon,
  CalendarIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserIcon
} from '@heroicons/react/24/outline';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postAPI.getPostById(id);
      
      console.log('Post response:', response.data); // Debug
      
      if (response.data.success) {
        setPost(response.data.post || response.data.data?.post);
        setCreator(response.data.creator || response.data.data?.creator);
        setHasAccess(response.data.hasAccess || response.data.data?.hasAccess !== false);
      } else {
        setError('Post not found');
      }
    } catch (error) {
      console.error('Fetch post error:', error);
      
      if (error.response?.status === 403) {
        setHasAccess(false);
        setError('This post is for subscribers only');
      } else if (error.response?.status === 404) {
        setError('Post not found');
      } else {
        setError('Failed to load post');
        toast.error('Failed to load post');
      }
    } finally {
      setLoading(false);
    }
  }, [id]); // ← TAMBAHKAN DEPENDENCY

  useEffect(() => {
    fetchPost();
  }, [fetchPost]); // ← PERBAIKI INI

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No access state
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LockClosedIcon className="h-12 w-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Exclusive Content</h2>
          <p className="text-gray-600 mb-6">
            This post is only available to subscribers. 
            Subscribe to {creator?.name || 'this creator'} to get access to all exclusive content.
          </p>
          <div className="space-y-3">
            {creator && (
              <button
                onClick={() => navigate(`/creator/${creator.id}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
              >
                Subscribe to {creator.name}
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content - check if post exists
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Post Not Found</h2>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Post Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
            <div className="flex-1">
              {/* Visibility Badges */}
              <div className="flex items-center space-x-2 mb-4">
                {post.visibility === 'public' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <LockOpenIcon className="h-3 w-3 mr-1" />
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    Subscribers Only
                  </span>
                )}
                {post.type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {post.type}
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title || 'Untitled Post'}</h1>
              
              {/* Creator Info */}
              {creator && (
                <div className="flex items-center space-x-4 mt-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    {creator.avatarUrl ? (
                      <img 
                        src={creator.avatarUrl} 
                        alt={creator.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{creator.name}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(post.createdAt || post.created_at)}
                      {post.viewCount !== undefined && (
                        <>
                          <span className="mx-2">•</span>
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {post.viewCount || 0} views
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Edit Button (for creator only) */}
            {post.isOwner && (
              <button
                onClick={() => navigate(`/creator/posts/edit/${post.id}`)}
                className="mt-4 md:mt-0 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 inline-flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Post
              </button>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
          {/* Excerpt */}
          {post.excerpt && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <p className="text-lg italic text-gray-700">"{post.excerpt}"</p>
            </div>
          )}

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mb-8">
              {post.type === 'video' ? (
                <div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg overflow-hidden">
                  <video 
                    src={post.mediaUrls[0]} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.mediaUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className="rounded-lg shadow-md w-full h-auto object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }} />
            ) : (
              <p className="text-gray-500 italic">No content available.</p>
            )}
          </div>
        </div>

        {/* Author Bio */}
        {creator?.bio && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">About the Creator</h3>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                {creator.avatarUrl ? (
                  <img 
                    src={creator.avatarUrl} 
                    alt={creator.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{creator.name}</h4>
                <p className="text-gray-700 mt-2">{creator.bio}</p>
                <button
                  onClick={() => navigate(`/creator/${creator.id}`)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Creator Profile →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostDetail;