// src/components/GuestApplicationForm.jsx - FIXED VERSION

import React, { useState } from 'react';
import guestAPI from '../api/guestAPI';

const GuestApplicationForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    jobTitles: '',
    remotePreference: 'any'
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    // ✅ Validate file
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB');
        return;
      }
      
      setResumeFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ✅ Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!resumeFile) {
      setError('Please upload your CV');
      return;
    }

    try {
      setLoading(true);

      // ✅ Create FormData with exact field names backend expects
      const payload = new FormData();
      
      payload.append('firstName', formData.firstName.trim());
      payload.append('lastName', formData.lastName.trim());
      payload.append('email', formData.email.trim());
      payload.append('phone', formData.phone.trim());
      payload.append('location', formData.location.trim());
      payload.append('jobTitles', formData.jobTitles.trim());
      payload.append('remotePreference', formData.remotePreference);
      
      // ✅ Backend expects 'file' field name
      payload.append('file', resumeFile);

      // ✅ Debug: Log what we're sending
      console.log('📤 Submitting application:');
      console.log('- First Name:', formData.firstName);
      console.log('- Email:', formData.email);
      console.log('- File:', resumeFile.name, resumeFile.type, resumeFile.size);

      const response = await guestAPI.submitApplication(payload);

      console.log('✅ Submission successful:', response.data);

      setSuccess(
        'Application submitted successfully! Please check your email for your tracking link.'
      );

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        jobTitles: '',
        remotePreference: 'any'
      });
      setResumeFile(null);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('❌ Submission error:', err);
      console.error('Error response:', err.response?.data);
      
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to submit application. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Apply as a Guest</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="John"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="john.doe@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="San Francisco, CA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Job Titles
          </label>
          <input
            type="text"
            name="jobTitles"
            value={formData.jobTitles}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Software Engineer, Full Stack Developer"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple titles with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remote Preference
          </label>
          <select
            name="remotePreference"
            value={formData.remotePreference}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="any">Any</option>
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload CV <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            PDF or Word document, max 5MB
          </p>
          {resumeFile && (
            <p className="mt-1 text-sm text-green-600">
              ✓ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)}KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Application'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> After submitting, you'll receive an email with a tracking link 
          to monitor your application status.
        </p>
      </div>
    </div>
  );
};

export default GuestApplicationForm;