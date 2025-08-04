-- init-complete-db.sql
-- Complete RIX Personal Agent database initialization
-- Combines all Phase 1-6 database schemas including N8N workflow management
-- RELEVANT FILES: RIX/src/lib/database.ts, main-agent/scripts/init-db.sql, docker-compose.yml

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- Core RIX Tables (Phase 1-4)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table with vector embeddings
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_from_ai BOOLEAN DEFAULT FALSE,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(255),
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'de',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  voice_enabled BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create projects table - Core feature for project management
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  color VARCHAR(7) DEFAULT '#60A5FA',
  ai_health_score INTEGER CHECK (ai_health_score >= 0 AND ai_health_score <= 100),
  start_date DATE,
  end_date DATE,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create routines table - Core feature for habit tracking
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) DEFAULT 'daily',
  time_of_day TIME,
  duration_minutes INTEGER,
  habits JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create daily_routine_completions table - Track routine completion
CREATE TABLE IF NOT EXISTS daily_routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  habits_completed JSONB DEFAULT '{}',
  total_habits INTEGER DEFAULT 0,
  completed_habits INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(routine_id, completion_date)
);

-- Phase 5: Intelligence Features

-- Create knowledge_entries table with vector embeddings
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'insight' CHECK (type IN ('routine', 'project', 'calendar', 'insight')),
  relevance DECIMAL(3,2) DEFAULT 0.0 CHECK (relevance >= 0 AND relevance <= 1),
  last_accessed TIMESTAMP DEFAULT NOW(),
  tags TEXT[],
  source VARCHAR(255),
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_goals table with AI insights
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'productivity' CHECK (category IN ('productivity', 'health', 'learning', 'career')),
  target INTEGER NOT NULL CHECK (target > 0),
  current INTEGER DEFAULT 0 CHECK (current >= 0),
  unit VARCHAR(50) NOT NULL,
  deadline DATE NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  ai_insights JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create routine_analytics table for performance tracking
CREATE TABLE IF NOT EXISTS routine_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  completion_rate DECIMAL(5,2) DEFAULT 0.0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  consistency_score DECIMAL(5,2) DEFAULT 0.0 CHECK (consistency_score >= 0 AND consistency_score <= 100),
  performance_trend VARCHAR(20) DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'declining', 'stable')),
  insights JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, routine_id, analysis_date)
);

-- Phase 6: N8N Workflow Management

-- Create N8N workflow executions table for tracking all workflow runs
CREATE TABLE IF NOT EXISTS n8n_executions (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    workflow_type VARCHAR NOT NULL,
    conversation_id VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'running',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    processing_time FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create N8N workflows metadata table
CREATE TABLE IF NOT EXISTS n8n_workflows (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR DEFAULT 'general',
    workflow_type VARCHAR,
    active BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    version VARCHAR DEFAULT '1.0.0',
    execution_count INTEGER DEFAULT 0,
    last_execution_at TIMESTAMP,
    ai_triggered_count INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    average_execution_time FLOAT DEFAULT 0.0,
    error_rate FLOAT DEFAULT 0.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name)
);

-- Create workflow analytics table for tracking performance metrics
CREATE TABLE IF NOT EXISTS workflow_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR NOT NULL,
    execution_date DATE NOT NULL,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    ai_triggered_executions INTEGER DEFAULT 0,
    average_execution_time FLOAT DEFAULT 0.0,
    total_processing_time FLOAT DEFAULT 0.0,
    peak_hour INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workflow_id, execution_date)
);

-- Create workflow execution queue table
CREATE TABLE IF NOT EXISTS workflow_execution_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_type VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    conversation_id VARCHAR,
    input_data JSONB NOT NULL,
    priority INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'queued',
    scheduled_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_id VARCHAR,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_active ON routines(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_completions_routine ON daily_routine_completions(routine_id);
CREATE INDEX IF NOT EXISTS idx_daily_completions_date ON daily_routine_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);

