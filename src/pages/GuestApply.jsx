// src/pages/GuestApply.jsx - NEW PAGE

import React from 'react';
import { useNavigate } from 'react-router-dom';
import GuestApplicationForm from '../components/GuestApplicationForm';
import { ArrowLeft, Briefcase } from 'lucide-react';

const GuestApply = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simple Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">JobInt</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8">
        <GuestApplicationForm 
          onSuccess={(token) => {
            console.log('Application submitted with token:', token);
          }}
        />
      </div>

      {/* Info Footer */}
      <div className="max-w-4xl mx-auto px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Why submit as a guest?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900 mb-1">⚡ Instant Start</p>
              <p>No account creation - apply in under 2 minutes</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">🔒 Privacy First</p>
              <p>Your data is encrypted and blockchain-verified</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">📊 Track Anytime</p>
              <p>Use your tracking token to check status 24/7</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Want more features? <button onClick={() => navigate('/register')} className="text-blue-600 hover:underline font-medium">Create a free account</button> for unlimited applications, auto-matching, and calendar integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestApply;