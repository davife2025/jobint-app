// src/services/api.js - UPDATED FOR GUEST MODE

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const trackingToken = localStorage.getItem('currentTrackingToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tracking token for guest requests
    if (trackingToken && config.url?.includes('/guest/track')) {
      config.headers['X-Tracking-Token'] = trackingToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 404 gracefully
    if (error.response?.status === 404) {
      console.warn(`⚠️ Endpoint not found: ${error.config?.url}`);
      return Promise.resolve({ 
        data: null, 
        status: 404,
        config: error.config 
      });
    }
    
    // Handle 401 - but not for guest endpoints
    if (error.response?.status === 401 && !error.config?.url?.includes('/guest/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      console.error('⚠️ Rate limit exceeded. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// GUEST API METHODS (NEW)
// ============================================
export const guestAPI = {
  // Submit application without authentication
  submitApplication: (data) => api.post('/api/guest/submit', data),
  
  // Track applications using tracking token
  trackApplications: (trackingToken) => 
    api.get(`/api/guest/track/${trackingToken}`),
};

// ============================================
// AUTHENTICATION API
// ============================================
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
};

// ============================================
// USER API
// ============================================
export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  addSkill: (data) => api.post('/api/users/skills', data),
  deleteSkill: (id) => api.delete(`/api/users/skills/${id}`),
  updateWallet: (data) => api.put('/api/users/wallet', data),
  getStats: () => api.get('/api/users/stats'),
};

// ============================================
// JOBS API
// ============================================
export const jobsAPI = {
  getJobs: (params) => api.get('/api/jobs', { params }),
  getJob: (id) => api.get(`/api/jobs/${id}`),
  getPendingMatches: () => api.get('/api/jobs/matches/pending'),
  getReviewedMatches: () => api.get('/api/jobs/matches/reviewed'),
  reviewMatch: (id, data) => api.put(`/api/jobs/matches/${id}/review`, data),
  triggerMatching: () => api.post('/api/jobs/matches/trigger'),
  getStats: () => api.get('/api/jobs/stats/overview'),
};

// ============================================
// APPLICATIONS API
// ============================================
export const applicationsAPI = {
  getApplications: (params) => api.get('/api/applications', { params }),
  getApplication: (id) => api.get(`/api/applications/${id}`),
  createApplication: (data) => api.post('/api/applications', data),
  updateStatus: (id, data) => api.put(`/api/applications/${id}/status`, data),
  deleteApplication: (id) => api.delete(`/api/applications/${id}`),
  getStats: () => api.get('/api/applications/stats/overview'),
  getCoverLetter: (id) => api.get(`/api/applications/${id}/cover-letter`),
};

// ============================================
// INTERVIEWS API
// ============================================
export const interviewsAPI = {
  getInterviews: (params) => api.get('/api/interviews', { params }),
  createInterview: (data) => api.post('/api/interviews', data),
  updateInterview: (id, data) => api.put(`/api/interviews/${id}`, data),
  deleteInterview: (id) => api.delete(`/api/interviews/${id}`),
};

// ============================================
// CALENDAR API
// ============================================
export const calendarAPI = {
  connect: () => api.get('/api/calendar/connect'),
  saveTokens: (data) => api.post('/api/calendar/save-tokens', data),
  getEvents: (params) => api.get('/api/calendar/events', { params }),
  getFreeSlots: (params) => api.get('/api/calendar/free-slots', { params }),
  disconnect: () => api.post('/api/calendar/disconnect'),
};

// ============================================
// BLOCKCHAIN API
// ============================================
export const blockchainAPI = {
  getRecords: (params) => api.get('/api/blockchain/records', { params }),
  verify: (txHash) => api.get(`/api/blockchain/verify/${txHash}`),
  getStats: () => api.get('/api/blockchain/stats'),
  estimateGas: (params) => api.get('/api/blockchain/gas-estimate', { params }),
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

export default api;