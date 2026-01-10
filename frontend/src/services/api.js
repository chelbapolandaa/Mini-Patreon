import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Post API functions (Public & Protected)
export const postAPI = {
  // Get single post (public/private access handled by backend)
  getPostById: (postId) => api.get(`/posts/${postId}`),
  
  // Get posts for creator (protected)
  getPostsByCreator: (creatorId, params) => api.get(`/api/creators/${creatorId}/posts`, { params }),
};

// Creator API functions
export const creatorAPI = {
  // Dashboard
  getCreatorStats: () => api.get('/creators/dashboard/stats'),
  
  // Posts
  createPost: (data) => api.post('/creators/posts', data),
  getMyPosts: (params) => api.get('/creators/posts', { params }),
  getPostById: (id) => api.get(`/creators/posts/${id}`), // ← TAMBAHKAN
  updatePost: (id, data) => api.put(`/creators/posts/${id}`, data),
  deletePost: (id) => api.delete(`/creators/posts/${id}`),
  
  // Subscription Plans
  createPlan: (data) => api.post('/creators/plans', data),
  getMyPlans: () => api.get('/creators/plans'),
  
  // Subscribers
  getMySubscribers: () => api.get('/creators/subscribers'),
  getSubscriberStats: () => api.get('/creators/subscribers/stats'),
};

// Subscription API functions
export const subscriptionAPI = {
  // Browse creators
  getCreators: (params) => api.get('/subscriptions/creators', { params }),
  
  // Creator profile
  getCreatorProfile: (id) => api.get(`/subscriptions/creators/${id}/profile`),
  
  // Creator's plans
  getCreatorPlans: (creatorId) => api.get(`/subscriptions/plans/${creatorId}`),
  
  // Subscription flow
  initializeSubscription: (data) => api.post('/subscriptions/initialize', data),
  checkPaymentStatus: (orderId) => api.get(`/subscriptions/status/${orderId}`),
  
  // User subscriptions
  getMySubscriptions: () => api.get('/subscriptions/my'),
  cancelSubscription: (id) => api.put(`/subscriptions/${id}/cancel`),
  
  // Check if user has access to post
  checkPostAccess: (postId) => api.get(`/subscriptions/posts/${postId}/access`),
};

// User API functions
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

export default api;