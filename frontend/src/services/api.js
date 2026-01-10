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

// Auth API functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  }
};

// Post API functions (Public & Protected)
export const postAPI = {
  // Get single post (public/private access handled by backend)
  getPostById: (postId) => api.get(`/posts/${postId}`),
  
  // Get posts for creator (protected)
  getPostsByCreator: (creatorId, params) => api.get(`/creators/${creatorId}/posts`, { params }),
  
  // Get public posts for feed
  getPublicPosts: (params) => api.get('/posts/public', { params }),
  
  // Like/unlike post
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
  
  // Comments
  getPostComments: (postId) => api.get(`/posts/${postId}/comments`),
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
};

// Creator API functions
export const creatorAPI = {
  // Dashboard
  getCreatorStats: () => api.get('/creators/dashboard/stats'),
  
  // Posts
  createPost: (data) => api.post('/creators/posts', data),
  getMyPosts: (params) => api.get('/creators/posts', { params }),
  getPostById: (id) => api.get(`/creators/posts/${id}`),
  updatePost: (id, data) => api.put(`/creators/posts/${id}`, data),
  deletePost: (id) => api.delete(`/creators/posts/${id}`),
  updatePostStatus: (id, status) => api.put(`/creators/posts/${id}/status`, { status }),
  
  // Subscription Plans
  createPlan: (data) => api.post('/creators/plans', data),
  getMyPlans: () => api.get('/creators/plans'),
  updatePlan: (id, data) => api.put(`/creators/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/creators/plans/${id}`),
  
  // Subscribers
  getMySubscribers: (params) => api.get('/creators/subscribers', { params }),
  getSubscriberStats: () => api.get('/creators/subscribers/stats'),
  
  // Profile
  getMyProfile: () => api.get('/creators/profile'),
  updateMyProfile: (data) => api.put('/creators/profile', data),
  updateAvatar: (formData) => api.post('/creators/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Analytics
  getAnalytics: (period) => api.get(`/creators/analytics?period=${period}`),
  
  // Search - PERBAIKAN: gunakan 'api' bukan 'apiClient'
  search: (params) => api.get('/search', { params }),
  
  // File upload (untuk media post)
  uploadMedia: (formData) => api.post('/creators/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

// Subscription API functions
export const subscriptionAPI = {
  // Browse creators
  getCreators: (params) => api.get('/creators', { params }),
  
  // Creator profile
  getCreatorProfile: (id) => api.get(`/creators/${id}/profile`),
  
  // Creator's posts (public only)
  getCreatorPosts: (creatorId, params) => api.get(`/creators/${creatorId}/posts`, { params }),
  
  // Creator's plans
  getCreatorPlans: (creatorId) => api.get(`/creators/${creatorId}/plans`),
  
  // Subscription flow
  initializeSubscription: (data) => api.post('/subscriptions/initialize', data),
  checkPaymentStatus: (orderId) => api.get(`/subscriptions/status/${orderId}`),
  
  // User subscriptions
  getMySubscriptions: () => api.get('/subscriptions/my'),
  cancelSubscription: (id) => api.put(`/subscriptions/${id}/cancel`),
  
  // Check if user has access to post
  checkPostAccess: (postId) => api.get(`/subscriptions/posts/${postId}/access`),
  
  // Check subscription status
  checkSubscriptionStatus: (creatorId) => api.get(`/subscriptions/check/${creatorId}`),
  
  // Subscribe
  subscribe: (creatorId, planId) => api.post(`/subscriptions/${creatorId}/subscribe`, { planId }),
};

// User API functions
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.post('/users/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Bookmarks
  getBookmarks: () => api.get('/users/bookmarks'),
  addBookmark: (postId) => api.post(`/users/bookmarks/${postId}`),
  removeBookmark: (postId) => api.delete(`/users/bookmarks/${postId}`),
  
  // Notifications
  getNotifications: () => api.get('/users/notifications'),
  markNotificationAsRead: (id) => api.put(`/users/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/users/notifications/read-all'),
};

// Search API (general)
export const searchAPI = {
  // Global search
  search: (params) => api.get('/search', { params }),
  
  // Search creators only
  searchCreators: (params) => api.get('/search/creators', { params }),
  
  // Search posts only
  searchPosts: (params) => api.get('/search/posts', { params }),
  
  // Trending
  getTrendingCreators: () => api.get('/search/trending/creators'),
  getTrendingPosts: () => api.get('/search/trending/posts'),
};

// File upload API (general)
export const uploadAPI = {
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

export default api;