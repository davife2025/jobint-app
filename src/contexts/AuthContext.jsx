// src/contexts/AuthContext.jsx - UPDATED FOR GUEST MODE

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [trackingTokens, setTrackingTokens] = useState([]);

  useEffect(() => {
    checkAuth();
    loadGuestData();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/auth/me');
          setUser(response.data.user);
          setIsOnboarded(response.data.user.is_onboarded);
          setIsGuestMode(false);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const loadGuestData = () => {
    // Check if in guest mode
    const guestMode = localStorage.getItem('guestMode') === 'true';
    setIsGuestMode(guestMode);

    // Load tracking tokens
    const storedTokens = localStorage.getItem('trackingTokens');
    if (storedTokens) {
      try {
        setTrackingTokens(JSON.parse(storedTokens));
      } catch (error) {
        console.error('Failed to load tracking tokens:', error);
        setTrackingTokens([]);
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.removeItem('guestMode'); // Clear guest mode
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsOnboarded(user.is_onboarded);
      setIsGuestMode(false);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.removeItem('guestMode'); // Clear guest mode
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsOnboarded(false);
      setIsGuestMode(false);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsOnboarded(false);
    setIsGuestMode(false);
  };

  const enableGuestMode = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuestMode(true);
  };

  const disableGuestMode = () => {
    localStorage.removeItem('guestMode');
    setIsGuestMode(false);
  };

  const addTrackingToken = (token, applicationData = {}) => {
    const newToken = {
      token,
      addedAt: new Date().toISOString(),
      ...applicationData
    };

    const updatedTokens = [...trackingTokens, newToken];
    setTrackingTokens(updatedTokens);
    localStorage.setItem('trackingTokens', JSON.stringify(updatedTokens));
    localStorage.setItem('currentTrackingToken', token);
  };

  const removeTrackingToken = (token) => {
    const updatedTokens = trackingTokens.filter(t => t.token !== token);
    setTrackingTokens(updatedTokens);
    localStorage.setItem('trackingTokens', JSON.stringify(updatedTokens));
    
    // If removing current token, set to first available or clear
    if (localStorage.getItem('currentTrackingToken') === token) {
      if (updatedTokens.length > 0) {
        localStorage.setItem('currentTrackingToken', updatedTokens[0].token);
      } else {
        localStorage.removeItem('currentTrackingToken');
      }
    }
  };

  const setCurrentTrackingToken = (token) => {
    localStorage.setItem('currentTrackingToken', token);
  };

  const getCurrentTrackingToken = () => {
    return localStorage.getItem('currentTrackingToken');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser.is_onboarded !== undefined) {
      setIsOnboarded(updatedUser.is_onboarded);
    }
  };

  const value = {
    // User state
    user,
    loading,
    isAuthenticated: !!user,
    isOnboarded,
    
    // Guest mode state
    isGuestMode,
    trackingTokens,
    
    // Auth methods
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    
    // Guest mode methods
    enableGuestMode,
    disableGuestMode,
    addTrackingToken,
    removeTrackingToken,
    setCurrentTrackingToken,
    getCurrentTrackingToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};