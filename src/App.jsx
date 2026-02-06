import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/Walletcontext';

// Auth Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Onboarding from './components/auth/Onboarding';

// Dashboard Pages
import Dashboard from './components/dashboard/Dashboard';
import JobMatches from './components/jobs/JobMatches';
import Applications from './components/applications/Applications';
import ApplicationDetail from './components/applications/ApplicationDetail';
import Interviews from './components/interviews/Interviews';
import Profile from './components/profile/Profile';
import Verification from './components/profile/Verification';

// Shared Components
import PrivateRoute from './components/shared/PrivateRoute';
import Layout from './components/shared/Layout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <div className="App">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'white',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="jobs" element={<JobMatches />} />
                <Route path="applications" element={<Applications />} />
                <Route path="applications/:id" element={<ApplicationDetail />} />
                <Route path="interviews" element={<Interviews />} />
                <Route path="profile" element={<Profile />} />
                <Route path="verification" element={<Verification />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;