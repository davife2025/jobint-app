import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowGuest = false }) => {
  const { isAuthenticated, loading } = useAuth();
  const isGuestMode = localStorage.getItem('guestMode') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If route allows guest mode and user is in guest mode, allow access
  if (allowGuest && isGuestMode) {
    return children;
  }

  // Otherwise, require authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;