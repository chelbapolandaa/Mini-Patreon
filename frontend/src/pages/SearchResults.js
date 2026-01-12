import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../services/api'; // ✅ pakai searchAPI, bukan creatorAPI
import { 
  MagnifyingGlassIcon,
  UserCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({
    creators: [],
    posts: []
  });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const response = await searchAPI.search({ 
        q: query, 
        limit: 20 
      });
      
      setResults({
        creators: response.data.data?.creators || [],
        posts: response.data.data?.posts || []
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults({ creators: [], posts: [] });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    switch(type) {
      case 'video': return <VideoCameraIcon className="h-5 w-5 text-red-500" />;
      case 'image': return <PhotoIcon className="h-5 w-5 text-blue-500" />;
      default: return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredResults = activeTab === 'creators' 
    ? { creators: results.creators, posts: [] }
    : activeTab === 'posts' 
    ? { creators: [], posts: results.posts }
    : results;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            Found {results.creators.length + results.posts.length} results
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium ${activeTab === 'all' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            All ({results.creators.length + results.posts.length})
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-4 py-2 font-medium ${activeTab === 'creators' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Creators ({results.creators.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium ${activeTab === 'posts' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Posts ({results.posts.length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for "{query}"...</p>
          </div>
        ) : (
          <>
            {/* Creators Results */}
            {filteredResults.creators.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Creators</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.creators.map(creator => (
                    <Link
                      key={creator._id}
                      to={`/creator/${creator._id}`} // ✅ pakai /creator/:id
                      className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {creator.avatar ? (
                            <img 
                              src={creator.avatar} 
                              alt={creator.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCircleIcon className="h-8 w-8 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{creator.name}</h3>
                          <p className="text-sm text-gray-500 truncate">
                            {creator.bio || 'Content Creator'}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span>{creator.subscribersCount || 0} subscribers</span>
                            {creator.categories && creator.categories.length > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{creator.categories.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {filteredResults.posts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Posts</h2>
                <div className="space-y-4">
                  {filteredResults.posts.map(post => (
                    <Link
                      key={post._id}
                      to={`/posts/${post._id}`}
                      className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition duration-200"
                    >
                      <div className="flex">
                        {post.thumbnail || post.mediaUrls?.[0] ? (
                          <div className="flex-shrink-0 mr-4">
                            <img 
                              src={post.thumbnail || post.mediaUrls[0]} 
                              alt={post.title}
                              className="h-20 w-32 object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 mr-4 h-20 w-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getFileIcon(post.type)}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{post.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              post.visibility === 'public' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {post.visibility === 'public' ? 'Public' : 'Subscribers Only'}
                            </span>
                          </div>
                          
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <Link 
                              to={`/creator/${post.creatorId}`} // ✅ pakai /creator/:id
                              className="text-blue-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.creatorName}
                            </Link>
                            <span className="mx-2">•</span>
                            <span>{post.type}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {post.excerpt && (
                            <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-xs text-gray-500">
                              {post.likesCount || 0} likes
                            </span>
                            <span className="text-xs text-gray-500">
                              {post.commentsCount || 0} comments
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredResults.creators.length === 0 && filteredResults.posts.length === 0 && (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try different keywords or check out trending creators
                </p>
                <Link 
                  to="/creators" 
                  className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Browse Creators
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResults;