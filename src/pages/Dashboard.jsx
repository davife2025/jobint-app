// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FaBriefcase, 
  FaCalendarCheck, 
  FaCheckCircle, 
  FaRocket,
  FaChartLine,
  FaClock
} from 'react-icons/fa';
import api from '../../backend/services/api';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from './context/Web3Context';

// Components
import StatsCard from '../components/StatsCard';
import ApplicationCard from '../components/ApplicationCard';
import InterviewCard from '../components/InterviewCard';
import ActivityFeed from '../components/ActivityFeed';

const Dashboard = () => {
  const { user } = useAuth();
  const { account, connectWallet } = useWeb3();
  
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    todaysApplications: 0
  });
  
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [statsRes, applicationsRes, interviewsRes, activityRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/applications?limit=5'),
        api.get('/interviews/upcoming'),
        api.get('/activity/recent')
      ]);

      setStats(statsRes.data);
      setRecentApplications(applicationsRes.data.applications);
      setUpcomingInterviews(interviewsRes.data.interviews);
      setActivities(activityRes.data.activities);
      
      // Get user settings
      const settingsRes = await api.get('/users/settings');
      setAutoApplyEnabled(settingsRes.data.apply_mode === 'auto');

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoApply = async () => {
    try {
      const newMode = autoApplyEnabled ? 'review' : 'auto';
      
      await api.put('/users/settings', {
        apply_mode: newMode
      });
      
      setAutoApplyEnabled(!autoApplyEnabled);
      
      toast.success(
        autoApplyEnabled 
          ? 'Auto-apply disabled. You\'ll review jobs before applying.' 
          : 'Auto-apply enabled! JobInt will apply to matching jobs automatically.'
      );
      
    } catch (error) {
      console.error('Failed to toggle auto-apply:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleStartJobSearch = async () => {
    try {
      toast.loading('Finding jobs for you...');
      
      await api.post('/jobs/discover');
      
      toast.success('Job search started! We\'ll notify you when we find matches.');
      
      // Refresh dashboard after a delay
      setTimeout(fetchDashboardData, 3000);
      
    } catch (error) {
      console.error('Failed to start job search:', error);
      toast.error('Failed to start job search');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.full_name || 'Job Seeker'}! 👋</h1>
          <p>Your automated job search is {autoApplyEnabled ? 'active' : 'paused'}</p>
        </div>
        
        <div className="header-actions">
          {!account && (
            <button className="btn-secondary" onClick={connectWallet}>
              <span>🔗</span> Connect Wallet
            </button>
          )}
          
          <button 
            className={`btn-toggle ${autoApplyEnabled ? 'active' : ''}`}
            onClick={handleToggleAutoApply}
          >
            <span>{autoApplyEnabled ? '⏸' : '▶'}</span>
            {autoApplyEnabled ? 'Pause Auto-Apply' : 'Enable Auto-Apply'}
          </button>
          
          <button className="btn-primary" onClick={handleStartJobSearch}>
            <FaRocket /> Find Jobs Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon={<FaBriefcase />}
          title="Total Applications"
          value={stats.totalApplications}
          subtitle={`${stats.todaysApplications} today`}
          color="blue"
        />
        <StatsCard
          icon={<FaCalendarCheck />}
          title="Interviews Scheduled"
          value={stats.interviewsScheduled}
          subtitle="Upcoming interviews"
          color="green"
        />
        <StatsCard
          icon={<FaCheckCircle />}
          title="Offers Received"
          value={stats.offersReceived}
          subtitle="Pending responses"
          color="purple"
        />
        <StatsCard
          icon={<FaChartLine />}
          title="Response Rate"
          value={`${Math.round((stats.interviewsScheduled / stats.totalApplications) * 100) || 0}%`}
          subtitle="Interviews / Applications"
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Applications */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <FaClock /> Recent Applications
            </h2>
            <Link to="/applications" className="view-all">View All →</Link>
          </div>
          
          <div className="applications-list">
            {recentApplications.length === 0 ? (
              <div className="empty-state">
                <p>No applications yet. Start your job search to see results here!</p>
                <button className="btn-primary" onClick={handleStartJobSearch}>
                  <FaRocket /> Start Job Search
                </button>
              </div>
            ) : (
              recentApplications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <FaCalendarCheck /> Upcoming Interviews
            </h2>
            <Link to="/interviews" className="view-all">View All →</Link>
          </div>
          
          <div className="interviews-list">
            {upcomingInterviews.length === 0 ? (
              <div className="empty-state">
                <p>No interviews scheduled yet. Keep applying!</p>
              </div>
            ) : (
              upcomingInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="dashboard-section full-width">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>
        <ActivityFeed activities={activities} />
      </div>

      {/* Blockchain Verification Status */}
      {account && (
        <div className="blockchain-status">
          <div className="status-indicator verified">
            <span className="icon">✓</span>
            <div className="status-text">
              <strong>Blockchain Verified</strong>
              <p>All applications & interviews are recorded on BSC</p>
            </div>
          </div>
          <p className="wallet-address">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;