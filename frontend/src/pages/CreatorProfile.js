import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  CheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [plans, setPlans] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' atau 'posts'

  const fetchCreatorProfile = useCallback(async () => {
    try {
      if (!id) return;
      setLoading(true);
      const response = await subscriptionAPI.getCreatorProfile(id);
      setCreator(response.data.data);
      setPlans(response.data.data.plans || []);
      setIsSubscribed(response.data.isSubscribed || false);
    } catch (error) {
      toast.error('Failed to load creator profile');
      console.error('Error fetching creator profile:', error);
      navigate('/creators');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchCreatorPosts = useCallback(async () => {
    try {
      const response = await subscriptionAPI.getCreatorPosts(id);
      setPosts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load posts');
      console.error('Error fetching posts:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchCreatorProfile();
  }, [fetchCreatorProfile]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchCreatorPosts();
    }
  }, [activeTab, fetchCreatorPosts]);

  const handleSubscribe = async (plan) => {
    setSelectedPlan(plan);
    try {
      const response = await subscriptionAPI.initializeSubscription({
        planId: plan.id
      });
      window.location.href = response.data.data.redirectUrl;
    } catch (error) {
      toast.error('Failed to initialize subscription');
      console.error('Error subscribing:', error);
      setSelectedPlan(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Creator not found</h3>
          <button
            onClick={() => navigate('/creators')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Creators
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
          onClick={() => navigate('/creators')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Creators
        </button>

        {/* Creator Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex items-center space-x-4 mb-6 md:mb-0 md:flex-1">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                {creator.avatar_url ? (
                  <img 
                    src={creator.avatar_url} 
                    alt={creator.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">
                    {creator.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{creator.name}</h1>
                <p className="text-gray-600">Content Creator</p>
                {creator.bio && (
                  <p className="text-gray-700 mt-2 max-w-2xl">{creator.bio}</p>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{creator.stats?.subscribers || 0}</div>
                <div className="text-sm text-gray-500">Subscribers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{creator.stats?.totalPosts || 0}</div>
                <div className="text-sm text-gray-500">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{creator.stats?.publicPosts || 0}</div>
                <div className="text-sm text-gray-500">Public Posts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        {isSubscribed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">You're subscribed to this creator!</p>
                <p className="text-sm text-green-600">You have access to all exclusive content.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'plans' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'posts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Posts
          </button>
        </div>
        {/* Conditional Render */}
        {activeTab === 'plans' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Plans</h2>
            {plans.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <CurrencyDollarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscription plans yet</h3>
                <p className="text-gray-600">This creator hasn't set up any subscription plans.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-xl shadow-md border-2 overflow-hidden ${
                      selectedPlan?.id === plan.id ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <div className="p-6">
                      {/* Plan Header */}
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-gray-600 mb-4">{plan.description}</p>
                        )}
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-gray-500 ml-2">/ {plan.interval}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
                        <ul className="space-y-2">
                          {Array.isArray(plan.features) && plan.features.length > 0 ? (
                            plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-400">No features specified</li>
                          )}
                        </ul>
                      </div>

                      {/* Subscribe Button */}
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isSubscribed || !!selectedPlan}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
                          isSubscribed
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : selectedPlan?.id === plan.id
                            ? 'bg-blue-600 text-white opacity-50 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isSubscribed ? (
                          'Already Subscribed'
                        ) : selectedPlan?.id === plan.id ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Redirecting to Payment...
                          </div>
                        ) : (
                          `Subscribe ${plan.interval === 'yearly' ? 'Annually' : 'Monthly'}`
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Creator Posts</h2>
            {posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">This creator hasn't published any posts.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          post.visibility === 'public'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {post.visibility === 'public' ? 'Public' : 'Subscribers only'}
                      </span>
                    </div>
                    {post.excerpt ? (
                      <p className="text-gray-700">{post.excerpt}</p>
                    ) : (
                      <p className="text-gray-700 line-clamp-3">{post.content}</p>
                    )}

                    {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {post.mediaUrls.slice(0, 6).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`media-${idx}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/posts/${post.id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View details
                      </button>
                      <div className="text-sm text-gray-500">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID') : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatorProfile;
