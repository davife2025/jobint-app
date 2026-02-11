// src/components/NavBar.jsx - UPDATED FOR GUEST MODE

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/web3Context';
import { notificationsAPI } from '../services/api';
import { Briefcase, LayoutDashboard, FileText, Calendar, Settings, Bell, Wallet, LogOut, Key, UserPlus } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isGuestMode, isAuthenticated } = useAuth();
  const { account: walletAddress, connectWallet, isConnecting: connecting } = useWeb3();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only load notifications for authenticated users
    if (isAuthenticated && !isGuestMode) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isGuestMode]);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getUnreadCount();
      setUnreadCount(data?.count || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-indigo-50 text-indigo-600 font-medium'
        : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  const handleConnectWallet = async () => {
    const result = await connectWallet();
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isGuestMode ? '/applications' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">JobInt</span>
            {isGuestMode && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Guest
              </span>
            )}
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/applications" className={navLinkClass('/applications')}>
              <FileText className="w-4 h-4" />
              <span>Applications</span>
            </Link>
            <Link to="/interviews" className={navLinkClass('/interviews')}>
              <Calendar className="w-4 h-4" />
              <span>Interviews</span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Guest Mode Actions */}
            {isGuestMode ? (
              <>
                <button
                  onClick={() => navigate('/guest-apply')}
                  className="flex items-center gap-2 px-3 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>New Application</span>
                </button>
                
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Exit Guest Mode"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                {/* Wallet Connect - Only for authenticated users */}
                {walletAddress ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    disabled={connecting}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                )}

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Settings */}
                <Link to="/settings" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  <Settings className="w-5 h-5" />
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;