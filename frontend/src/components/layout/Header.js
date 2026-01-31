import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar'; // Import SearchBar

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  console.log('Auth user:', user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <HomeIcon className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-gray-900 hidden sm:block">CreatorHub</span>
            </Link>
            
            <nav className="hidden md:flex space-x-4 ml-4">
              <Link to="/creators" className="text-gray-600 hover:text-blue-600 transition text-sm">
                Creators
              </Link>
              
              {user?.role === 'creator' && (
                <>
                  <Link to="/creator/dashboard" className="text-gray-600 hover:text-blue-600 transition text-sm">
                    Dashboard
                  </Link>
                  <Link to="/creator/posts" className="text-gray-600 hover:text-blue-600 transition text-sm">
                    My Posts
                  </Link>
                </>
              )}

              {user?.role === 'user' && (
                <Link 
                  to="/subscriptions/my" 
                  className="text-gray-600 hover:text-blue-600 transition text-sm"
                >
                  Manage Subscriptions
                </Link>
              )}

            </nav>
          </div>

          <div className="flex-1 max-w-2xl mx-4">
            <SearchBar />
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {user.role === 'creator' && (
                  <Link 
                    to="/creator/plans" 
                    className="hidden md:inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition duration-200"
                  >
                    Manage Plans
                  </Link>
                )}
                
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition text-sm px-3 py-1 border border-gray-300 rounded-lg hover:border-red-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition text-sm">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
          <nav className="flex space-x-4 overflow-x-auto">
            <Link to="/creators" className="text-gray-600 hover:text-blue-600 transition text-sm whitespace-nowrap">
              Creators
            </Link>
            
            {user?.role === 'creator' && (
              <>
                <Link to="/creator/dashboard" className="text-gray-600 hover:text-blue-600 transition text-sm whitespace-nowrap">
                  Dashboard
                </Link>
                <Link to="/creator/posts" className="text-gray-600 hover:text-blue-600 transition text-sm whitespace-nowrap">
                  My Posts
                </Link>
                <Link to="/creator/plans" className="text-gray-600 hover:text-blue-600 transition text-sm whitespace-nowrap">
                  Plans
                </Link>
              </>
            )}
            
            {user?.role === 'user' && (
              <Link 
                to="/subscriptions/my" 
                className="hidden md:inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition duration-200"
              >
                Manage Subscriptions
              </Link>
            )}

          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;