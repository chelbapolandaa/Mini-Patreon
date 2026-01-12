import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionAPI } from '../services/api'; // pastikan pakai creatorAPI, bukan subscriptionAPI
import { toast } from 'react-hot-toast';
import {
  UserGroupIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  StarIcon
} from '@heroicons/react/24/outline';

function BrowseCreators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getCreators({
        page: pagination.page,
        limit: pagination.limit,
        q: search
      });

      const payload = response.data.data; // backend return { success, data: { creators, total, page, totalPages } }

      setCreators(payload.creators || []);
      setPagination(prev => ({
        ...prev,
        page: payload.page,
        total: payload.total,
        pages: payload.totalPages
      }));
    } catch (error) {
      toast.error('Failed to load creators');
      console.error('Error fetching creators:', error);
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && creators.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading creators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Amazing Creators</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Support your favorite creators and get exclusive access to their content
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators by name..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Creators Grid */}
        {creators.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserGroupIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-600">
              {search ? `No creators match "${search}"` : 'No creators available yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creators.map((creator) => (
                <div key={creator.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  {/* Creator Card */}
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        {creator.avatar_url ? (
                          <img 
                            src={creator.avatar_url} 
                            alt={creator.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-blue-600">
                            {creator.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{creator.name}</h3>
                        <p className="text-sm text-gray-500">Creator</p>
                      </div>
                    </div>
                    
                    {creator.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {creator.bio}
                      </p>
                    )}
                    
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        <span>{creator.stats?.subscribers || 0} subscribers</span>
                      </div>
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        <span>{creator.stats?.posts || 0} posts</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          {creator.stats?.hasActivePlan ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <StarIcon className="h-3 w-3 mr-1" />
                              Available Plans
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No Plans Yet
                            </span>
                          )}
                        </div>
                        
                        <Link
                          to={`/creator/${creator.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BrowseCreators;
