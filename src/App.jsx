// src/App.jsx - UPDATED WITH GUEST ROUTES

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider } from './contexts/web3Context';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Interviews from './pages/Interviews';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage.jsx';
import GuestApply from './pages/GuestApply';

// Components
import Navbar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function AppRoutes() {
  const { isAuthenticated, isGuestMode, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {(isAuthenticated || isGuestMode) && <Navbar />}
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />
          } />
          
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
          } />
          
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
          } />

          {/* Guest application route - accessible to everyone */}
          <Route path="/guest-apply" element={<GuestApply />} />

          {/* Protected routes - accessible by authenticated users OR guests */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowGuest={true}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/applications" element={
            <ProtectedRoute allowGuest={true}>
              <Applications />
            </ProtectedRoute>
          } />
          
          <Route path="/interviews" element={
            <ProtectedRoute allowGuest={true}>
              <Interviews />
            </ProtectedRoute>
          } />
          
          {/* Settings requires full authentication */}
          <Route path="/settings" element={
            <ProtectedRoute allowGuest={false}>
              <Settings />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <AppRoutes />
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;