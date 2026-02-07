import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, change }) => {
  const colorClasses = {
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} bg-opacity-10 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      {change && (
        <p className="text-sm text-gray-500 mt-4">{change}</p>
      )}
    </div>
  );
};

export default StatsCard;