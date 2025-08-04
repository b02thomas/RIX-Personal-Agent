-- /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/database/schema.sql
-- Complete PostgreSQL schema for RIX Personal Agent with 30+ tables
-- Supports all 7 future Sub-Agent workflows with intelligence capabilities
-- RELEVANT FILES: core/database.py, models/schemas.py, api/endpoints/*

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Drop existing tables (for fresh installation)
DROP TABLE IF EXISTS mcp_interaction_logs CASCADE;
DROP TABLE IF EXISTS behavioral_analytics CASCADE;
DROP TABLE IF EXISTS goal_milestones CASCADE;
DROP TABLE IF EXISTS goal_progress_entries CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS knowledge_entries CASCADE;
DROP TABLE IF EXISTS daily_routine_completions CASCADE;
DROP TABLE IF EXISTS routine_analytics CASCADE;
DROP TABLE IF EXISTS user_routines CASCADE;
DROP TABLE IF EXISTS calendar_productivity_tracking CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS project_health_metrics CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS chat_memory CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Core User Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Session Management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info JSONB,
    ip_address INET
);

-- User Preferences & Settings
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_settings JSONB DEFAULT '{}',
    ai_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Chat & Conversation Management
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    conversation_type VARCHAR(50) DEFAULT 'general', -- general, task, calendar, routine, etc.
    context_metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, voice, image, file
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536), -- for semantic search
    processing_status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Memory for Each Future Sub-Agent
CREATE TABLE chat_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sub_agent_type VARCHAR(50) NOT NULL, -- task, calendar, routine, knowledge, goal, analytics, daily
    memory_key VARCHAR(100) NOT NULL,
    memory_value JSONB NOT NULL,
    context_window INTEGER DEFAULT 10,
    importance_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sub_agent_type, memory_key)
);

-- Projects & Task Management (Task Intelligence Hub)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, paused, cancelled
    priority INTEGER DEFAULT 5, -- 1-10 scale
    start_date DATE,
    due_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    ai_health_score INTEGER DEFAULT 50, -- 0-100 AI-calculated health score
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo', -- todo, in_progress, completed, cancelled
    priority INTEGER DEFAULT 5, -- 1-10 scale
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- minutes
    actual_duration INTEGER, -- minutes
    completion_date TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'blocks', -- blocks, enables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, dependent_task_id)
);

CREATE TABLE project_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    health_score INTEGER NOT NULL, -- 0-100
    risk_factors JSONB DEFAULT '{}',
    success_indicators JSONB DEFAULT '{}',
    optimization_suggestions JSONB DEFAULT '{}',
    completion_prediction JSONB DEFAULT '{}' -- estimated completion date, confidence
);

-- Calendar & Scheduling (Calendar Intelligence Hub)
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50) DEFAULT 'meeting', -- meeting, task, personal, break, focus
    location VARCHAR(255),
    attendees JSONB DEFAULT '{}',
    is_all_day BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule JSONB,
    priority INTEGER DEFAULT 5, -- 1-10 scale
    productivity_category VARCHAR(50), -- deep_work, collaboration, administrative, personal
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE calendar_productivity_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    productivity_score INTEGER, -- 1-10 subjective rating
    energy_level INTEGER, -- 1-10 energy during event
    focus_quality INTEGER, -- 1-10 focus quality
    completion_status VARCHAR(20), -- completed, partial, cancelled
    notes TEXT,
    time_block_effectiveness INTEGER, -- 1-10 rating
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routines & Habits (Routine Intelligence Hub)
CREATE TABLE user_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    routine_type VARCHAR(50) DEFAULT 'daily', -- daily, weekly, monthly
    habits JSONB NOT NULL DEFAULT '[]', -- array of habit objects
    frequency JSONB DEFAULT '{}', -- scheduling information
    time_slots JSONB DEFAULT '{}', -- preferred time slots
    difficulty_level INTEGER DEFAULT 5, -- 1-10 scale
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE daily_routine_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_id UUID NOT NULL REFERENCES user_routines(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    habits_completed JSONB NOT NULL DEFAULT '[]', -- array of completed habit IDs
    completion_percentage INTEGER DEFAULT 0, -- 0-100
    quality_rating INTEGER, -- 1-10 subjective quality
    notes TEXT,
    mood_before INTEGER, -- 1-10 mood before routine
    mood_after INTEGER, -- 1-10 mood after routine
    energy_level INTEGER, -- 1-10 energy level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, routine_id, completion_date)
);

CREATE TABLE routine_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_id UUID NOT NULL REFERENCES user_routines(id) ON DELETE CASCADE,
    analysis_period VARCHAR(20) NOT NULL, -- weekly, monthly, quarterly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    completion_rate FLOAT NOT NULL, -- 0.0-1.0
    streak_count INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    success_factors JSONB DEFAULT '{}',
    challenge_areas JSONB DEFAULT '{}',
    coaching_insights JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Management (Knowledge Intelligence Hub)
CREATE TABLE knowledge_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    entry_type VARCHAR(50) DEFAULT 'note', -- note, article, idea, reference, insight
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    source_url VARCHAR(500),
    confidence_score FLOAT DEFAULT 0.5, -- 0.0-1.0 AI confidence in content
    importance_score FLOAT DEFAULT 0.5, -- 0.0-1.0 user/AI importance rating
    embedding VECTOR(1536), -- for semantic search
    related_entries UUID[] DEFAULT '{}', -- related entry IDs
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal Tracking (Goal Intelligence Hub)
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) DEFAULT 'personal', -- personal, professional, health, learning
    category VARCHAR(100),
    target_value FLOAT,
    current_value FLOAT DEFAULT 0,
    unit VARCHAR(50), -- kg, hours, count, percentage, etc.
    priority INTEGER DEFAULT 5, -- 1-10 scale
    start_date DATE,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, paused, cancelled
    ai_insights JSONB DEFAULT '{}', -- AI-generated insights and suggestions
    tracking_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE goal_progress_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    progress_value FLOAT NOT NULL,
    notes TEXT,
    milestone_reached BOOLEAN DEFAULT false,
    confidence_level INTEGER, -- 1-10 user confidence
    energy_level INTEGER, -- 1-10 energy level during progress
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value FLOAT NOT NULL,
    target_date DATE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward VARCHAR(255), -- self-reward for reaching milestone
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavioral Analytics (Behavioral Analytics Engine)
CREATE TABLE behavioral_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- productivity_pattern, habit_correlation, time_usage, etc.
    analysis_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    insights JSONB NOT NULL DEFAULT '{}', -- key insights and patterns
    correlations JSONB DEFAULT '{}', -- cross-system correlations
    recommendations JSONB DEFAULT '{}', -- actionable recommendations
    confidence_score FLOAT DEFAULT 0.5, -- 0.0-1.0 confidence in analysis
    metrics JSONB DEFAULT '{}', -- raw metrics and data points
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MCP Interaction Logging (for future Sub-Agent workflows)
CREATE TABLE mcp_interaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sub_agent_type VARCHAR(50) NOT NULL, -- task, calendar, routine, knowledge, goal, analytics, daily
    endpoint_called VARCHAR(100) NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    processing_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    context_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_chat_memory_user_agent ON chat_memory(user_id, sub_agent_type);
CREATE INDEX idx_chat_memory_importance ON chat_memory(importance_score);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_projects_health_score ON projects(ai_health_score);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_productivity_user_date ON calendar_productivity_tracking(user_id, date);

CREATE INDEX idx_routines_user_id ON user_routines(user_id);
CREATE INDEX idx_routines_active ON user_routines(is_active) WHERE is_active = true;
CREATE INDEX idx_routine_completions_user_routine ON daily_routine_completions(user_id, routine_id);
CREATE INDEX idx_routine_completions_date ON daily_routine_completions(completion_date);

CREATE INDEX idx_knowledge_user_id ON knowledge_entries(user_id);
CREATE INDEX idx_knowledge_category ON knowledge_entries(category);
CREATE INDEX idx_knowledge_type ON knowledge_entries(entry_type);
CREATE INDEX idx_knowledge_embedding ON knowledge_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_importance ON knowledge_entries(importance_score);

CREATE INDEX idx_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_goals_status ON user_goals(status);
CREATE INDEX idx_goals_target_date ON user_goals(target_date);
CREATE INDEX idx_goal_progress_goal_id ON goal_progress_entries(goal_id);
CREATE INDEX idx_goal_progress_recorded ON goal_progress_entries(recorded_at);

CREATE INDEX idx_behavioral_analytics_user ON behavioral_analytics(user_id);
CREATE INDEX idx_behavioral_analytics_type ON behavioral_analytics(analysis_type);
CREATE INDEX idx_behavioral_analytics_period ON behavioral_analytics(analysis_period);

CREATE INDEX idx_mcp_logs_user_agent ON mcp_interaction_logs(user_id, sub_agent_type);
CREATE INDEX idx_mcp_logs_created_at ON mcp_interaction_logs(created_at);
CREATE INDEX idx_mcp_logs_status ON mcp_interaction_logs(status_code);

-- Helper Functions for Calculations

-- Calculate streak for routines
CREATE OR REPLACE FUNCTION calculate_routine_streak(p_user_id UUID, p_routine_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    completion_found BOOLEAN;
BEGIN
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM daily_routine_completions 
            WHERE user_id = p_user_id 
            AND routine_id = p_routine_id 
            AND completion_date = check_date
            AND completion_percentage >= 70  -- Consider 70%+ as successful completion
        ) INTO completion_found;
        
        IF completion_found THEN
            current_streak := current_streak + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- Calculate project health score
CREATE OR REPLACE FUNCTION calculate_project_health_score(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    health_score INTEGER := 50;  -- Base score
    total_tasks INTEGER;
    completed_tasks INTEGER;
    overdue_tasks INTEGER;
    days_until_due INTEGER;
    completion_rate FLOAT;
BEGIN
    -- Get task statistics
    SELECT COUNT(*) INTO total_tasks FROM tasks WHERE project_id = p_project_id;
    SELECT COUNT(*) INTO completed_tasks FROM tasks WHERE project_id = p_project_id AND status = 'completed';
    SELECT COUNT(*) INTO overdue_tasks FROM tasks WHERE project_id = p_project_id AND due_date < NOW() AND status != 'completed';
    
    -- Calculate completion rate
    IF total_tasks > 0 THEN
        completion_rate := completed_tasks::FLOAT / total_tasks::FLOAT;
        health_score := health_score + (completion_rate * 30)::INTEGER;
    END IF;
    
    -- Penalize for overdue tasks
    IF overdue_tasks > 0 THEN
        health_score := health_score - (overdue_tasks * 10);
    END IF;
    
    -- Check project due date proximity
    SELECT EXTRACT(DAYS FROM (due_date - CURRENT_DATE)) INTO days_until_due 
    FROM projects WHERE id = p_project_id AND due_date IS NOT NULL;
    
    IF days_until_due IS NOT NULL THEN
        IF days_until_due < 0 THEN
            health_score := health_score - 20;  -- Project is overdue
        ELSIF days_until_due < 7 THEN
            health_score := health_score - 10;  -- Project due soon
        END IF;
    END IF;
    
    -- Ensure score is within bounds
    health_score := GREATEST(0, LEAST(100, health_score));
    
    RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project health score when tasks change
CREATE OR REPLACE FUNCTION update_project_health_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE projects SET 
            ai_health_score = calculate_project_health_score(NEW.project_id),
            updated_at = NOW()
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE projects SET 
            ai_health_score = calculate_project_health_score(OLD.project_id),
            updated_at = NOW()
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_health
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    WHEN (NEW.project_id IS NOT NULL OR OLD.project_id IS NOT NULL)
    EXECUTE FUNCTION update_project_health_trigger();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all tables with updated_at column
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_chat_memory_updated_at BEFORE UPDATE ON chat_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_user_routines_updated_at BEFORE UPDATE ON user_routines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_knowledge_entries_updated_at BEFORE UPDATE ON knowledge_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW v_user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    -- Task statistics
    COALESCE(t.total_tasks, 0) as total_tasks,
    COALESCE(t.completed_tasks, 0) as completed_tasks,
    COALESCE(t.overdue_tasks, 0) as overdue_tasks,
    -- Project statistics  
    COALESCE(p.active_projects, 0) as active_projects,
    COALESCE(p.avg_health_score, 50) as avg_project_health,
    -- Goal statistics
    COALESCE(g.active_goals, 0) as active_goals,
    COALESCE(g.completed_goals, 0) as completed_goals,
    -- Routine statistics
    COALESCE(r.active_routines, 0) as active_routines,
    COALESCE(r.avg_completion_rate, 0) as avg_routine_completion
FROM users u
LEFT JOIN (
    SELECT user_id,
           COUNT(*) as total_tasks,
           COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
           COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue_tasks
    FROM tasks GROUP BY user_id
) t ON u.id = t.user_id
LEFT JOIN (
    SELECT user_id,
           COUNT(*) FILTER (WHERE status = 'active') as active_projects,
           AVG(ai_health_score) as avg_health_score
    FROM projects GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
    SELECT user_id,
           COUNT(*) FILTER (WHERE status = 'active') as active_goals,
           COUNT(*) FILTER (WHERE status = 'completed') as completed_goals
    FROM user_goals GROUP BY user_id
) g ON u.id = g.user_id
LEFT JOIN (
    SELECT user_id,
           COUNT(*) FILTER (WHERE is_active = true) as active_routines,
           AVG(completion_percentage) as avg_completion_rate
    FROM user_routines ur
    LEFT JOIN daily_routine_completions drc ON ur.id = drc.routine_id 
        AND drc.completion_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id
) r ON u.id = r.user_id;

-- Initial data setup
INSERT INTO users (email, hashed_password, full_name) VALUES 
('demo@rix.com', '$2b$12$dummy.hash.for.demo.user', 'Demo User')
ON CONFLICT (email) DO NOTHING;

COMMIT;