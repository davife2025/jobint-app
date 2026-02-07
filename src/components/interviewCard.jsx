import React from 'react';
import { Calendar, Clock, MapPin, Video, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const InterviewCard = ({ interview }) => {
  const scheduledDate = new Date(interview.scheduled_at);
  const isToday = format(scheduledDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className={`border rounded-lg p-4 ${isToday ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900">{interview.job_title}</p>
          <p className="text-sm text-gray-600">{interview.company}</p>
        </div>
        {isToday && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-600 text-white">
            Today
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{format(scheduledDate, 'h:mm a')}</span>
          <span className="text-xs text-gray-500">
            ({formatDistanceToNow(scheduledDate, { addSuffix: true })})
          </span>
        </div>

        {interview.location && (
          <div className="flex items-center gap-2 text-gray-600">
            {interview.location === 'Remote' ? (
              <Video className="w-4 h-4" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span>{interview.location}</span>
          </div>
        )}

        {interview.meeting_link && (
          <div className="mt-3">
            <a
              href={interview.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Join Meeting
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewCard;