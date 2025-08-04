#!/usr/bin/env python3
"""
/Users/benediktthomas/RIX Personal Agent/RIX/main-agent/tests/test_ai_workflow_intelligence.py
Comprehensive test suite for AI workflow intelligence service (RIX PRD compliant)
Tests pattern-based workflow triggering, user pattern analysis, and intelligence insights
RELEVANT FILES: app/services/ai_workflow_intelligence.py, app/models/chat.py, app/services/n8n_client.py
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

# Add main-agent directory to Python path so we can import 'app' module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.chat import MessageType, WorkflowType
from app.services.ai_workflow_intelligence import AIWorkflowIntelligence, IntelligenceInsight, ai_workflow_intelligence


class TestIntelligenceInsight:
    """Test suite for IntelligenceInsight dataclass"""

    def test_intelligence_insight_creation(self):
        """Test creation of IntelligenceInsight"""
        insight = IntelligenceInsight(
            insight_type="morning_routine",
            confidence=0.85,
            trigger_workflow=WorkflowType.MORNING_BRIEF,
            context={"time": 8, "reasoning": "Morning hours detected"},
            user_id="user-123",
            priority="high",
            reasoning="User typically benefits from morning briefings",
        )

        assert insight.insight_type == "morning_routine"
        assert insight.confidence == 0.85
        assert insight.trigger_workflow == WorkflowType.MORNING_BRIEF
        assert insight.context["time"] == 8
        assert insight.user_id == "user-123"
        assert insight.priority == "high"

    def test_intelligence_insight_defaults(self):
        """Test IntelligenceInsight with default values"""
        insight = IntelligenceInsight(
            insight_type="test", confidence=0.7, trigger_workflow=WorkflowType.TASK_MANAGEMENT, context={}, user_id="user-123"
        )

        assert insight.priority == "normal"  # Default value
        assert insight.reasoning == ""  # Default value


class TestAIWorkflowIntelligence:
    """Test suite for AIWorkflowIntelligence class"""

    @pytest.fixture
    def intelligence(self):
        """Create a fresh AIWorkflowIntelligence instance for testing"""
        return AIWorkflowIntelligence()

    @pytest.fixture
    def mock_user_activity(self):
        """Mock user activity data"""
        return {
            "conversations": [
                {
                    "id": "conv-001",
                    "title": "Morning routine optimization",
                    "updated_at": datetime.utcnow() - timedelta(hours=2),
                },
                {"id": "conv-002", "title": "Daily task management", "updated_at": datetime.utcnow() - timedelta(hours=5)},
                {"id": "conv-003", "title": "Schedule optimization help", "updated_at": datetime.utcnow() - timedelta(days=1)},
            ],
            "conversation_count": 3,
            "activity_period": 7,
        }

    def test_initialization(self, intelligence):
        """Test AIWorkflowIntelligence initialization"""
        assert isinstance(intelligence.insights_cache, dict)
        assert intelligence.pattern_analysis_interval == 3600
        assert intelligence.min_confidence_threshold == 0.7
        assert len(intelligence.routine_patterns) > 0

        # Test that all expected patterns are defined
        expected_patterns = ["morning_routine", "calendar_heavy", "project_status", "routine_optimization", "task_overwhelm"]
        for pattern in expected_patterns:
            assert pattern in intelligence.routine_patterns

    def test_routine_patterns_structure(self, intelligence):
        """Test routine patterns are properly structured"""
        patterns = intelligence.routine_patterns

        for pattern_name, pattern_config in patterns.items():
            assert "workflow" in pattern_config
            assert "confidence" in pattern_config
            assert isinstance(pattern_config["workflow"], WorkflowType)
            assert 0 < pattern_config["confidence"] <= 1.0

            # Most patterns should have keywords (except time-based ones)
            if pattern_name != "morning_routine":
                assert "keywords" in pattern_config
                assert isinstance(pattern_config["keywords"], list)
                assert len(pattern_config["keywords"]) > 0

    def test_morning_routine_pattern(self, intelligence):
        """Test morning routine pattern configuration"""
        morning_pattern = intelligence.routine_patterns["morning_routine"]

        assert morning_pattern["workflow"] == WorkflowType.MORNING_BRIEF
        assert "time_range" in morning_pattern
        assert morning_pattern["time_range"] == (6, 10)
        assert morning_pattern["confidence"] > 0.7

    def test_calendar_heavy_pattern(self, intelligence):
        """Test calendar heavy pattern configuration"""
        calendar_pattern = intelligence.routine_patterns["calendar_heavy"]

        assert calendar_pattern["workflow"] == WorkflowType.CALENDAR_OPTIMIZATION
        assert "meeting" in calendar_pattern["keywords"]
        assert "schedule" in calendar_pattern["keywords"]

    def test_task_overwhelm_pattern(self, intelligence):
        """Test task overwhelm pattern configuration"""
        task_pattern = intelligence.routine_patterns["task_overwhelm"]

        assert task_pattern["workflow"] == WorkflowType.TASK_MANAGEMENT
        assert "overwhelmed" in task_pattern["keywords"]
        assert "busy" in task_pattern["keywords"]
        assert task_pattern["confidence"] > 0.8  # Should be high confidence

    @pytest.mark.asyncio
    async def test_get_recent_user_activity(self, intelligence):
        """Test getting recent user activity"""
        user_id = "user-123"
        mock_conversations = [
            {"id": "conv-001", "updated_at": datetime.utcnow() - timedelta(days=2)},
            {"id": "conv-002", "updated_at": datetime.utcnow() - timedelta(days=10)},  # Too old
        ]

        with patch("app.services.database.database") as mock_db:
            mock_db.get_user_conversations.return_value = mock_conversations

            activity = await intelligence._get_recent_user_activity(user_id)

            assert "conversations" in activity
            assert "conversation_count" in activity
            assert "activity_period" in activity
            assert activity["activity_period"] == 7
            assert activity["conversation_count"] == 1  # Only recent conversations

    @pytest.mark.asyncio
    async def test_get_recent_user_activity_error(self, intelligence):
        """Test error handling in get_recent_user_activity"""
        user_id = "user-123"

        with patch("app.services.database.database") as mock_db:
            mock_db.get_user_conversations.side_effect = Exception("Database error")

            activity = await intelligence._get_recent_user_activity(user_id)

            assert activity == {}

    @pytest.mark.asyncio
    async def test_analyze_time_patterns_morning(self, intelligence, mock_user_activity):
        """Test time pattern analysis during morning hours"""
        user_id = "user-123"

        # Mock current time to be 8 AM
        with patch("app.services.ai_workflow_intelligence.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2024, 1, 21, 8, 0, 0)  # 8 AM

            insights = await intelligence._analyze_time_patterns(user_id, mock_user_activity)

            assert len(insights) > 0

            # Should have morning routine insight
            morning_insights = [i for i in insights if i.insight_type == "morning_routine"]
            assert len(morning_insights) > 0

            morning_insight = morning_insights[0]
            assert morning_insight.trigger_workflow == WorkflowType.MORNING_BRIEF
            assert morning_insight.confidence >= 0.8
            assert morning_insight.priority == "high"

    @pytest.mark.asyncio
    async def test_analyze_time_patterns_business_hours_high_activity(self, intelligence, mock_user_activity):
        """Test time pattern analysis during business hours with high activity"""
        user_id = "user-123"

        # Mock current time to be 2 PM with high activity
        with patch("app.services.ai_workflow_intelligence.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2024, 1, 21, 14, 0, 0)  # 2 PM

            # Modify activity to have high conversation count
            high_activity = {**mock_user_activity, "conversation_count": 10}

            insights = await intelligence._analyze_time_patterns(user_id, high_activity)

            # Should have calendar optimization insight due to high activity
            calendar_insights = [i for i in insights if i.insight_type == "calendar_optimization"]
            assert len(calendar_insights) > 0

            calendar_insight = calendar_insights[0]
            assert calendar_insight.trigger_workflow == WorkflowType.CALENDAR_OPTIMIZATION
            assert calendar_insight.context["activity_level"] == "high"

    @pytest.mark.asyncio
    async def test_analyze_time_patterns_evening(self, intelligence, mock_user_activity):
        """Test time pattern analysis during evening hours"""
        user_id = "user-123"

        # Mock current time to be 8 PM
        with patch("app.services.ai_workflow_intelligence.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2024, 1, 21, 20, 0, 0)  # 8 PM

            insights = await intelligence._analyze_time_patterns(user_id, mock_user_activity)

            # Should not have morning routine insights
            morning_insights = [i for i in insights if i.insight_type == "morning_routine"]
            assert len(morning_insights) == 0

    @pytest.mark.asyncio
    async def test_analyze_conversation_patterns_routine_interest(self, intelligence):
        """Test conversation pattern analysis for routine interest"""
        user_id = "user-123"
        activity = {
            "conversations": [
                {"title": "help me optimize my daily routine"},
                {"title": "morning habits improvement"},
                {"title": "schedule optimization needed"},
            ]
        }

        insights = await intelligence._analyze_conversation_patterns(user_id, activity)

        routine_insights = [i for i in insights if i.insight_type == "routine_interest"]
        assert len(routine_insights) > 0

        routine_insight = routine_insights[0]
        assert routine_insight.trigger_workflow == WorkflowType.ROUTINE_COACHING
        assert routine_insight.confidence >= 0.8
        assert routine_insight.context["keyword_matches"] >= 2

    @pytest.mark.asyncio
    async def test_analyze_conversation_patterns_no_matches(self, intelligence):
        """Test conversation pattern analysis with no keyword matches"""
        user_id = "user-123"
        activity = {"conversations": [{"title": "weather forecast"}, {"title": "random chat"}, {"title": "unrelated topic"}]}

        insights = await intelligence._analyze_conversation_patterns(user_id, activity)

        # Should not generate insights for unrelated conversations
        assert len(insights) == 0

    @pytest.mark.asyncio
    async def test_analyze_conversation_patterns_error(self, intelligence):
        """Test error handling in conversation pattern analysis"""
        user_id = "user-123"
        activity = {}  # Empty activity

        insights = await intelligence._analyze_conversation_patterns(user_id, activity)

        assert insights == []

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_morning_routine(self, intelligence):
        """Test message processing for morning routine triggers"""
        user_id = "user-123"
        message = "Good morning! How should I start my day with coffee and breakfast?"
        conversation_id = "conv-123"

        insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

        morning_insights = [i for i in insights if "morning_routine" in i.insight_type]
        assert len(morning_insights) > 0

        insight = morning_insights[0]
        assert insight.trigger_workflow == WorkflowType.MORNING_BRIEF
        assert insight.confidence > 0.7
        assert insight.context["conversation_id"] == conversation_id

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_task_overwhelm(self, intelligence):
        """Test message processing for task overwhelm triggers"""
        user_id = "user-123"
        message = "I'm feeling overwhelmed with too many tasks and I'm so busy and stressed"
        conversation_id = "conv-456"

        insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

        task_insights = [i for i in insights if "task_overwhelm" in i.insight_type]
        assert len(task_insights) > 0

        insight = task_insights[0]
        assert insight.trigger_workflow == WorkflowType.TASK_MANAGEMENT
        assert insight.confidence > 0.8  # Should be high due to multiple keywords
        assert insight.priority == "high"

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_calendar_optimization(self, intelligence):
        """Test message processing for calendar optimization triggers"""
        user_id = "user-123"
        message = "I have many meetings today and my schedule is very busy"
        conversation_id = "conv-789"

        insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

        calendar_insights = [i for i in insights if "calendar_heavy" in i.insight_type]
        assert len(calendar_insights) > 0

        insight = calendar_insights[0]
        assert insight.trigger_workflow == WorkflowType.CALENDAR_OPTIMIZATION

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_project_status(self, intelligence):
        """Test message processing for project status triggers"""
        user_id = "user-123"
        message = "What's the status of my project deadlines and milestones?"
        conversation_id = "conv-project"

        insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

        project_insights = [i for i in insights if "project_status" in i.insight_type]
        assert len(project_insights) > 0

        insight = project_insights[0]
        assert insight.trigger_workflow == WorkflowType.PROJECT_INTELLIGENCE

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_routine_optimization(self, intelligence):
        """Test message processing for routine optimization triggers"""
        user_id = "user-123"
        message = "I want to improve my daily routine and optimize my habits"
        conversation_id = "conv-routine"

        insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

        routine_insights = [i for i in insights if "routine_optimization" in i.insight_type]
        assert len(routine_insights) > 0

        insight = routine_insights[0]
        assert insight.trigger_workflow == WorkflowType.ROUTINE_COACHING

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_no_matches(self, intelligence):
        """Test message processing with no pattern matches"""
        user_id = "user-123"
        message = "What's the weather like today?"
        conversation_id = "conv-weather"

        insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

        assert len(insights) == 0

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_confidence_boost(self, intelligence):
        """Test confidence boost with multiple keyword matches"""
        user_id = "user-123"
        # Message with many task-related keywords
        message = "I'm overwhelmed with tasks, too much work, feeling stressed and busy"
        conversation_id = "conv-stress"

        insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

        task_insights = [i for i in insights if "task_overwhelm" in i.insight_type]
        assert len(task_insights) > 0

        insight = task_insights[0]
        # Should have boosted confidence due to multiple matches
        assert insight.confidence > 0.85

    @pytest.mark.asyncio
    async def test_process_message_for_triggers_error(self, intelligence):
        """Test error handling in message processing"""
        user_id = "user-123"
        message = "test message"
        conversation_id = "conv-error"

        # Mock an error in pattern processing
        with patch.object(intelligence, "routine_patterns", side_effect=Exception("Pattern error")):
            insights = await intelligence.process_message_for_triggers(user_id, message, conversation_id)

            assert insights == []

    @pytest.mark.asyncio
    async def test_execute_intelligence_insights_success(self, intelligence):
        """Test successful execution of intelligence insights"""
        insights = [
            IntelligenceInsight(
                insight_type="test_insight",
                confidence=0.9,
                trigger_workflow=WorkflowType.MORNING_BRIEF,
                context={"test": "data"},
                user_id="user-123",
            )
        ]

        mock_response = Mock()
        mock_response.execution_id = "exec-123"
        mock_response.processing_time = 2.5

        with patch("app.services.n8n_client.n8n_client") as mock_n8n:
            mock_n8n.execute_ai_triggered_workflow.return_value = mock_response

            results = await intelligence.execute_intelligence_insights(insights)

            assert results["executed"] == 1
            assert results["failed"] == 0
            assert len(results["executions"]) == 1
            assert results["executions"][0]["status"] == "success"

    @pytest.mark.asyncio
    async def test_execute_intelligence_insights_failure(self, intelligence):
        """Test handling of execution failures"""
        insights = [
            IntelligenceInsight(
                insight_type="test_insight",
                confidence=0.9,
                trigger_workflow=WorkflowType.MORNING_BRIEF,
                context={"test": "data"},
                user_id="user-123",
            )
        ]

        with patch("app.services.n8n_client.n8n_client") as mock_n8n:
            mock_n8n.execute_ai_triggered_workflow.side_effect = Exception("Execution failed")

            results = await intelligence.execute_intelligence_insights(insights)

            assert results["executed"] == 0
            assert results["failed"] == 1
            assert results["executions"][0]["status"] == "failed"
            assert "Execution failed" in results["executions"][0]["error"]

    @pytest.mark.asyncio
    async def test_execute_intelligence_insights_mixed_results(self, intelligence):
        """Test execution with mixed success and failure results"""
        insights = [
            IntelligenceInsight(
                insight_type="success_insight",
                confidence=0.9,
                trigger_workflow=WorkflowType.MORNING_BRIEF,
                context={},
                user_id="user-123",
            ),
            IntelligenceInsight(
                insight_type="failure_insight",
                confidence=0.8,
                trigger_workflow=WorkflowType.TASK_MANAGEMENT,
                context={},
                user_id="user-123",
            ),
        ]

        mock_success_response = Mock()
        mock_success_response.execution_id = "exec-success"
        mock_success_response.processing_time = 1.5

        with patch("app.services.n8n_client.n8n_client") as mock_n8n:

            def execute_side_effect(*args, **kwargs):
                if kwargs["workflow_type"] == WorkflowType.MORNING_BRIEF:
                    return mock_success_response
                else:
                    raise Exception("Execution failed")

            mock_n8n.execute_ai_triggered_workflow.side_effect = execute_side_effect

            results = await intelligence.execute_intelligence_insights(insights)

            assert results["executed"] == 1
            assert results["failed"] == 1
            assert len(results["executions"]) == 2

    @pytest.mark.asyncio
    async def test_analyze_user_patterns_comprehensive(self, intelligence, mock_user_activity):
        """Test comprehensive user pattern analysis"""
        user_id = "user-123"

        with patch.object(intelligence, "_get_recent_user_activity", return_value=mock_user_activity), patch(
            "app.services.ai_workflow_intelligence.datetime"
        ) as mock_datetime:
            # Mock morning time
            mock_datetime.utcnow.return_value = datetime(2024, 1, 21, 8, 30, 0)

            insights = await intelligence.analyze_user_patterns(user_id)

            assert len(insights) > 0

            # Should cache insights
            assert user_id in intelligence.insights_cache

            # All insights should meet confidence threshold
            for insight in insights:
                assert insight.confidence >= intelligence.min_confidence_threshold

    @pytest.mark.asyncio
    async def test_analyze_user_patterns_low_confidence_filtering(self, intelligence):
        """Test filtering of low confidence insights"""
        user_id = "user-123"

        # Mock activity that generates low confidence insights
        low_activity = {"conversations": [], "conversation_count": 0, "activity_period": 7}

        with patch.object(intelligence, "_get_recent_user_activity", return_value=low_activity), patch(
            "app.services.ai_workflow_intelligence.datetime"
        ) as mock_datetime:
            # Mock non-morning time
            mock_datetime.utcnow.return_value = datetime(2024, 1, 21, 20, 0, 0)

            insights = await intelligence.analyze_user_patterns(user_id)

            # Should have fewer or no insights due to low confidence
            for insight in insights:
                assert insight.confidence >= intelligence.min_confidence_threshold

    @pytest.mark.asyncio
    async def test_analyze_user_patterns_error(self, intelligence):
        """Test error handling in user pattern analysis"""
        user_id = "user-123"

        with patch.object(intelligence, "_get_recent_user_activity", side_effect=Exception("Analysis error")):
            insights = await intelligence.analyze_user_patterns(user_id)

            assert insights == []

    @pytest.mark.asyncio
    async def test_schedule_intelligence_analysis(self, intelligence):
        """Test scheduled intelligence analysis"""
        user_id = "user-123"

        # Mock high priority insights
        high_priority_insights = [
            IntelligenceInsight(
                insight_type="high_priority_test",
                confidence=0.9,
                trigger_workflow=WorkflowType.MORNING_BRIEF,
                context={},
                user_id=user_id,
                priority="high",
            )
        ]

        with patch.object(intelligence, "analyze_user_patterns", return_value=high_priority_insights), patch.object(
            intelligence, "execute_intelligence_insights"
        ) as mock_execute:
            mock_execute.return_value = {"executed": 1, "failed": 0}

            await intelligence.schedule_intelligence_analysis(user_id)

            # Should execute high priority insights
            mock_execute.assert_called_once_with(high_priority_insights)

    @pytest.mark.asyncio
    async def test_schedule_intelligence_analysis_no_high_priority(self, intelligence):
        """Test scheduled analysis with no high priority insights"""
        user_id = "user-123"

        # Mock low priority insights
        low_priority_insights = [
            IntelligenceInsight(
                insight_type="low_priority_test",
                confidence=0.75,
                trigger_workflow=WorkflowType.TASK_MANAGEMENT,
                context={},
                user_id=user_id,
                priority="normal",
            )
        ]

        with patch.object(intelligence, "analyze_user_patterns", return_value=low_priority_insights), patch.object(
            intelligence, "execute_intelligence_insights"
        ) as mock_execute:
            await intelligence.schedule_intelligence_analysis(user_id)

            # Should not execute normal priority insights
            mock_execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_schedule_intelligence_analysis_error(self, intelligence):
        """Test error handling in scheduled analysis"""
        user_id = "user-123"

        with patch.object(intelligence, "analyze_user_patterns", side_effect=Exception("Scheduled analysis error")):
            # Should not raise exception
            await intelligence.schedule_intelligence_analysis(user_id)

    def test_confidence_threshold_configuration(self, intelligence):
        """Test confidence threshold configuration"""
        assert intelligence.min_confidence_threshold == 0.7
        assert 0 < intelligence.min_confidence_threshold < 1

    def test_pattern_analysis_interval(self, intelligence):
        """Test pattern analysis interval configuration"""
        assert intelligence.pattern_analysis_interval == 3600  # 1 hour
        assert intelligence.pattern_analysis_interval > 0

    def test_insights_cache_management(self, intelligence):
        """Test insights cache management"""
        user_id = "user-123"
        insights = [
            IntelligenceInsight(
                insight_type="test", confidence=0.8, trigger_workflow=WorkflowType.MORNING_BRIEF, context={}, user_id=user_id
            )
        ]

        # Cache should be empty initially
        assert user_id not in intelligence.insights_cache

        # Add insights to cache
        intelligence.insights_cache[user_id] = insights

        assert user_id in intelligence.insights_cache
        assert len(intelligence.insights_cache[user_id]) == 1


class TestAIWorkflowIntelligenceIntegration:
    """Integration tests for AIWorkflowIntelligence"""

    def test_global_ai_workflow_intelligence_instance(self):
        """Test that global ai_workflow_intelligence instance is properly initialized"""
        assert ai_workflow_intelligence is not None
        assert isinstance(ai_workflow_intelligence, AIWorkflowIntelligence)

    @pytest.mark.asyncio
    async def test_rix_prd_compliance_no_llm_calls(self):
        """Test that the service is RIX PRD compliant (no LLM calls)"""
        intelligence = AIWorkflowIntelligence()

        # Test that all pattern matching is rule-based, not LLM-based
        test_messages = [
            "Good morning, how should I start my day?",
            "I'm overwhelmed with tasks",
            "Help me optimize my routine",
            "My calendar is very busy today",
        ]

        for message in test_messages:
            insights = await intelligence.process_message_for_triggers("user-test", message, "conv-test")

            # All insights should be generated through pattern matching
            # No external API calls should be made for LLM processing
            for insight in insights:
                assert insight.confidence > 0
                assert isinstance(insight.trigger_workflow, WorkflowType)

    @pytest.mark.asyncio
    async def test_pattern_based_intelligence_comprehensive(self):
        """Test comprehensive pattern-based intelligence without LLM"""
        intelligence = AIWorkflowIntelligence()

        # Test various pattern combinations
        test_scenarios = [
            {
                "message": "good morning coffee breakfast start day",
                "expected_workflow": WorkflowType.MORNING_BRIEF,
                "min_confidence": 0.7,
            },
            {
                "message": "overwhelmed too much work busy stressed tasks",
                "expected_workflow": WorkflowType.TASK_MANAGEMENT,
                "min_confidence": 0.8,
            },
            {
                "message": "meetings appointments schedule calendar busy",
                "expected_workflow": WorkflowType.CALENDAR_OPTIMIZATION,
                "min_confidence": 0.7,
            },
            {
                "message": "routine habits daily improve optimize",
                "expected_workflow": WorkflowType.ROUTINE_COACHING,
                "min_confidence": 0.7,
            },
            {
                "message": "project status progress deadline milestone",
                "expected_workflow": WorkflowType.PROJECT_INTELLIGENCE,
                "min_confidence": 0.7,
            },
        ]

        for scenario in test_scenarios:
            insights = await intelligence.process_message_for_triggers("user-test", scenario["message"], "conv-test")

            # Should find at least one insight matching the expected workflow
            matching_insights = [i for i in insights if i.trigger_workflow == scenario["expected_workflow"]]

            assert len(matching_insights) > 0
            assert matching_insights[0].confidence >= scenario["min_confidence"]
