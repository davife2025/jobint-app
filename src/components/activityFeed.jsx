import React from 'react';
import { Briefcase, Calendar, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ applications, interviews }) => {
  // Combine and sort activities
  const activities = [
    ...applications.map(app => ({
      id: app.id,
      type: 'application',
      timestamp: new Date(app.applied_at),
      data: app
    })),
    ...interviews.map(interview => ({
      id: interview.id,
      type: 'interview',
      timestamp: new Date(interview.created_at),
      data: interview
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const getStatusColor = (status) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      interview_requested: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      offered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderActivity = (activity) => {
    if (activity.type === 'application') {
      const app = activity.data;
      return (
        <div key={activity.id} className="flex gap-4 p-4 hover:bg-gray-50">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{app.job_title}</p>
                <p className="text-sm text-gray-600">{app.company}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                  {app.blockchain_tx_hash && (
                    <a
                      href={`https://testnet.bscscan.com/tx/${app.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (activity.type === 'interview') {
      const interview = activity.data;
      return (
        <div key={activity.id} className="flex gap-4 p-4 hover:bg-gray-50">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">Interview Scheduled</p>
                <p className="text-sm text-gray-600">{interview.company}</p>
                <p className="text-sm text-gray-500 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(interview.scheduled_at).toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="divide-y divide-gray-200">
      {activities.length === 0 ? (
        <div className="p-8 text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No recent activity</p>
        </div>
      ) : (
        activities.slice(0, 10).map(renderActivity)
      )}
    </div>
  );
};

export default ActivityFeed;