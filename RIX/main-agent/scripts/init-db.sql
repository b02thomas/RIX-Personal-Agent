-- RIX Main Agent - Phase 6: N8N Workflow Management Database Schema
-- Enhanced database initialization for comprehensive workflow execution and analytics
-- This file creates the required tables for Phase 6 N8N workflow management features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Create N8N workflows metadata table for Phase 6 workflow management
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
    peak_hour INTEGER, -- Hour of day with most executions (0-23)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workflow_id, execution_date)
);

-- Create workflow execution queue table for managing concurrent executions
CREATE TABLE IF NOT EXISTS workflow_execution_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_type VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    conversation_id VARCHAR,
    input_data JSONB NOT NULL,
    priority INTEGER DEFAULT 1, -- 1=low, 2=normal, 3=high, 4=urgent
    status VARCHAR DEFAULT 'queued', -- queued, processing, completed, failed
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
CREATE INDEX IF NOT EXISTS idx_n8n_executions_user_id ON n8n_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_workflow_type ON n8n_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_status ON n8n_executions(status);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_created_at ON n8n_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_conversation_id ON n8n_executions(conversation_id);

CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON n8n_workflows(active);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_category ON n8n_workflows(category);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_type ON n8n_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_execution_count ON n8n_workflows(execution_count);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_success_rate ON n8n_workflows(success_rate);

CREATE INDEX IF NOT EXISTS idx_workflow_analytics_workflow_id ON workflow_analytics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_execution_date ON workflow_analytics(execution_date);
CREATE INDEX IF NOT EXISTS idx_workflow_analytics_created_at ON workflow_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_queue_status ON workflow_execution_queue(status);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_priority ON workflow_execution_queue(priority);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_scheduled_at ON workflow_execution_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_user_id ON workflow_execution_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_workflow_type ON workflow_execution_queue(workflow_type);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_n8n_executions_user_workflow ON n8n_executions(user_id, workflow_type);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_status_created ON n8n_executions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active_category ON n8n_workflows(active, category);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_status_priority ON workflow_execution_queue(status, priority);

-- Insert initial workflow metadata for Phase 6 features
INSERT INTO n8n_workflows (id, name, description, category, workflow_type, active, tags, version) VALUES
    ('workflow-master-brain', 'Master Brain', 'AI-powered general conversation and assistance', 'communication', 'master-brain', true, ARRAY['ai', 'chat', 'general'], '1.0.0'),
    ('workflow-task-management', 'Task Management', 'Task creation, tracking, and management', 'productivity', 'task-management', true, ARRAY['productivity', 'tasks', 'management'], '1.0.0'),
    ('workflow-calendar-intelligence', 'Calendar Intelligence', 'Smart calendar analysis and scheduling', 'productivity', 'calendar-intelligence', true, ARRAY['productivity', 'calendar', 'scheduling'], '1.0.0'),
    ('workflow-news-intelligence', 'News Intelligence', 'News analysis and personalized updates', 'intelligence', 'news-intelligence', true, ARRAY['intelligence', 'news', 'analysis'], '1.0.0'),
    ('workflow-voice-processing', 'Voice Processing', 'Voice transcription and processing', 'communication', 'voice-processing', true, ARRAY['communication', 'voice', 'transcription'], '1.0.0'),
    ('workflow-project-chatbot', 'Project Chatbot', 'Project-specific AI assistant', 'productivity', 'project-chatbot', true, ARRAY['productivity', 'projects', 'assistant'], '1.0.0'),
    ('workflow-morning-brief', 'Morning Brief', 'Daily briefing and summary generation', 'intelligence', 'morning-brief', true, ARRAY['intelligence', 'briefing', 'daily'], '1.0.0'),
    ('workflow-notification-management', 'Notification Management', 'Smart notification processing', 'automation', 'notification-management', true, ARRAY['automation', 'notifications', 'smart'], '1.0.0'),
    ('workflow-analytics-learning', 'Analytics Learning', 'Analytics insights and learning', 'analytics', 'analytics-learning', true, ARRAY['analytics', 'learning', 'insights'], '1.0.0'),
    -- Phase 5 Intelligence Features
    ('workflow-routine-coaching', 'Routine Coaching', 'AI-powered routine optimization and coaching', 'intelligence', 'routine-coaching', true, ARRAY['intelligence', 'coaching', 'routines'], '1.0.0'),
    ('workflow-project-intelligence', 'Project Intelligence', 'Project health analysis and insights', 'intelligence', 'project-intelligence', true, ARRAY['intelligence', 'projects', 'health'], '1.0.0'),
    ('workflow-calendar-optimization', 'Calendar Optimization', 'Calendar optimization and scheduling', 'productivity', 'calendar-optimization', true, ARRAY['productivity', 'calendar', 'optimization'], '1.0.0')
ON CONFLICT (id) DO NOTHING;

