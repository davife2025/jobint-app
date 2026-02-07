import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, User, ExternalLink } from 'lucide-react';
import api from '../services/api';
import '../styles/interviews.css';

function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await api.get('/interviews');
      setInterviews(response.data.interviews || []);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const now = new Date();
    const interviewDate = new Date(interview.scheduled_at || interview.scheduledAt);
    
    if (filter === 'upcoming') return interviewDate >= now;
    if (filter === 'past') return interviewDate < now;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatInterviewTime = (date) => {
    const interviewDate = new Date(date);
    return {
      date: interviewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: interviewDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      day: interviewDate.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interviews...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and prepare for your upcoming interviews
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Calendar className="w-4 h-4 mr-2" />
                Sync Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['upcoming', 'all', 'past'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`${
                  filter === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab === 'upcoming' 
                    ? interviews.filter(i => new Date(i.scheduled_at || i.scheduledAt) >= new Date()).length
                    : tab === 'past'
                    ? interviews.filter(i => new Date(i.scheduled_at || i.scheduledAt) < new Date()).length
                    : interviews.length
                  }
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Interviews List */}
        {filteredInterviews.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No {filter !== 'all' && filter} interviews
            </h3>
            <p className="mt-1 text-gray-500">
              {filter === 'upcoming' 
                ? "You don't have any upcoming interviews scheduled."
                : "No interviews found in this category."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => {
              const timeInfo = formatInterviewTime(interview.scheduled_at || interview.scheduledAt);
              const isUpcoming = new Date(interview.scheduled_at || interview.scheduledAt) >= new Date();
              
              return (
                <div
                  key={interview.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {interview.position || interview.job_title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status || 'scheduled')}`}>
                          {interview.status || 'scheduled'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 flex items-center gap-2">
                        <span className="font-medium">{interview.company}</span>
                        {interview.interviewer_name && (
                          <>
                            <span>•</span>
                            <User className="w-3 h-3" />
                            <span>{interview.interviewer_name}</span>
                          </>
                        )}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{timeInfo.day}, {timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{timeInfo.time}</span>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{interview.location}</span>
                          </div>
                        )}
                        {interview.blockchain_tx_hash && (
                          <div className="flex items-center gap-1">
                            <a 
                              href={`https://testnet.bscscan.com/tx/${interview.blockchain_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              ⛓️ Verified on BSC
                            </a>
                          </div>
                        )}
                      </div>

                      {interview.notes && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                          <p className="text-sm text-gray-700">{interview.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {isUpcoming && interview.meeting_link && (
                        <a
                          href={interview.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      )}
                      <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Interviews;