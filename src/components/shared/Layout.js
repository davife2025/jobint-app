import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/Walletcontext';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Calendar, 
  User, 
  LogOut,
  Menu,
  X,
  Wallet,
  Shield,
  Bell
} from 'lucide-react';
import './Shared.css';
import toast from 'react-hot-toast';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { account, connectWallet, disconnect, isConnecting } = useWallet();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Job Matches', path: '/jobs' },
    { icon: FileText, label: 'Applications', path: '/applications' },
    { icon: Calendar, label: 'Interviews', path: '/interviews' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Shield, label: 'Verification', path: '/verification' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleWalletAction = async () => {
    if (account) {
      disconnect();
    } else {
      try {
        await connectWallet();
      } catch (error) {
        // Error is handled in WalletContext
      }
    }
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Briefcase size={24} />
            {sidebarOpen && <span>JobInt</span>}
          </div>
          <button 
            className="sidebar-toggle desktop-only"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-item wallet-button" 
            onClick={handleWalletAction}
            disabled={isConnecting}
          >
            <Wallet size={20} />
            {sidebarOpen && (
              <span>
                {isConnecting ? 'Connecting...' : account ? formatAddress(account) : 'Connect Wallet'}
              </span>
            )}
          </button>
          
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Header */}
        <header className="top-header">
          <button 
            className="mobile-menu-toggle mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>

          <div className="header-right">
            <button className="icon-button">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>
            
            <div className="user-menu">
              <div className="user-avatar">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="user-info desktop-only">
                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;