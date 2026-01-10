import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { creatorAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

function CreatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    subscribers: 0,
    earnings: 0,
    posts: 0,
    views: 0
  });
  const [recentSubscribers, setRecentSubscribers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatorStats();
  }, []);

  const fetchCreatorStats = async () => {
    try {
      setLoading(true);
      const response = await creatorAPI.getCreatorStats();
      setStats(response.data.stats);
      setRecentSubscribers(response.data.recentSubscribers || []);
      setRecentTransactions(response.data.recentTransactions || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Error fetching stats:', error);
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}! Here's your performance overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Subscribers</p>
                <p className="text-2xl font-bold">{stats.subscribers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.earnings)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Posts</p>
                <p className="text-2xl font-bold">{stats.posts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg mr-4">
                <EyeIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold">{stats.views}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/creator/posts/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition duration-200 flex flex-col items-center justify-center"
            >
              <DocumentTextIcon className="h-8 w-8 mb-2" />
              <span>Create New Post</span>
            </Link>
            
            <Link
              to="/creator/plans/create"
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-lg transition duration-200 flex flex-col items-center justify-center"
            >
              <CurrencyDollarIcon className="h-8 w-8 mb-2" />
              <span>Create Plan</span>
            </Link>
            
            <Link
              to="/creator/posts"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-lg transition duration-200 flex flex-col items-center justify-center"
            >
              <ArrowTrendingUpIcon className="h-8 w-8 mb-2" />
              <span>View Posts</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Subscribers */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Subscribers</h2>
              <Link 
                to="/creator/subscribers" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {recentSubscribers.length > 0 ? (
              <div className="space-y-4">
                {recentSubscribers.map((sub) => (
                  <div key={sub.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="font-medium text-gray-700">
                        {sub.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{sub.user?.name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500">{sub.user?.email || ''}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(sub.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No subscribers yet</p>
                <p className="text-sm text-gray-400 mt-1">Start creating content to attract subscribers</p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Transactions</h2>
              <Link 
                to="/creator/transactions" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(transaction.amount)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        {transaction.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">Earnings will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 rounded-xl p-6 mt-8">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Tips for Success</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-blue-800">Post consistently to keep subscribers engaged</span>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-blue-800">Create exclusive content for subscribers only</span>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-blue-800">Engage with your community in comments</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreatorDashboard;