import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Methods
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  addSkill: (data) => api.post('/users/skills', data),
  deleteSkill: (id) => api.delete(`/users/skills/${id}`),
  updateWallet: (data) => api.put('/users/wallet', data),
  getStats: () => api.get('/users/stats'),
};

export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  getPendingMatches: () => api.get('/jobs/matches/pending'),
  getReviewedMatches: () => api.get('/jobs/matches/reviewed'),
  reviewMatch: (id, data) => api.put(`/jobs/matches/${id}/review`, data),
  triggerMatching: () => api.post('/jobs/matches/trigger'),
  getStats: () => api.get('/jobs/stats/overview'),
};

export const applicationsAPI = {
  getApplications: (params) => api.get('/applications', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  createApplication: (data) => api.post('/applications', data),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  deleteApplication: (id) => api.delete(`/applications/${id}`),
  getStats: () => api.get('/applications/stats/overview'),
  getCoverLetter: (id) => api.get(`/applications/${id}/cover-letter`),
};

export const interviewsAPI = {
  getInterviews: (params) => api.get('/interviews', { params }),
  createInterview: (data) => api.post('/interviews', data),
  updateInterview: (id, data) => api.put(`/interviews/${id}`, data),
  deleteInterview: (id) => api.delete(`/interviews/${id}`),
};

export const calendarAPI = {
  connect: () => api.get('/calendar/connect'),
  saveTokens: (data) => api.post('/calendar/save-tokens', data),
  getEvents: (params) => api.get('/calendar/events', { params }),
  getFreeSlots: (params) => api.get('/calendar/free-slots', { params }),
  disconnect: () => api.post('/calendar/disconnect'),
};

export const blockchainAPI = {
  getRecords: (params) => api.get('/blockchain/records', { params }),
  verify: (txHash) => api.get(`/blockchain/verify/${txHash}`),
  getStats: () => api.get('/blockchain/stats'),
  estimateGas: (params) => api.get('/blockchain/gas-estimate', { params }),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};