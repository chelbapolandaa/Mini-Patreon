import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StarIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { postAPI } from '../services/api';

function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function fetchPosts() {
    try {
      const res = await postAPI.getPublicPosts();
      console.log("API response:", res.data); // debug
      setPosts(res.data.data); // <-- ambil array langsung
    } catch (err) {
      console.error("Error fetching posts", err);
      setPosts([]); // fallback biar tetap array
    } finally {
      setLoading(false);
    }
  }
  fetchPosts();
}, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Support Your Favorite{' '}
          <span className="text-blue-600">Creators</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of supporters who help creators make amazing content.
          Get exclusive access, behind-the-scenes, and connect directly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link to="/creators" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition duration-200 inline-block text-center">
              Explore Creators
            </Link>
          ) : (
            <>
              <Link to="/register?role=user" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition duration-200 inline-block text-center">
                Join as Supporter
              </Link>
              <Link to="/register?role=creator" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-lg text-lg transition duration-200 inline-block text-center">
                Start Creating
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feed Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Latest Posts</h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                {/* Klik seluruh card untuk buka PostDetail */}
                <Link to={`/posts/${post.id}`} className="block">
                  {post.type === 'video' && post.mediaUrls.length > 0 ? (
                    <video controls className="w-full h-64 object-cover">
                      <source src={post.mediaUrls[0]} type="video/mp4" />
                    </video>
                  ) : post.mediaUrls.length > 0 ? (
                    <img src={post.mediaUrls[0]} alt={post.title} className="w-full h-64 object-cover" />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                      No media
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  {/* Judul post juga bisa diklik */}
                  <Link to={`/posts/${post.id}`} className="text-lg font-semibold mb-2 hover:underline block">
                    {post.title}
                  </Link>

                  {/* Link ke profil creator */}
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    by{" "}
                    <Link to={`/creator/${post.creator?.id}`} className="text-blue-600 hover:underline flex items-center gap-1">
                      {post.creator?.avatar_url && (
                        <img
                          src={post.creator.avatar_url}
                          alt={post.creator.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      )}
                      {post.creator?.name || "Unknown"}
                    </Link>
                  </p>
                </div>
              </div>
            ))}
          </div>

        )}
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose CreatorHub</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="flex justify-center mb-4">
              <StarIcon className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Exclusive Content</h3>
            <p className="text-gray-600">
              Get access to content that's not available anywhere else.
              Behind-the-scenes, early releases, and more.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="flex justify-center mb-4">
              <UserGroupIcon className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Direct Connection</h3>
            <p className="text-gray-600">
              Connect directly with creators. Comment, give feedback,
              and be part of their creative journey.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="flex justify-center mb-4">
              <ChartBarIcon className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Flexible Support</h3>
            <p className="text-gray-600">
              Choose how you want to support. Monthly subscriptions
              with the freedom to cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold mb-2">Sign Up</h3>
            <p className="text-gray-600">Create your free account as a supporter or creator</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold mb-2">Choose Plan</h3>
            <p className="text-gray-600">Pick a subscription plan that fits your needs</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold mb-2">Enjoy Content</h3>
            <p className="text-gray-600">Access exclusive content and connect with creators</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of creators and supporters today
          </p>
          <Link 
            to={user ? "/dashboard" : "/register"} 
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition duration-200 inline-block"
          >
            {user ? "Go to Dashboard" : "Start Free Trial"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
