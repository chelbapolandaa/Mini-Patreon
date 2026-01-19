import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { creatorAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1,
    perPage: 10
  });

  useEffect(() => {
    fetchPosts();
  }, [pagination.currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await creatorAPI.getMyPosts({
        page: pagination.currentPage,
        limit: pagination.perPage
      });
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await creatorAPI.deletePost(id);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <div className="p-1 bg-red-100 rounded">
            <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'file':
        return (
          <div className="p-1 bg-blue-100 rounded">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-1 bg-gray-100 rounded">
            <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
            <p className="text-gray-600 mt-2">Manage your published content</p>
          </div>
          
          <Link
            to="/creator/posts/create"
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Post
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Posts</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Public Posts</p>
                <p className="text-2xl font-bold">
                  {posts.filter(p => p.visibility === 'public').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <LockOpenIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Exclusive Posts</p>
                <p className="text-2xl font-bold">
                  {posts.filter(p => p.visibility === 'subscribers_only').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <LockClosedIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-6">Create your first post to share with your subscribers</p>
              <Link
                to="/creator/posts/create"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 inline-flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Post
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 font-medium text-gray-700">Post</div>
                  <div className="col-span-2 font-medium text-gray-700">Type</div>
                  <div className="col-span-2 font-medium text-gray-700">Visibility</div>
                  <div className="col-span-2 font-medium text-gray-700">Actions</div>
                </div>
              </div>

              {/* Posts List */}
              <div className="divide-y">
                {posts.map((post) => (
                  <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Post Info */}
                      <div className="col-span-6">
                        <div className="flex items-start">
                          {getTypeIcon(post.type)}
                          <div className="ml-3">
                            <h3 className="font-medium text-gray-900">{post.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {post.excerpt || post.content.substring(0, 100)}...
                            </p>
                            <div className="flex items-center text-xs text-gray-400 mt-2">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {formatDate(post.createdAt)}
                              <span className="mx-2">•</span>
                              <EyeIcon className="h-3 w-3 mr-1" />
                              {post.viewCount} views
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Type */}
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
                          {post.type}
                        </span>
                      </div>

                      {/* Visibility */}
                      <div className="col-span-2">
                        {post.visibility === 'public' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <LockOpenIcon className="h-3 w-3 mr-1" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <LockClosedIcon className="h-3 w-3 mr-1" />
                            Subscribers Only
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <div className="flex space-x-2">
                          {/* View Button */}
                          <Link
                            to={`/posts/${post.id}`}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          
                          {/* Edit Button */}
                          <Link
                            to={`/creator/posts/edit/${post.id}`}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.perPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.perPage, pagination.total)}
                      </span> of{' '}
                      <span className="font-medium">{pagination.total}</span> posts
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={pagination.currentPage === pagination.pages}
                        className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyPosts;