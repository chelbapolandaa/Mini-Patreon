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
  (error) => Promise.reject(error)
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

// ================== Upload API ==================
export const uploadAPI = {
  uploadFile: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMultipleFiles: (formData) =>
    api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteFile: (filename, type = 'files') =>
    api.delete(`/upload/${filename}?type=${type}`),
};

// ================== Auth API ==================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },
};

// ================== Post API ==================
export const postAPI = {
  getPostById: (postId) => api.get(`/posts/${postId}`),
  getPublicPosts: (params) => api.get('/posts/public', { params }),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
  getPostComments: (postId) => api.get(`/posts/${postId}/comments`),
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
};

// ================== Creator API ==================
export const creatorAPI = {
  // Dashboard
  getCreatorStats: () => api.get('/creators/dashboard/stats'),

  // Posts (dashboard only)
  createPost: (data) => api.post('/creators/posts', data),
  getMyPosts: (params) => api.get('/creators/posts', { params }),
  getPostById: (id) => api.get(`/creators/posts/${id}`),
  updatePost: (id, data) => api.put(`/creators/posts/${id}`, data),
  deletePost: (id) => api.delete(`/creators/posts/${id}`),
  updatePostStatus: (id, status) =>
    api.put(`/creators/posts/${id}/status`, { status }),

  // Plans
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
  updateAvatar: (formData) =>
    api.post('/creators/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Analytics
  getAnalytics: (period) => api.get(`/creators/analytics?period=${period}`),
};

// ================== Subscription API ==================
export const subscriptionAPI = {
  getCreators: (params) => api.get('/creators', { params }),
  getCreatorProfile: (id) => api.get(`/creators/${id}/profile`),
  getCreatorPostsPublic: (creatorId, params) =>
    api.get(`/creators/${creatorId}/posts`, { params }),
  getCreatorPlans: (creatorId) => api.get(`/creators/${creatorId}/plans`),
  getCreatorPosts: (creatorId) => api.get(`/creators/${creatorId}/posts`),
  initializeSubscription: (data) => api.post('/subscriptions/initialize', data),
  checkPaymentStatus: (orderId) =>
    api.get(`/subscriptions/status/${orderId}`),
  getMySubscriptions: () => api.get('/subscriptions/my'),
  cancelSubscription: (id) => api.put(`/subscriptions/${id}/cancel`),
  checkIsSubscribed: (creatorId) =>
    api.get(`/creators/${creatorId}/is-subscribed`),
  checkPostAccess: (postId) => api.get(`/subscriptions/posts/${postId}/access`),
  checkSubscriptionStatus: (creatorId) =>
    api.get(`/subscriptions/check/${creatorId}`),
  subscribe: (creatorId, planId) =>
    api.post(`/subscriptions/${creatorId}/subscribe`, { planId }),
};

// ================== User API ==================
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) =>
    api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getBookmarks: () => api.get('/users/bookmarks'),
  addBookmark: (postId) => api.post(`/users/bookmarks/${postId}`),
  removeBookmark: (postId) => api.delete(`/users/bookmarks/${postId}`),
  getNotifications: () => api.get('/users/notifications'),
  markNotificationAsRead: (id) =>
    api.put(`/users/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/users/notifications/read-all'),
};

// ================== Search API ==================
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  searchCreators: (params) => api.get('/search/creators', { params }),
  searchPosts: (params) => api.get('/search/posts', { params }),
  getTrendingCreators: () => api.get('/search/trending/creators'),
  getTrendingPosts: () => api.get('/search/trending/posts'),
};

export default api;