-- Create function to update workflow metrics
CREATE OR REPLACE FUNCTION update_workflow_metrics(
    p_workflow_id VARCHAR,
    p_execution_time FLOAT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_ai_triggered BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
    current_stats RECORD;
    new_exec_count INTEGER;
    new_ai_count INTEGER;
    new_success_rate FLOAT;
    new_avg_time FLOAT;
    new_error_rate FLOAT;
BEGIN
    -- Get current workflow stats
    SELECT execution_count, ai_triggered_count, success_rate, average_execution_time, error_rate
    INTO current_stats
    FROM n8n_workflows
    WHERE id = p_workflow_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate new metrics
    new_exec_count := current_stats.execution_count + 1;
    new_ai_count := current_stats.ai_triggered_count + (CASE WHEN p_ai_triggered THEN 1 ELSE 0 END);
    
    -- Calculate success rate
    IF current_stats.execution_count = 0 THEN
        new_success_rate := CASE WHEN p_success THEN 1.0 ELSE 0.0 END;
        new_error_rate := CASE WHEN p_success THEN 0.0 ELSE 1.0 END;
    ELSE
        new_success_rate := (current_stats.success_rate * current_stats.execution_count + (CASE WHEN p_success THEN 1 ELSE 0 END)) / new_exec_count;
        new_error_rate := 1.0 - new_success_rate;
    END IF;
    
    -- Calculate average execution time
    IF p_execution_time IS NOT NULL THEN
        IF current_stats.execution_count = 0 THEN
            new_avg_time := p_execution_time;
        ELSE
            new_avg_time := (current_stats.average_execution_time * current_stats.execution_count + p_execution_time) / new_exec_count;
        END IF;
    ELSE
        new_avg_time := current_stats.average_execution_time;
    END IF;
    
    -- Update workflow metrics
    UPDATE n8n_workflows
    SET execution_count = new_exec_count,
        ai_triggered_count = new_ai_count,
        success_rate = new_success_rate,
        error_rate = new_error_rate,
        average_execution_time = new_avg_time,
        last_execution_at = NOW(),
        updated_at = NOW()
    WHERE id = p_workflow_id;
    
    -- Update daily analytics
    INSERT INTO workflow_analytics (workflow_id, execution_date, total_executions, successful_executions, failed_executions, ai_triggered_executions, average_execution_time, total_processing_time)
    VALUES (
        p_workflow_id,
        CURRENT_DATE,
        1,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 0 ELSE 1 END,
        CASE WHEN p_ai_triggered THEN 1 ELSE 0 END,
        COALESCE(p_execution_time, 0.0),
        COALESCE(p_execution_time, 0.0)
    )
    ON CONFLICT (workflow_id, execution_date)
    DO UPDATE SET
        total_executions = workflow_analytics.total_executions + 1,
        successful_executions = workflow_analytics.successful_executions + (CASE WHEN p_success THEN 1 ELSE 0 END),
        failed_executions = workflow_analytics.failed_executions + (CASE WHEN p_success THEN 0 ELSE 1 END),
        ai_triggered_executions = workflow_analytics.ai_triggered_executions + (CASE WHEN p_ai_triggered THEN 1 ELSE 0 END),
        average_execution_time = (workflow_analytics.average_execution_time * workflow_analytics.total_executions + COALESCE(p_execution_time, 0.0)) / (workflow_analytics.total_executions + 1),
        total_processing_time = workflow_analytics.total_processing_time + COALESCE(p_execution_time, 0.0),
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old execution data
CREATE OR REPLACE FUNCTION cleanup_old_executions(retention_days INTEGER DEFAULT 30) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old execution records
    DELETE FROM n8n_executions
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old analytics data (keep longer for reporting)
    DELETE FROM workflow_analytics
    WHERE execution_date < CURRENT_DATE - INTERVAL '1 day' * (retention_days * 3);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get workflow performance summary
CREATE OR REPLACE FUNCTION get_workflow_performance_summary(days INTEGER DEFAULT 7)
RETURNS TABLE (
    workflow_id VARCHAR,
    workflow_name VARCHAR,
    category VARCHAR,
    total_executions BIGINT,
    successful_executions BIGINT,
    failed_executions BIGINT,
    ai_triggered_executions BIGINT,
    success_rate FLOAT,
    avg_execution_time FLOAT,
    error_rate FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.category,
        COALESCE(SUM(wa.total_executions), 0)::BIGINT,
        COALESCE(SUM(wa.successful_executions), 0)::BIGINT,
        COALESCE(SUM(wa.failed_executions), 0)::BIGINT,
        COALESCE(SUM(wa.ai_triggered_executions), 0)::BIGINT,
        CASE 
            WHEN COALESCE(SUM(wa.total_executions), 0) > 0 
            THEN COALESCE(SUM(wa.successful_executions), 0)::FLOAT / COALESCE(SUM(wa.total_executions), 1)::FLOAT
            ELSE 0.0
        END,
        COALESCE(AVG(wa.average_execution_time), 0.0)::FLOAT,
        CASE 
            WHEN COALESCE(SUM(wa.total_executions), 0) > 0 
            THEN COALESCE(SUM(wa.failed_executions), 0)::FLOAT / COALESCE(SUM(wa.total_executions), 1)::FLOAT
            ELSE 0.0
        END
    FROM n8n_workflows w
    LEFT JOIN workflow_analytics wa ON w.id = wa.workflow_id 
        AND wa.execution_date >= CURRENT_DATE - INTERVAL '1 day' * days
    WHERE w.active = true
    GROUP BY w.id, w.name, w.category
    ORDER BY COALESCE(SUM(wa.total_executions), 0) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Log initialization completion
INSERT INTO n8n_executions (id, user_id, workflow_type, status, output_data, created_at)
VALUES ('init-db-script', 'system', 'database-initialization', 'completed', 
        '{"message": "Phase 6 N8N workflow management database schema initialized successfully"}', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create initial admin user preferences (if users table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        INSERT INTO user_preferences (user_id, preferences, created_at, updated_at)
        VALUES ('admin', '{"workflow_notifications": true, "ai_triggered_workflows": true, "analytics_enabled": true}', NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

COMMIT;