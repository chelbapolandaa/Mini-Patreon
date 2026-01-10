import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost'; // ← TAMBAHKAN
import MyPosts from './pages/MyPosts';
import PostDetail from './pages/PostDetail'; // ← TAMBAHKAN
import SubscriptionPlans from './pages/SubscriptionPlans';
import CreatePlan from './pages/CreatePlan';
import BrowseCreators from './pages/BrowseCreators';
import CreatorProfile from './pages/CreatorProfile';
import PaymentStatus from './pages/PaymentStatus';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/creators" element={<BrowseCreators />} />
              <Route path="/creator/:id" element={<CreatorProfile />} />
              
              {/* Post Routes - Public */}
              <Route path="/posts/:id" element={<PostDetail />} /> {/* ← TAMBAHKAN */}
              
              {/* User Dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Creator Routes */}
              <Route 
                path="/creator/dashboard" 
                element={
                  <ProtectedRoute role="creator">
                    <CreatorDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Creator Posts Routes */}
              <Route 
                path="/creator/posts/create" 
                element={
                  <ProtectedRoute role="creator">
                    <CreatePost />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/creator/posts/edit/:id" 
                element={
                  <ProtectedRoute role="creator">
                    <EditPost />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/creator/posts" 
                element={
                  <ProtectedRoute role="creator">
                    <MyPosts />
                  </ProtectedRoute>
                } 
              />
              
              {/* Creator Subscription Plans */}
              <Route 
                path="/creator/plans" 
                element={
                  <ProtectedRoute role="creator">
                    <SubscriptionPlans />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/creator/plans/create" 
                element={
                  <ProtectedRoute role="creator">
                    <CreatePlan />
                  </ProtectedRoute>
                } 
              />
              
              {/* Subscription Routes */}
              <Route 
                path="/subscriptions/plans/:creatorId" 
                element={
                  <ProtectedRoute>
                    <SubscriptionPlans />
                  </ProtectedRoute>
                } 
              />
              
              {/* Payment Status */}
              <Route 
                path="/subscription/status" 
                element={
                  <ProtectedRoute>
                    <PaymentStatus />
                  </ProtectedRoute>
                } 
              />
              <Route path="/subscription/success" element={<PaymentStatus />} />
              <Route path="/subscription/pending" element={<PaymentStatus />} />
              <Route path="/subscription/error" element={<PaymentStatus />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;