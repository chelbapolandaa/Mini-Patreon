import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon, 
  CalendarDaysIcon, 
  CreditCardIcon,
  PlusCircleIcon,
  ChartBarIcon,
  UsersIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

function Dashboard() {
  const { user, logout } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalSpent: 0,
    upcomingRenewals: 0
  });

  useEffect(() => {
    if (user?.role === 'user') {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getMySubscriptions();
      console.log('Subscriptions response:', response.data);
      
      if (response.data.success) {
        const subs = response.data.subscriptions || [];
        setSubscriptions(subs);
        
        // Calculate stats
        const activeSubs = subs.filter(sub => sub.status === 'active');
        const totalSpent = activeSubs.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
        
        // Count upcoming renewals (within 7 days)
        const now = new Date();
        const upcomingRenewals = activeSubs.filter(sub => {
          if (!sub.endDate) return false;
          const endDate = new Date(sub.endDate);
          const daysUntilRenewal = (endDate - now) / (1000 * 60 * 60 * 24);
          return daysUntilRenewal <= 7 && daysUntilRenewal > 0;
        }).length;
        
        setStats({
          activeSubscriptions: activeSubs.length,
          totalSpent: totalSpent,
          upcomingRenewals: upcomingRenewals
        });
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      await subscriptionAPI.cancelSubscription(subscriptionId);
      toast.success('Subscription cancelled successfully');
      fetchSubscriptions(); // Refresh list
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                <p className="text-gray-600 capitalize">You are a {user?.role}</p>
                {user?.role === 'user' && subscriptions.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Supporting {stats.activeSubscriptions} creator{stats.activeSubscriptions !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link 
                to="/profile" 
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Edit Profile
              </Link>
              <button
                onClick={logout}
                className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="text-2xl font-bold capitalize">{user?.role}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <UserCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-lg font-medium text-gray-900">
                  {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CalendarDaysIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          
          {user?.role === 'user' && (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <UsersIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Monthly Total</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <CreditCardIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Role-specific Dashboard */}
        {user?.role === 'creator' ? (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Creator Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Link 
                to="/creator/posts/create"
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition duration-200 cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  <PlusCircleIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Post</h3>
                <p className="text-gray-600 text-sm">Share content with your subscribers</p>
              </Link>
              
              <Link 
                to="/creator/plans"
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 hover:bg-green-50 transition duration-200 cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  <ChartBarIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Plans</h3>
                <p className="text-gray-600 text-sm">Set up subscription plans</p>
              </Link>
              
              <Link 
                to="/creator/subscribers"
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 hover:bg-purple-50 transition duration-200 cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  <UsersIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscribers</h3>
                <p className="text-gray-600 text-sm">Manage your subscriber list</p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Subscriptions</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading subscriptions...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <UsersIcon className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No subscriptions yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start supporting your favorite creators and get exclusive access to their content
                </p>
                <Link 
                  to="/creators" 
                  className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                >
                  Browse Creators
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => {
                  const daysLeft = calculateDaysLeft(subscription.endDate);
                  return (
                    <div key={subscription.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition duration-200">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-start space-x-4 mb-4 md:mb-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                            {subscription.creator?.avatarUrl ? (
                              <img 
                                src={subscription.creator.avatarUrl} 
                                alt={subscription.creator.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl font-bold text-purple-600">
                                {subscription.creator?.name?.charAt(0) || 'C'}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{subscription.creator?.name || 'Unknown Creator'}</h3>
                            <p className="text-gray-600">{subscription.plan?.name || 'Subscription Plan'}</p>
                            <div className="flex items-center mt-2 space-x-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {getStatusIcon('active')}
                                <span className="ml-1">Active</span>
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatCurrency(subscription.amount)} / {subscription.plan?.interval || 'month'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:items-end">
                          <div className="text-sm text-gray-500 mb-2">
                            Started: {formatDate(subscription.startDate)}
                          </div>
                          {subscription.endDate && (
                            <div className={`text-sm mb-4 ${
                              daysLeft <= 7 ? 'text-orange-600 font-medium' : 'text-gray-500'
                            }`}>
                              {daysLeft > 0 ? (
                                <>Renews in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</>
                              ) : daysLeft === 0 ? (
                                <>Renews today</>
                              ) : (
                                <>Expired {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} ago</>
                              )}
                            </div>
                          )}
                          <div className="flex space-x-4">
                            <Link
                              to={`/creator/${subscription.creator?.id}`}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                            >
                              View Creator
                              <ArrowRightIcon className="h-4 w-4 ml-1" />
                            </Link>
                            {subscription.status === 'active' && (
                              <button
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="text-red-600 hover:text-red-700 font-medium text-sm"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                to="/creators" 
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition duration-200"
              >
                <span className="font-medium">Browse Creators</span>
                <ArrowRightIcon className="h-5 w-5 text-blue-600" />
              </Link>
              {user?.role === 'user' && (
                <Link 
                  to="/subscriptions/my" 
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition duration-200"
                >
                  <span className="font-medium">Manage Subscriptions</span>
                  <ArrowRightIcon className="h-5 w-5 text-blue-600" />
                </Link>
              )}
              <Link 
                to="/profile" 
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition duration-200"
              >
                <span className="font-medium">Account Settings</span>
                <ArrowRightIcon className="h-5 w-5 text-blue-600" />
              </Link>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
            {user?.role === 'user' && subscriptions.length > 0 ? (
              <div className="space-y-3">
                {subscriptions.slice(0, 3).map((sub, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{sub.creator?.name}</p>
                      <p className="text-sm text-gray-500">{formatDate(sub.startDate)}</p>
                    </div>
                    <div className="font-bold">{formatCurrency(sub.amount)}</div>
                  </div>
                ))}
                {subscriptions.length > 3 && (
                  <Link to="/subscriptions/my" className="text-center block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View all {subscriptions.length} transactions
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">No payment history yet</p>
                <Link to="/creators" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                  Start your first subscription
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-900 text-gray-100 rounded-xl">
            <details>
              <summary className="font-medium cursor-pointer">Debug Information</summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">User Data:</h4>
                  <pre className="text-xs bg-gray-800 p-3 rounded overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Subscriptions ({subscriptions.length}):</h4>
                  <pre className="text-xs bg-gray-800 p-3 rounded overflow-auto">
                    {JSON.stringify(subscriptions, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;