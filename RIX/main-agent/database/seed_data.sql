-- /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/database/seed_data.sql
-- Test data for RIX Personal Agent development
-- Provides sample data for all 7 future Sub-Agent workflows
-- RELEVANT FILES: schema.sql, core/database.py, api/endpoints/*

-- Note: This assumes the demo user exists from schema.sql
-- In production, this would be replaced with actual user data

-- Get the demo user ID
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@rix.com';
    
    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'Demo user not found. Run schema.sql first.';
    END IF;

    -- User Preferences
    INSERT INTO user_preferences (user_id, theme, language, notification_settings, ai_preferences)
    VALUES (
        demo_user_id,
        'dark',
        'en',
        '{"email": true, "push": true, "routine_reminders": true, "goal_updates": true}',
        '{"coaching_style": "encouraging", "detail_level": "moderate", "reminder_frequency": "daily"}'
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Sample Conversations
    INSERT INTO conversations (user_id, title, conversation_type, context_metadata)
    VALUES 
        (demo_user_id, 'Getting Started with RIX', 'general', '{"onboarding": true}'),
        (demo_user_id, 'Project Planning Discussion', 'task', '{"project_focus": true}'),
        (demo_user_id, 'Routine Optimization Chat', 'routine', '{"coaching_session": true}')
    ON CONFLICT DO NOTHING;

    -- Sample Projects (for Task Intelligence Hub)
    INSERT INTO projects (user_id, name, description, status, priority, start_date, due_date, completion_percentage, tags)
    VALUES 
        (demo_user_id, 'RIX System Integration', 'Complete the RIX Personal Agent database integration', 'active', 9, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 75, ARRAY['work', 'development', 'high-priority']),
        (demo_user_id, 'Personal Website Redesign', 'Update personal portfolio with latest projects', 'active', 6, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '30 days', 30, ARRAY['personal', 'creative', 'web']),
        (demo_user_id, 'Fitness Challenge Q1', 'Complete quarterly fitness goals and establish routine', 'active', 7, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 45, ARRAY['health', 'personal', 'fitness'])
    ON CONFLICT DO NOTHING;

    -- Sample Tasks (for Task Intelligence Hub)
    INSERT INTO tasks (user_id, project_id, title, description, status, priority, due_date, estimated_duration, tags)
    SELECT 
        demo_user_id,
        p.id,
        task_data.title,
        task_data.description,
        task_data.status,
        task_data.priority,
        task_data.due_date,
        task_data.estimated_duration,
        task_data.tags
    FROM projects p,
    (VALUES 
        ('RIX System Integration', 'Database Schema Design', 'Create comprehensive database schema for all Sub-Agents', 'completed', 9, CURRENT_DATE + INTERVAL '1 day', 240, ARRAY['database', 'architecture']),
        ('RIX System Integration', 'API Implementation', 'Implement core APIs for tasks, calendar, routines', 'in_progress', 8, CURRENT_DATE + INTERVAL '3 days', 360, ARRAY['api', 'backend']),
        ('RIX System Integration', 'Intelligence Layer Development', 'Build pattern-based intelligence services', 'todo', 8, CURRENT_DATE + INTERVAL '7 days', 480, ARRAY['ai', 'intelligence']),
        ('Personal Website Redesign', 'Design Mockups', 'Create new design mockups for portfolio site', 'completed', 6, CURRENT_DATE + INTERVAL '5 days', 180, ARRAY['design', 'ui']),
        ('Personal Website Redesign', 'Frontend Development', 'Implement responsive design with modern framework', 'in_progress', 7, CURRENT_DATE + INTERVAL '15 days', 600, ARRAY['frontend', 'development']),
        ('Fitness Challenge Q1', 'Workout Plan Creation', 'Design comprehensive 12-week workout plan', 'completed', 7, CURRENT_DATE + INTERVAL '2 days', 120, ARRAY['planning', 'exercise']),
        ('Fitness Challenge Q1', 'Nutrition Tracking Setup', 'Set up nutrition tracking and meal planning', 'in_progress', 6, CURRENT_DATE + INTERVAL '10 days', 90, ARRAY['nutrition', 'health'])
    ) AS task_data(project_name, title, description, status, priority, due_date, estimated_duration, tags)
    WHERE p.name = task_data.project_name AND p.user_id = demo_user_id
    ON CONFLICT DO NOTHING;

    -- Sample Calendar Events (for Calendar Intelligence Hub)
    INSERT INTO calendar_events (user_id, title, description, start_time, end_time, event_type, productivity_category, priority, tags)
    VALUES 
        (demo_user_id, 'Daily Standup', 'Team sync and planning', CURRENT_DATE + INTERVAL '9 hours', CURRENT_DATE + INTERVAL '9 hours 30 minutes', 'meeting', 'collaboration', 6, ARRAY['work', 'team']),
        (demo_user_id, 'Deep Work: RIX Development', 'Focused development time for RIX integration', CURRENT_DATE + INTERVAL '10 hours', CURRENT_DATE + INTERVAL '12 hours', 'task', 'deep_work', 9, ARRAY['development', 'focus']),
        (demo_user_id, 'Lunch Break', 'Midday break and meal', CURRENT_DATE + INTERVAL '12 hours', CURRENT_DATE + INTERVAL '13 hours', 'personal', 'personal', 5, ARRAY['break', 'personal']),
        (demo_user_id, 'Client Review Meeting', 'Present latest project progress to client', CURRENT_DATE + INTERVAL '14 hours', CURRENT_DATE + INTERVAL '15 hours', 'meeting', 'collaboration', 8, ARRAY['client', 'presentation']),
        (demo_user_id, 'Gym Session', 'Strength training workout', CURRENT_DATE + INTERVAL '18 hours', CURRENT_DATE + INTERVAL '19 hours 30 minutes', 'personal', 'personal', 7, ARRAY['fitness', 'health'])
    ON CONFLICT DO NOTHING;

    -- Sample Routines (for Routine Intelligence Hub)
    INSERT INTO user_routines (user_id, name, description, routine_type, habits, frequency, time_slots, difficulty_level)
    VALUES 
        (demo_user_id, 'Morning Productivity Routine', 'Start the day with focus and energy', 'daily', 
         '[
            {"id": "meditation", "name": "Meditation", "duration": 10, "type": "mindfulness"},
            {"id": "exercise", "name": "Light Exercise", "duration": 20, "type": "physical"},
            {"id": "planning", "name": "Daily Planning", "duration": 15, "type": "cognitive"},
            {"id": "reading", "name": "Learning Reading", "duration": 20, "type": "cognitive"}
         ]'::jsonb,
         '{"daily": true, "weekdays_only": false}'::jsonb,
         '{"preferred_start": "07:00", "preferred_end": "08:30", "flexible": true}'::jsonb,
         6),
        (demo_user_id, 'Evening Wind-down', 'Prepare for restful sleep', 'daily',
         '[
            {"id": "reflection", "name": "Day Reflection", "duration": 10, "type": "cognitive"},
            {"id": "gratitude", "name": "Gratitude Practice", "duration": 5, "type": "mindfulness"},
            {"id": "prepare", "name": "Next Day Preparation", "duration": 10, "type": "organizational"},
            {"id": "relax", "name": "Relaxation Time", "duration": 30, "type": "personal"}
         ]'::jsonb,
         '{"daily": true, "weekdays_only": false}'::jsonb,
         '{"preferred_start": "21:00", "preferred_end": "22:00", "flexible": true}'::jsonb,
         4),
        (demo_user_id, 'Weekly Review & Planning', 'Comprehensive weekly assessment and planning', 'weekly',
         '[
            {"id": "review", "name": "Week Review", "duration": 45, "type": "cognitive"},
            {"id": "goals", "name": "Goal Progress Check", "duration": 30, "type": "strategic"},
            {"id": "planning", "name": "Next Week Planning", "duration": 60, "type": "strategic"},
            {"id": "learning", "name": "Skill Learning Session", "duration": 90, "type": "development"}
         ]'::jsonb,
         '{"weekly": true, "day_of_week": "sunday"}'::jsonb,
         '{"preferred_start": "10:00", "preferred_end": "14:00", "flexible": true}'::jsonb,
         7)
    ON CONFLICT DO NOTHING;

    -- Sample Routine Completions (for Routine Intelligence Hub)
    INSERT INTO daily_routine_completions (user_id, routine_id, completion_date, habits_completed, completion_percentage, quality_rating, mood_before, mood_after, energy_level)
    SELECT 
        demo_user_id,
        r.id,
        completion_data.date,
        completion_data.habits_completed,
        completion_data.completion_percentage,
        completion_data.quality_rating,
        completion_data.mood_before,
        completion_data.mood_after,
        completion_data.energy_level
    FROM user_routines r,
    (VALUES 
        ('Morning Productivity Routine', CURRENT_DATE - INTERVAL '1 day', '["meditation", "exercise", "planning", "reading"]'::jsonb, 100, 8, 6, 8, 8),
        ('Morning Productivity Routine', CURRENT_DATE - INTERVAL '2 days', '["meditation", "planning", "reading"]'::jsonb, 75, 7, 5, 7, 7),
        ('Morning Productivity Routine', CURRENT_DATE - INTERVAL '3 days', '["meditation", "exercise", "planning"]'::jsonb, 75, 6, 6, 7, 7),
        ('Evening Wind-down', CURRENT_DATE - INTERVAL '1 day', '["reflection", "gratitude", "prepare", "relax"]'::jsonb, 100, 9, 7, 8, 8),
        ('Evening Wind-down', CURRENT_DATE - INTERVAL '2 days', '["reflection", "gratitude", "relax"]'::jsonb, 75, 7, 6, 7, 7),
        ('Weekly Review & Planning', CURRENT_DATE - INTERVAL '7 days', '["review", "goals", "planning", "learning"]'::jsonb, 100, 9, 7, 8, 8)
    ) AS completion_data(routine_name, date, habits_completed, completion_percentage, quality_rating, mood_before, mood_after, energy_level)
    WHERE r.name = completion_data.routine_name AND r.user_id = demo_user_id
    ON CONFLICT (user_id, routine_id, completion_date) DO NOTHING;

    -- Sample Knowledge Entries (for Knowledge Intelligence Hub)
    INSERT INTO knowledge_entries (user_id, title, content, entry_type, category, tags, confidence_score, importance_score)
    VALUES 
        (demo_user_id, 'RIX Architecture Principles', 'Key architectural principles for RIX: 1) Main Agent as pure router/manager 2) All LLM processing in Sub-Agents 3) Pattern-based intent recognition 4) Vector memory for context', 'note', 'Technology', ARRAY['architecture', 'rix', 'principles'], 0.95, 0.9),
        (demo_user_id, 'FastAPI Best Practices', 'Best practices for FastAPI development: async/await throughout, proper error handling, Pydantic validation, structured logging, connection pooling', 'reference', 'Development', ARRAY['fastapi', 'python', 'backend'], 0.9, 0.8),
        (demo_user_id, 'PostgreSQL Performance Tips', 'Key performance optimization techniques: proper indexing, connection pooling, query optimization, VACUUM maintenance, pgvector for semantic search', 'reference', 'Database', ARRAY['postgresql', 'performance', 'optimization'], 0.85, 0.8),
        (demo_user_id, 'Productivity Insights', 'Personal productivity patterns: most focused between 9-11 AM, deep work sessions work best in 90-minute blocks, breaks every 2 hours improve overall output', 'insight', 'Personal', ARRAY['productivity', 'patterns', 'self-knowledge'], 0.8, 0.9),
        (demo_user_id, 'Goal Setting Framework', 'Effective goal setting requires: specific measurable outcomes, clear deadlines, regular progress tracking, milestone celebrations, adaptive planning', 'idea', 'Personal Development', ARRAY['goals', 'planning', 'framework'], 0.9, 0.85)
    ON CONFLICT DO NOTHING;

    -- Sample Goals (for Goal Intelligence Hub)
    INSERT INTO user_goals (user_id, title, description, goal_type, category, target_value, current_value, unit, priority, start_date, target_date, ai_insights)
    VALUES 
        (demo_user_id, 'Complete RIX Integration', 'Successfully implement and deploy the complete RIX database integration', 'professional', 'Development', 100, 75, 'percentage', 9, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', 
         '{"success_factors": ["consistent daily progress", "clear milestone tracking"], "risk_factors": ["scope creep", "integration complexity"], "recommendations": ["focus on core features first", "regular testing and validation"]}'::jsonb),
        (demo_user_id, 'Fitness Improvement', 'Improve overall fitness and establish consistent exercise routine', 'personal', 'Health', 150, 120, 'workout_sessions', 8, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days',
         '{"success_factors": ["routine consistency", "progressive overload"], "risk_factors": ["motivation dips", "time constraints"], "recommendations": ["start with 3x per week", "track progress visually"]}'::jsonb),
        (demo_user_id, 'Learn Advanced AI Concepts', 'Deepen understanding of AI/ML concepts and applications', 'professional', 'Learning', 50, 12, 'hours_studied', 7, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '60 days',
         '{"success_factors": ["hands-on projects", "consistent study schedule"], "risk_factors": ["information overload", "lack of practical application"], "recommendations": ["combine theory with practice", "join study group or community"]}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Sample Goal Progress Entries
    INSERT INTO goal_progress_entries (goal_id, user_id, progress_value, notes, confidence_level, energy_level)
    SELECT 
        g.id,
        demo_user_id,
        progress_data.value,
        progress_data.notes,
        progress_data.confidence,
        progress_data.energy
    FROM user_goals g,
    (VALUES 
        ('Complete RIX Integration', 70, 'Database schema completed, working on API implementation', 8, 8),
        ('Complete RIX Integration', 75, 'Core APIs implemented, starting intelligence layer', 8, 7),
        ('Fitness Improvement', 115, 'Completed 5 more workout sessions this week', 7, 8),
        ('Fitness Improvement', 120, 'Consistency improving, feeling stronger', 8, 8),
        ('Learn Advanced AI Concepts', 8, 'Finished transformer architecture course', 7, 6),
        ('Learn Advanced AI Concepts', 12, 'Completed practical project on embeddings', 8, 7)
    ) AS progress_data(goal_title, value, notes, confidence, energy)
    WHERE g.title = progress_data.goal_title AND g.user_id = demo_user_id
    ON CONFLICT DO NOTHING;

    -- Sample Behavioral Analytics (for Behavioral Analytics Engine)
    INSERT INTO behavioral_analytics (user_id, analysis_type, analysis_period, period_start, period_end, insights, correlations, recommendations, confidence_score, metrics)
    VALUES 
        (demo_user_id, 'productivity_pattern', 'weekly', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE,
         '{"peak_hours": ["09:00-11:00", "14:00-16:00"], "productivity_score": 8.2, "focus_sessions": 12, "interruption_rate": 0.15}'::jsonb,
         '{"exercise_productivity": 0.73, "sleep_quality_focus": 0.68, "routine_completion_mood": 0.81}'::jsonb,
         '{"optimize_calendar": "block 9-11 AM for deep work", "reduce_interruptions": "use focus mode during peak hours", "maintain_routines": "evening routine strongly correlates with next-day productivity"}'::jsonb,
         0.82,
         '{"total_work_hours": 42, "deep_work_hours": 18, "meeting_hours": 8, "avg_session_length": 87}'::jsonb),
        (demo_user_id, 'habit_correlation', 'monthly', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE,
         '{"routine_consistency": 0.78, "goal_progress_rate": 0.85, "energy_stability": 0.72, "mood_trend": "improving"}'::jsonb,
         '{"morning_routine_productivity": 0.89, "exercise_mood": 0.76, "planning_goal_progress": 0.83}'::jsonb,
         '{"strengthen_morning_routine": "highest impact on daily productivity", "increase_exercise_frequency": "strong mood and energy benefits", "weekly_planning": "correlates with goal achievement"}'::jsonb,
         0.87,
         '{"routine_completions": 23, "avg_mood_rating": 7.4, "energy_variance": 1.2, "goal_progress_velocity": 12.3}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Sample Calendar Productivity Tracking
    INSERT INTO calendar_productivity_tracking (user_id, date, productivity_score, energy_level, focus_quality, completion_status, notes, time_block_effectiveness)
    VALUES 
        (demo_user_id, CURRENT_DATE - INTERVAL '1 day', 8, 8, 9, 'completed', 'Great focus during deep work block, minimal interruptions', 9),
        (demo_user_id, CURRENT_DATE - INTERVAL '2 days', 7, 7, 7, 'completed', 'Good day overall, afternoon energy dip affected focus', 7),
        (demo_user_id, CURRENT_DATE - INTERVAL '3 days', 6, 6, 6, 'partial', 'Multiple interruptions during focus time, need better boundaries', 5),
        (demo_user_id, CURRENT_DATE - INTERVAL '4 days', 9, 9, 9, 'completed', 'Exceptional day, perfect balance of work and breaks', 10),
        (demo_user_id, CURRENT_DATE - INTERVAL '5 days', 8, 8, 8, 'completed', 'Solid productivity, morning routine set positive tone', 8)
    ON CONFLICT DO NOTHING;

    -- Sample MCP Interaction Logs (simulating future Sub-Agent calls)
    INSERT INTO mcp_interaction_logs (user_id, sub_agent_type, endpoint_called, request_payload, response_payload, processing_time_ms, status_code, context_metadata)
    VALUES 
        (demo_user_id, 'task', '/mcp/task-management', '{"action": "create_task", "title": "Review database schema", "priority": 8}'::jsonb, '{"task_id": "uuid-here", "status": "created", "ai_suggestions": ["consider adding deadline", "link to project"]}'::jsonb, 245, 200, '{"user_context": "active_project_focus"}'::jsonb),
        (demo_user_id, 'routine', '/mcp/routine-coaching', '{"routine_id": "morning-routine", "completion_data": {"percentage": 75, "quality": 7}}'::jsonb, '{"coaching_message": "Great consistency! Consider adding the exercise component tomorrow.", "streak_info": {"current": 5, "longest": 12}, "motivation_score": 8.2}'::jsonb, 312, 200, '{"coaching_session": true}'::jsonb),
        (demo_user_id, 'calendar', '/mcp/calendar-intelligence', '{"action": "optimize_schedule", "date": "2024-01-15", "preferences": {"deep_work_preferred": "morning"}}'::jsonb, '{"suggestions": [{"time": "09:00-11:00", "type": "deep_work", "confidence": 0.92}], "conflicts_resolved": 2}'::jsonb, 178, 200, '{"optimization_request": true}'::jsonb)
    ON CONFLICT DO NOTHING;

END $$;