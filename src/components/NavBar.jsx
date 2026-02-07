import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { notificationsAPI } from '../services/api';
import { Briefcase, LayoutDashboard, FileText, Calendar, Settings, Bell, Wallet, LogOut } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { walletAddress, connectWallet, connecting } = useWeb3();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
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

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">JobInt</span>
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
            {/* Wallet Connect */}
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
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;