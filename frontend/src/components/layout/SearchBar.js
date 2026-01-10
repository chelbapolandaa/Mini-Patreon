import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { creatorAPI } from '../../services/api';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    creators: [],
    posts: []
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    useEffect(() => {
    const searchDelay = setTimeout(() => {
        if (query.trim().length >= 2) {
        performSearch();
        } else {
        setResults({ creators: [], posts: [] });
        setShowResults(false);
        }
    }, 300);

    return () => clearTimeout(searchDelay);
    }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await creatorAPI.search({
        query: query.trim(),
        limit: 5
      });
      
      setResults({
        creators: response.data.creators || [],
        posts: response.data.posts || []
      });
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ creators: [], posts: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (type, id, title = '') => {
    if (type === 'creator') {
      navigate(`/creators/${id}`);
    } else if (type === 'post') {
      navigate(`/posts/${id}`);
    }
    setQuery(title || '');
    setShowResults(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ creators: [], posts: [] });
    setShowResults(false);
  };

  const totalResults = results.creators.length + results.posts.length;

  return (
    <div className="relative flex-1 max-w-2xl mx-4">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, posts, or content..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </form>

      {/* Search Results Dropdown */}
      {showResults && query && totalResults > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3">
            {/* Creators Results */}
            {results.creators.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Creators
                </h3>
                <div className="space-y-2">
                  {results.creators.map(creator => (
                    <button
                      key={creator._id}
                      onClick={() => handleResultClick('creator', creator._id, creator.name)}
                      className="w-full flex items-center p-2 hover:bg-gray-50 rounded-lg transition duration-200"
                    >
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {creator.avatar ? (
                          <img 
                            src={creator.avatar} 
                            alt={creator.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-semibold">
                            {creator.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-3 text-left">
                        <p className="text-sm font-medium text-gray-900">{creator.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {creator.bio || 'Creator'} • {creator.subscribersCount || 0} subscribers
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {results.posts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Posts
                </h3>
                <div className="space-y-2">
                  {results.posts.map(post => (
                    <button
                      key={post._id}
                      onClick={() => handleResultClick('post', post._id, post.title)}
                      className="w-full flex items-start p-2 hover:bg-gray-50 rounded-lg transition duration-200"
                    >
                      <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded overflow-hidden">
                        {post.thumbnail || post.mediaUrls?.[0] ? (
                          <img 
                            src={post.thumbnail || post.mediaUrls[0]} 
                            alt={post.title}
                            className="h-12 w-12 object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center bg-gray-200">
                            <DocumentIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 text-left flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>{post.creatorName}</span>
                          <span className="mx-2">•</span>
                          <span>{post.type === 'video' ? 'Video' : 'Article'}</span>
                          <span className="mx-2">•</span>
                          <span>{post.visibility === 'public' ? 'Public' : 'Subscribers Only'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View All Results */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={() => {
                navigate(`/search?q=${encodeURIComponent(query)}`);
                setShowResults(false);
              }}
              className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 p-2"
            >
              View all results for "{query}"
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && query && totalResults === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
          <p className="text-gray-600 text-sm">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

// Add this icon component
const DocumentIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default SearchBar;