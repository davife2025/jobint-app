// src/api/guestAPI.js - FIXED VERSION

import api from '../services/api';

const guestAPI = {
  submitApplication(formData) {
    // ✅ FIXED: Added /api/ prefix and proper headers for multipart/form-data
    return api.post('/api/guest/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  trackApplications(trackingToken) {
    return api.get(`/api/guest/track/${trackingToken}`);
  }
};

export default guestAPI;