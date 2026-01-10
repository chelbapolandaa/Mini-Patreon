import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, UserCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <HomeIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">CreatorHub</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link to="/creators" className="text-gray-600 hover:text-blue-600 transition">
                Creators
              </Link>
              
              {user?.role === 'creator' && (
                <>
                  <Link to="/creator/dashboard" className="text-gray-600 hover:text-blue-600 transition">
                    Dashboard
                  </Link>
                  <Link to="/creator/posts" className="text-gray-600 hover:text-blue-600 transition">
                    My Posts
                  </Link>
                  <Link to="/creator/plans" className="text-gray-600 hover:text-blue-600 transition">
                    Plans
                  </Link>
                </>
              )}
              
              {user?.role === 'user' && (
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition">
                  My Subscriptions
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition px-3 py-1 border border-gray-300 rounded-lg hover:border-red-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;