import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, subscriptionAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  EyeIcon,
  CalendarIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  FlagIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const fetchComments = useCallback(async () => {
    try {
      const response = await postAPI.getPostComments(id);
      if (response.data.success) {
        setComments(response.data.comments || response.data.data?.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    }
  }, [id]);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setCheckingAccess(true);
      
      const response = await postAPI.getPostById(id);
      
      if (!response.data.success) {
        toast.error('Post not found');
        navigate('/');
        return;
      }

      const postData = response.data.data?.post || response.data.post;
      const creatorData = response.data.data?.creator || response.data.creator;
      
      if (!postData) {
        toast.error('Post data not found');
        navigate('/');
        return;
      }
      
      setPost(postData);
      setCreator(creatorData);
      
      setLikeCount(postData.likes_count || postData.likesCount || 0);
      setCommentCount(postData.comments_count || postData.commentsCount || 0);
      
      if (user && postData.likes && Array.isArray(postData.likes)) {
        setLiked(postData.likes.includes(user.id));
      }
      
      if (user && postData.bookmarks && Array.isArray(postData.bookmarks)) {
        setBookmarked(postData.bookmarks.includes(user.id));
      }
      
      let accessGranted = false;
      let subscriptionStatus = false;
      
      if (user && user.id === postData.creatorId) {
        accessGranted = true;
        subscriptionStatus = true;
      } else if (postData.visibility === 'public') {
        accessGranted = true;
        if (user && creatorData?.id) {
          try {
            const subResponse = await subscriptionAPI.checkSubscriptionStatus(creatorData.id);
            subscriptionStatus = subResponse.data.isSubscribed || false;
          } catch (subError) {
            console.log('Subscription check failed');
          }
        }
      } else if (postData.visibility === 'subscribers_only') {
        if (!user) {
          accessGranted = false;
        } else {
          try {
            const accessResponse = await subscriptionAPI.checkSubscriptionStatus(creatorData.id);
            accessGranted = accessResponse.data.isSubscribed || false;
            subscriptionStatus = accessGranted;
          } catch (accessError) {
            console.log('Access check failed:', accessError.message);
            accessGranted = false;
          }
        }
      }
      
      setHasAccess(accessGranted);
      setIsSubscribed(subscriptionStatus);
      
      if (accessGranted) {
        await fetchComments();
      }
      
    } catch (error) {
      console.error('Fetch post error:', error);
      
      if (error.response?.status === 403) {
        setHasAccess(false);
        try {
          const postResponse = await postAPI.getPostById(id);
          if (postResponse.data.success) {
            const postData = postResponse.data.data?.post || postResponse.data.post;
            const creatorData = postResponse.data.data?.creator || postResponse.data.creator;
            setPost(postData);
            setCreator(creatorData);
            setLikeCount(postData.likes_count || postData.likesCount || 0);
            setCommentCount(postData.comments_count || postData.commentsCount || 0);
          }
        } catch (err) {
          console.log('Could not fetch creator info');
        }
      } else if (error.response?.status === 404) {
        toast.error('Post not found');
        navigate('/');
      } else {
        toast.error('Failed to load post');
      }
    } finally {
      setLoading(false);
      setCheckingAccess(false);
    }
  }, [id, user, navigate, fetchComments]);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id, fetchPost]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      navigate('/login');
      return;
    }

    if (!hasAccess) {
      toast.error('You need access to like this post');
      return;
    }

    try {
      if (liked) {
        await postAPI.unlikePost(id);
        setLiked(false);
        setLikeCount(prev => prev - 1);
        toast.success('Post unliked');
      } else {
        await postAPI.likePost(id);
        setLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('Post liked!');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to update like');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error('Please login to bookmark posts');
      navigate('/login');
      return;
    }

    if (!hasAccess) {
      toast.error('You need access to bookmark this post');
      return;
    }

    try {
      if (bookmarked) {
        setBookmarked(false);
        toast.success('Removed from bookmarks');
      } else {
        setBookmarked(true);
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleReport = () => {
    if (!user) {
      toast.error('Please login to report posts');
      navigate('/login');
      return;
    }
    
    if (!hasAccess) {
      toast.error('You need access to report this post');
      return;
    }
    
    toast.success('Report submitted');
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to comment');
      navigate('/login');
      return;
    }

    if (!hasAccess) {
      toast.error('You need access to comment on this post');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setPostingComment(true);
    try {
      const response = await postAPI.addComment(id, {
        content: newComment.trim()
      });

      if (response.data.success) {
        setNewComment('');
        await fetchComments();
        setCommentCount(prev => prev + 1);
        toast.success('Comment posted');
      }
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      toast.error('Please login to subscribe');
      navigate('/login');
      return;
    }

    if (creator) {
      navigate(`/creators/${creator.id}?subscribe=true`);
    }
  };

  const handleRefreshAccess = async () => {
    if (!user || !creator) {
      toast.error('Please login first');
      return;
    }

    try {
      setCheckingAccess(true);
      const subscribed = await subscriptionAPI.checkSubscriptionStatus(creator.id);
      
      if (subscribed.data.isSubscribed) {
        setHasAccess(true);
        setIsSubscribed(true);
        await fetchPost();
        toast.success('Access granted!');
      } else {
        toast.error('You are not subscribed to this creator');
      }
    } catch (error) {
      console.error('Refresh access error:', error);
      toast.error('Failed to check subscription status');
    } finally {
      setCheckingAccess(false);
    }
  };

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

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // FUNGSI GET MEDIA URLS - YANG DIPERBAIKI
  const getMediaUrls = () => {
    if (!post) {
      console.log('Post is null');
      return [];
    }
    
    console.log('Post data for media:', post);
    
    // CASE 1: Jika fieldnya mediaUrls (array) dari response API
    if (post.mediaUrls && Array.isArray(post.mediaUrls)) {
      console.log('Using mediaUrls (array):', post.mediaUrls);
      
      const validUrls = post.mediaUrls.filter(url => {
        if (!url || typeof url !== 'string') return false;
        if (url.startsWith('blob:')) {
          console.log('Skipping blob URL:', url);
          return false;
        }
        return true;
      }).map(url => {
        // Untuk video, gunakan API endpoint baru
        if (post.type === 'video') {
          const filename = url.split('/').pop();
          if (filename) {
            return `http://localhost:5000/api/videos/${filename}`;
          }
        }
        return url;
      });
      
      console.log('Valid media URLs:', validUrls);
      return validUrls;
    }
    
    // CASE 2: Jika fieldnya media_url (string) dari database
    if (post.media_url && typeof post.media_url === 'string') {
      console.log('Using media_url (string):', post.media_url);
      
      if (post.media_url.startsWith('blob:')) {
        console.log('⚠️ WARNING: This is a blob URL (old data)');
        return [];
      }
      
      // Untuk video, gunakan API endpoint baru
      if (post.type === 'video') {
        const filename = post.media_url.split('/').pop();
        if (filename) {
          return [`http://localhost:5000/api/videos/${filename}`];
        }
      }
      
      return [post.media_url];
    }
    
    console.log('⚠️ No valid media found in post');
    return [];
  };

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess && post && post.visibility === 'subscribers_only') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="max-w-2xl mx-auto text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <LockClosedIcon className="h-16 w-16 text-purple-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Exclusive Content</h1>
            
            <p className="text-lg text-gray-600 mb-6">
              This post is only available to subscribers of{' '}
              <span className="font-semibold text-purple-600">
                {creator?.name || 'this creator'}
              </span>
            </p>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post?.title}</h3>
                {post?.excerpt && (
                  <p className="text-gray-600 italic mb-4">"{post.excerpt}"</p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {post?.view_count || 0} views • 
                  <HeartIcon className="h-4 w-4 mx-1" />
                  {post?.likes_count || 0} likes • 
                  <ChatBubbleLeftIcon className="h-4 w-4 mx-1" />
                  {post?.comments_count || 0} comments
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {creator && (
                <>
                  <button
                    onClick={handleSubscribe}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    Subscribe to {creator.name}
                  </button>
                  
                  {user && (
                    <button
                      onClick={handleRefreshAccess}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-xl transition duration-200"
                    >
                      I've Already Subscribed - Refresh Access
                    </button>
                  )}
                  
                  <Link
                    to={`/creators/${creator.id}`}
                    className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-4 px-6 rounded-xl border-2 border-gray-200 transition duration-200 inline-block"
                  >
                    View Creator Profile
                  </Link>
                </>
              )}
              
              <button
                onClick={() => navigate('/creators')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition duration-200"
              >
                Browse Other Creators
              </button>
            </div>

            <p className="mt-8 text-sm text-gray-500">
              Already a subscriber?{' '}
              {user ? (
                <button
                  onClick={handleRefreshAccess}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Refresh access
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Log in to access
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const mediaUrls = getMediaUrls();

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Post Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
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
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {post.type || 'article'}
                    </span>
                    {isSubscribed && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                        Subscribed
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {post.title || 'Untitled Post'}
                  </h1>
                  
                  {/* Creator Info */}
                  {creator && (
                    <div className="flex items-center space-x-4 mt-6">
                      <Link to={`/creators/${creator.id}`} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          {creator.avatar_url || creator.avatar ? (
                            <img 
                              src={creator.avatar_url || creator.avatar} 
                              alt={creator.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 hover:text-blue-600 transition">
                            {creator.name}
                            {creator.is_verified && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                ✓ Verified
                              </span>
                            )}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDate(post.created_at || post.createdAt || post.created_at)}
                            <span className="mx-2">•</span>
                            <EyeIcon className="h-4 w-4 mr-1" />
                            {(post.view_count || post.viewCount || 0).toLocaleString()} views
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  {user?.id === post.creatorId && (
                    <button
                      onClick={() => navigate(`/creator/posts/edit/${post.id}`)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 inline-flex items-center"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
              {/* Excerpt */}
              {post.excerpt && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-5 mb-8 rounded-r-lg">
                  <p className="text-lg font-medium text-gray-800">"{post.excerpt}"</p>
                </div>
              )}

              {/* Media Display - BAGIAN YANG DIPERBAIKI */}
              {mediaUrls.length > 0 ? (
                <div className="mb-8">
                  {post.type === 'video' ? (
                    <div className="w-full bg-black rounded-xl overflow-hidden shadow-xl mb-4">
                      <video 
                        src={mediaUrls[0]} 
                        controls 
                        className="w-full h-auto max-h-[70vh]"
                        controlsList="nodownload"
                        crossOrigin="anonymous"
                        preload="metadata"
                        onError={(e) => {
                          console.error('Video load error:', e);
                          console.error('Video src:', mediaUrls[0]);
                        }}
                      >
                        Your browser does not support the video tag.
                        <source src={mediaUrls[0]} type="video/mp4" />
                      </video>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {mediaUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Post media ${index + 1}`}
                            className="rounded-xl shadow-md w-full h-auto object-cover max-h-[70vh]"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-200 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-8 bg-gray-100 rounded-xl p-12 text-center">
                  <p className="text-gray-500">No media available</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t mb-8">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 ${liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
                  >
                    {liked ? (
                      <HeartIconSolid className="h-6 w-6" />
                    ) : (
                      <HeartIcon className="h-6 w-6" />
                    )}
                    <span className="font-medium">{likeCount.toLocaleString()}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <ChatBubbleLeftIcon className="h-6 w-6" />
                    <span className="font-medium">{commentCount.toLocaleString()}</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
                  >
                    <ShareIcon className="h-6 w-6" />
                    <span className="font-medium">Share</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBookmark}
                    className={`p-2 rounded-full ${bookmarked ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
                    title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {bookmarked ? (
                      <BookmarkIconSolid className="h-6 w-6" />
                    ) : (
                      <BookmarkIcon className="h-6 w-6" />
                    )}
                  </button>
                  
                  <button
                    onClick={handleReport}
                    className="p-2 rounded-full text-gray-600 hover:text-red-600 hover:bg-gray-100"
                    title="Report post"
                  >
                    <FlagIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-800 whitespace-pre-line leading-relaxed text-lg">
                  {post.content || (
                    <p className="text-gray-500 italic">No content available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <ChatBubbleLeftIcon className="h-6 w-6 mr-2" />
                Comments ({commentCount})
              </h3>

              {/* Add Comment */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        {user.avatar_url || user.avatar ? (
                          <img 
                            src={user.avatar_url || user.avatar} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        maxLength={1000}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">
                          {newComment.length}/1000 characters
                        </span>
                        <button
                          type="submit"
                          disabled={postingComment || !newComment.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {postingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                  <p className="text-gray-600 mb-3">
                    Please login to leave a comment
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
                  >
                    Login
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {comment.user?.avatar_url || comment.user?.avatar ? (
                            <img 
                              src={comment.user.avatar_url || comment.user.avatar} 
                              alt={comment.user?.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium text-gray-900">
                                {comment.user?.name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatTimeAgo(comment.created_at || comment.createdAt)}
                              </span>
                            </div>
                            {comment.user?.id === user?.id && (
                              <button className="text-xs text-gray-500 hover:text-red-600">
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-gray-800">{comment.content}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600">
                              <HandThumbUpIcon className="h-4 w-4" />
                              <span>{comment.likes || 0}</span>
                            </button>
                            <button className="text-sm text-gray-500 hover:text-gray-700">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Creator Card */}
            {creator && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    {creator.avatar_url || creator.avatar ? (
                      <img 
                        src={creator.avatar_url || creator.avatar} 
                        alt={creator.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-8 w-8 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{creator.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mr-2">
                        {creator.total_subscribers || 0} subscribers
                      </span>
                      {creator.is_verified && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {creator.bio && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {creator.bio}
                  </p>
                )}
                
                <div className="space-y-2">
                  {!isSubscribed && (
                    <button
                      onClick={handleSubscribe}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-4 rounded-lg transition duration-200 text-center"
                    >
                      Subscribe
                    </button>
                  )}
                  
                  <Link
                    to={`/creators/${creator.id}`}
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition duration-200 text-center"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Related Posts */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">More from this creator</h3>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-gray-500">No other posts available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;