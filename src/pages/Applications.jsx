// src/pages/Applications.jsx - UPDATED FOR GUEST MODE

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, CheckCircle, Clock, XCircle, Award, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI, guestAPI } from '../services/api';
import TrackingTokenManager from '../components/TrackingTokenManager';

function Applications() {
  const { isAuthenticated, isGuestMode, getCurrentTrackingToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [isGuestMode, isAuthenticated]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      if (isGuestMode) {
        // Fetch guest applications using tracking token
        const trackingToken = getCurrentTrackingToken();
        if (trackingToken) {
          const response = await guestAPI.trackApplications(trackingToken);
          setApplications(response.data.applications || []);
        } else {
          setApplications([]);
        }
      } else if (isAuthenticated) {
        // Fetch authenticated user applications
        const response = await applicationsAPI.getApplications();
        setApplications(response.data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusConfig = {
      applied: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Applied' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      interview_requested: { color: 'bg-yellow-100 text-yellow-800', icon: Calendar, label: 'Interview Requested' },
      interview_scheduled: { color: 'bg-purple-100 text-purple-800', icon: Calendar, label: 'Interview Scheduled' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      offered: { color: 'bg-green-100 text-green-800', icon: Award, label: 'Offer Received' }
    };
    return statusConfig[status] || statusConfig.applied;
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filter === 'all' || app.status === filter;
    const matchesSearch = searchQuery === '' || 
      app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied' || a.status === 'pending').length,
    interviewing: applications.filter(a => a.status === 'interview_requested' || a.status === 'interview_scheduled').length,
    offered: applications.filter(a => a.status === 'offered').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                {isGuestMode ? 'Your Applications' : 'Applications'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isGuestMode 
                  ? 'Tracking your guest applications'
                  : 'Track all your job applications in one place'
                }
              </p>
            </div>
            {!isGuestMode && (
              <div className="mt-4 flex gap-3 md:mt-0 md:ml-4">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  📊 Export Data
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  ➕ Manual Application
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guest Mode Banner */}
        {isGuestMode && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  You're in Guest Mode
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Create a free account to unlock unlimited applications, auto-matching, and more features.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/register'}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <StatsCard title="Total" value={stats.total} color="blue" />
              <StatsCard title="Applied" value={stats.applied} color="gray" />
              <StatsCard title="Interviewing" value={stats.interviewing} color="purple" />
              <StatsCard title="Offers" value={stats.offered} color="green" />
              <StatsCard title="Rejected" value={stats.rejected} color="red" />
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by company or position..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="applied">Applied</option>
                    <option value="pending">Pending</option>
                    <option value="interview_requested">Interview Requested</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="text-6xl mb-4">🔭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? "Try adjusting your search criteria"
                    : isGuestMode
                    ? "Submit your first application to get started"
                    : "Start applying to jobs to see them here"
                  }
                </p>
                {isGuestMode && (
                  <button
                    onClick={() => window.location.href = '/guest-apply'}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Application
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((application) => {
                  const statusInfo = getStatusInfo(application.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div
                      key={application.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.position || application.job_title}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                            {application.match_score && (
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {Math.round(application.match_score * 100)}% Match
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-3 flex items-center gap-2">
                            <span className="font-medium">{application.company}</span>
                            {application.location && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {application.location}
                                </span>
                              </>
                            )}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Applied {new Date(application.applied_at || application.createdAt).toLocaleDateString()}</span>
                            </div>
                            {application.cover_letter_generated && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>AI Cover Letter</span>
                              </div>
                            )}
                            {application.blockchain_tx_hash && (
                              <div className="flex items-center gap-1">
                                <a 
                                  href={`https://testnet.bscscan.com/tx/${application.blockchain_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  ⛓️ Verified on BSC
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {application.job_url && (
                            <a
                              href={application.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Job
                            </a>
                          )}
                          {application.cover_letter_text && (
                            <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                              📝 Cover Letter
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {isGuestMode && (
            <div className="lg:col-span-1">
              <TrackingTokenManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    gray: 'from-gray-500 to-gray-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-sm p-5 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-90">{title}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default Applications;