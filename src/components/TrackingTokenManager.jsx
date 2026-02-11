// src/components/TrackingTokenManager.jsx - NEW COMPONENT

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Key, Plus, Trash2, Check, X } from 'lucide-react';

const TrackingTokenManager = () => {
  const { trackingTokens, addTrackingToken, removeTrackingToken, setCurrentTrackingToken, getCurrentTrackingToken } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newToken, setNewToken] = useState('');
  const currentToken = getCurrentTrackingToken();

  const handleAddToken = () => {
    if (newToken.trim()) {
      addTrackingToken(newToken.trim());
      setNewToken('');
      setShowAddForm(false);
    }
  };

  const handleSetCurrent = (token) => {
    setCurrentTrackingToken(token);
  };

  const handleRemove = (token) => {
    if (window.confirm('Are you sure you want to remove this tracking token?')) {
      removeTrackingToken(token);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Tracking Tokens
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Token
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Tracking Token
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Paste your tracking token here..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleAddToken}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewToken('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {trackingTokens.length === 0 ? (
        <div className="text-center py-8">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No tracking tokens yet</p>
          <p className="text-sm text-gray-400">
            Submit an application to get a tracking token
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {trackingTokens.map((item, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg flex items-center justify-between ${
                item.token === currentToken
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.token === currentToken && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-600 text-white">
                      Active
                    </span>
                  )}
                  {item.jobTitle && (
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.jobTitle} - {item.company}
                    </p>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-600 truncate">
                  {item.token}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {item.token !== currentToken && (
                  <button
                    onClick={() => handleSetCurrent(item.token)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => handleRemove(item.token)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Keep your tracking tokens safe! They allow you to check your application status without creating an account.
        </p>
      </div>
    </div>
  );
};

export default TrackingTokenManager;