import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI, interviewsAPI, jobsAPI, notificationsAPI } from '../services/api';
import { Calendar, TrendingUp, Briefcase, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import ActivityFeed from '../components/activityFeeds';
import StatsCard from '../components/statsCard';
import InterviewCard from '../components/interviewCard';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, interviewsRes, matchesRes, appsRes, notifsRes] = await Promise.all([
        applicationsAPI.getStats(),
        interviewsAPI.getInterviews(),
        jobsAPI.getPendingMatches(),
        applicationsAPI.getApplications({ limit: 10 }),
        notificationsAPI.getNotifications(true)
      ]);

      setStats(statsRes.data.summary);
      setInterviews(interviewsRes.data.interviews.filter(i => 
        new Date(i.scheduled_at) > new Date()
      ).slice(0, 3));
      setPendingMatches(matchesRes.data.matches.slice(0, 5));
      setRecentApplications(appsRes.data.applications);
      setNotifications(notifsRes.data.notifications.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewMatch = async (matchId, approved) => {
    try {
      await jobsAPI.reviewMatch(matchId, approved);
      setPendingMatches(prev => prev.filter(m => m.id !== matchId));
      
      if (approved) {
        alert('Match approved! Application will be submitted automatically.');
      }
      
      loadDashboardData();
    } catch (error) {
      console.error('Failed to review match:', error);
      alert('Failed to review match');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name || 'there'}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your job search
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Applications"
            value={stats?.total || 0}
            icon={Briefcase}
            color="indigo"
            change={`+${stats?.applied || 0} this week`}
          />
          <StatsCard
            title="Pending Interviews"
            value={interviews.length}
            icon={Calendar}
            color="purple"
            change={interviews.length > 0 ? `Next: ${new Date(interviews[0]?.scheduled_at).toLocaleDateString()}` : 'None scheduled'}
          />
          <StatsCard
            title="Interview Rate"
            value={`${Math.round((stats?.interview_scheduled / stats?.total * 100) || 0)}%`}
            icon={TrendingUp}
            color="green"
            change="Above average"
          />
          <StatsCard
            title="Offers"
            value={stats?.offered || 0}
            icon={CheckCircle2}
            color="blue"
            change="Keep going!"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Activity Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <ActivityFeed applications={recentApplications} interviews={interviews} />
            </div>

            {/* Pending Job Matches */}
            {pendingMatches.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Job Matches Pending Review
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {pendingMatches.length} matches
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingMatches.map((match) => (
                    <div key={match.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {match.title}
                          </h3>
                          <p className="text-sm text-gray-500">{match.company}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {Math.round(match.match_score * 100)}% match
                            </span>
                            <span className="text-xs text-gray-500">
                              {match.location}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => handleReviewMatch(match.id, true)}
                            className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handleReviewMatch(match.id, false)}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Interviews */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Interviews
                </h2>
              </div>
              <div className="p-6">
                {interviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No upcoming interviews</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((interview) => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-6 py-3">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;