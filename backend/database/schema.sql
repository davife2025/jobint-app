-- JobInt Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE, -- BSC wallet address
    full_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Settings
    apply_mode VARCHAR(20) DEFAULT 'review', -- 'auto', 'review', 'whitelist'
    daily_application_limit INTEGER DEFAULT 20,
    notification_enabled BOOLEAN DEFAULT TRUE
);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Resume Data
    resume_url VARCHAR(500),
    resume_text TEXT,
    
    -- Skills & Experience
    skills JSONB, -- ["JavaScript", "React", "Node.js"]
    experience JSONB, -- [{company, role, duration, description}]
    education JSONB, -- [{degree, institution, year}]
    certifications JSONB, -- [string]
    
    -- Job Preferences
    desired_job_titles JSONB, -- ["Software Engineer", "Full Stack Developer"]
    desired_locations JSONB, -- ["Remote", "San Francisco", "New York"]
    remote_preference VARCHAR(20), -- 'remote_only', 'hybrid', 'onsite', 'any'
    salary_min INTEGER,
    salary_max INTEGER,
    desired_industries JSONB, -- ["Tech", "Finance", "Healthcare"]
    
    -- Availability
    available_start_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Calendar Tokens Table (for Google Calendar integration)
CREATE TABLE calendar_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, provider)
);

-- Job Listings Table
CREATE TABLE job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Job Details
    external_id VARCHAR(255), -- ID from source platform
    source VARCHAR(50) NOT NULL, -- 'linkedin', 'indeed', 'glassdoor', 'angellist'
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    job_type VARCHAR(50), -- 'full_time', 'part_time', 'contract'
    remote_type VARCHAR(50), -- 'remote', 'hybrid', 'onsite'
    
    -- Description
    description TEXT,
    required_skills JSONB,
    salary_range VARCHAR(100),
    
    -- Application
    application_url TEXT NOT NULL,
    posted_date TIMESTAMP,
    expires_date TIMESTAMP,
    
    -- Metadata
    scraped_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Index for faster searches
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for job search
CREATE INDEX idx_job_listings_company ON job_listings(company);
CREATE INDEX idx_job_listings_location ON job_listings(location);
CREATE INDEX idx_job_listings_source ON job_listings(source);
CREATE INDEX idx_job_listings_posted_date ON job_listings(posted_date DESC);

-- Job Matches Table (AI matching results)
CREATE TABLE job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    
    -- Match Score
    match_score INTEGER, -- 0-100
    match_reasons JSONB, -- ["Skills match: Python, React", "Location: Remote"]
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'applied'
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_job_matches_user_status ON job_matches(user_id, status);
CREATE INDEX idx_job_matches_score ON job_matches(match_score DESC);

-- Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_listings(id) ON DELETE SET NULL,
    match_id UUID REFERENCES job_matches(id) ON DELETE SET NULL,
    
    -- Application Details
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'reviewing', 'interview_scheduled', 'rejected', 'offered'
    
    -- Blockchain
    blockchain_tx_hash VARCHAR(66), -- BSC transaction hash
    blockchain_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    applied_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT, -- If application failed
    
    -- Application data snapshot
    application_data JSONB -- Snapshot of data submitted
);

CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);

-- Interviews Table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Interview Details
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link TEXT,
    meeting_type VARCHAR(50), -- 'video', 'phone', 'onsite'
    location TEXT,
    
    -- Calendar Integration
    calendar_event_id VARCHAR(255), -- Google Calendar event ID
    
    -- Blockchain
    blockchain_tx_hash VARCHAR(66),
    blockchain_verified BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
    cancelled_at TIMESTAMP,
    
    -- Notifications
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interviews_user ON interviews(user_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX idx_interviews_status ON interviews(status);

-- Company Whitelist Table
CREATE TABLE company_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, company_name)
);

-- Application Queue Table (for async processing)
CREATE TABLE application_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    
    priority INTEGER DEFAULT 0 -- Higher = more priority
);

CREATE INDEX idx_application_queue_status ON application_queue(status, priority DESC);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'application_submitted', 'interview_scheduled', 'application_rejected'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE, -- Push notification sent
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Activity Log Table (for debugging & analytics)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- 'login', 'job_scraped', 'application_submitted'
    entity_type VARCHAR(50), -- 'user', 'application', 'job'
    entity_id UUID,
    
    details JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Functions & Triggers

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- User Dashboard View
CREATE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.apply_mode,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'interview_scheduled' THEN a.id END) as interviews_scheduled,
    COUNT(DISTINCT CASE WHEN a.status = 'offered' THEN a.id END) as offers_received,
    COUNT(DISTINCT i.id) as total_interviews,
    MAX(a.applied_at) as last_application_date
FROM users u
LEFT JOIN applications a ON u.id = a.user_id
LEFT JOIN interviews i ON u.id = i.user_id
GROUP BY u.id, u.email, u.full_name, u.apply_mode;

-- Upcoming Interviews View
CREATE VIEW upcoming_interviews AS
SELECT 
    i.id,
    i.user_id,
    u.email,
    i.scheduled_at,
    i.meeting_link,
    i.status,
    a.id as application_id,
    j.company,
    j.title as job_title
FROM interviews i
JOIN users u ON i.user_id = u.id
LEFT JOIN applications a ON i.application_id = a.id
LEFT JOIN job_listings j ON a.job_id = j.id
WHERE i.status = 'scheduled' 
  AND i.scheduled_at > NOW()
ORDER BY i.scheduled_at ASC;

-- Comments
COMMENT ON TABLE users IS 'Core user authentication and settings';
COMMENT ON TABLE user_profiles IS 'User resume, skills, and job preferences';
COMMENT ON TABLE job_listings IS 'Scraped job postings from various platforms';
COMMENT ON TABLE applications IS 'Job applications submitted by JobInt';
COMMENT ON TABLE interviews IS 'Scheduled interviews with blockchain verification';