-- Phase 5: Intelligence Features - Vector and performance indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_user_id ON knowledge_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_type ON knowledge_entries(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_embedding ON knowledge_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_category ON user_goals(category);
CREATE INDEX IF NOT EXISTS idx_user_goals_deadline ON user_goals(deadline);
CREATE INDEX IF NOT EXISTS idx_routine_analytics_user_id ON routine_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_analytics_routine_id ON routine_analytics(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_analytics_date ON routine_analytics(analysis_date);

-- N8N workflow indexes
CREATE INDEX IF NOT EXISTS idx_n8n_executions_user_id ON n8n_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_workflow_type ON n8n_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_status ON n8n_executions(status);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_created_at ON n8n_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON n8n_workflows(active);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_category ON n8n_workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_workflow_id ON workflow_analytics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_execution_date ON workflow_analytics(execution_date);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_status ON workflow_execution_queue(status);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_priority ON workflow_execution_queue(priority);

-- Insert initial workflow metadata
INSERT INTO n8n_workflows (id, name, description, category, workflow_type, active, tags, version) VALUES
    ('workflow-master-brain', 'Master Brain', 'AI-powered general conversation and assistance', 'communication', 'master-brain', true, ARRAY['ai', 'chat', 'general'], '1.0.0'),
    ('workflow-task-management', 'Task Management', 'Task creation, tracking, and management', 'productivity', 'task-management', true, ARRAY['productivity', 'tasks', 'management'], '1.0.0'),
    ('workflow-calendar-intelligence', 'Calendar Intelligence', 'Smart calendar analysis and scheduling', 'productivity', 'calendar-intelligence', true, ARRAY['productivity', 'calendar', 'scheduling'], '1.0.0'),
    ('workflow-news-intelligence', 'News Intelligence', 'News analysis and personalized updates', 'intelligence', 'news-intelligence', true, ARRAY['intelligence', 'news', 'analysis'], '1.0.0'),
    ('workflow-voice-processing', 'Voice Processing', 'Voice transcription and processing', 'communication', 'voice-processing', true, ARRAY['communication', 'voice', 'transcription'], '1.0.0'),
    ('workflow-project-chatbot', 'Project Chatbot', 'Project-specific AI assistant', 'productivity', 'project-chatbot', true, ARRAY['productivity', 'projects', 'assistant'], '1.0.0'),
    ('workflow-routine-coaching', 'Routine Coaching', 'AI-powered routine optimization and coaching', 'intelligence', 'routine-coaching', true, ARRAY['intelligence', 'coaching', 'routines'], '1.0.0'),
    ('workflow-project-intelligence', 'Project Intelligence', 'Project health analysis and insights', 'intelligence', 'project-intelligence', true, ARRAY['intelligence', 'projects', 'health'], '1.0.0'),
    ('workflow-calendar-optimization', 'Calendar Optimization', 'Calendar optimization and scheduling', 'productivity', 'calendar-optimization', true, ARRAY['productivity', 'calendar', 'optimization'], '1.0.0')
ON CONFLICT (id) DO NOTHING;

-- Create default admin user for testing
INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'admin@rix.com', '$2b$10$rGJZQQQQQQQQQQQQQQQQQOvVy5K5K5K5K5K5K5K5K5K5K5K5', 'Admin', 'User')
ON CONFLICT (email) DO NOTHING;

-- Create default preferences for admin user
INSERT INTO user_preferences (user_id, preferences) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', '{"workflow_notifications": true, "ai_triggered_workflows": true, "analytics_enabled": true}')
ON CONFLICT (user_id) DO NOTHING;

-- Log initialization completion
INSERT INTO n8n_executions (id, user_id, workflow_type, status, output_data, created_at)
VALUES ('init-complete-db', 'system', 'database-initialization', 'completed', 
        '{"message": "Complete RIX Personal Agent database schema initialized successfully"}', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;