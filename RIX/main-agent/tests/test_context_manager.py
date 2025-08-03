# /main-agent/tests/test_context_manager.py
# Comprehensive test suite for Context Manager in Phase 5 Intelligence Features
# Tests context preparation for routine coaching, project intelligence, and calendar optimization
# RELEVANT FILES: /main-agent/app/services/context_manager.py, /main-agent/app/api/endpoints/intelligence.py

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
import httpx

from app.services.context_manager import ContextManager, context_manager


class TestContextManager:
    """Test suite for Context Manager intelligence features"""
    
    @pytest.fixture
    def manager(self):
        """Create ContextManager instance"""
        return ContextManager()
    
    @pytest.fixture
    def mock_httpx_client(self):
        """Mock httpx AsyncClient for API calls"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            yield mock_client


class TestRoutineCoachingContext(TestContextManager):
    """Test routine coaching context preparation"""
    
    @pytest.mark.asyncio
    async def test_prepare_routine_coaching_context_success(self, manager, mock_httpx_client):
        """Test successful routine coaching context preparation"""
        # Mock successful API responses
        mock_routines_response = MagicMock()
        mock_routines_response.raise_for_status.return_value = None
        mock_routines_response.json.return_value = {
            "routines": [
                {
                    "id": "routine-1",
                    "name": "Morning Routine",
                    "frequency": "daily",
                    "habits": [
                        {"id": "habit-1", "name": "Meditation", "duration": 10},
                        {"id": "habit-2", "name": "Exercise", "duration": 30}
                    ]
                }
            ]
        }
        
        mock_httpx_client.get.return_value = mock_routines_response
        
        user_id = "test-user-123"
        message = "How can I improve my morning routine consistency?"
        
        # Execute context preparation
        context = await manager.prepare_routine_coaching_context(user_id, message)
        
        # Verify context structure
        assert context["user_id"] == user_id
        assert context["message"] == message
        assert "routines" in context
        assert "completion_history" in context
        assert "statistics" in context
        assert "analysis_request" in context
        assert "preferences" in context
        
        # Verify routines data
        assert len(context["routines"]) == 1
        routine = context["routines"][0]
        assert routine["name"] == "Morning Routine"
        assert routine["frequency"] == "daily"
        assert len(routine["habits"]) == 2
        
        # Verify analysis request
        analysis_request = context["analysis_request"]
        assert analysis_request["type"] == "routine_coaching"
        assert "focus_areas" in analysis_request
        assert "timestamp" in analysis_request
        
        # Verify preferences
        preferences = context["preferences"]
        assert preferences["coaching_style"] == "supportive"
        assert preferences["goal_oriented"] is True
        assert preferences["data_driven"] is True
        
        # Verify API was called correctly
        mock_httpx_client.get.assert_called_with(
            "http://localhost:3000/api/routines?include_completions=true",
            headers={"X-Internal-Request": "main-agent"}
        )
    
    @pytest.mark.asyncio
    async def test_prepare_routine_coaching_context_api_failure(self, manager, mock_httpx_client):
        """Test routine coaching context preparation with API failure"""
        # Mock API failure
        mock_httpx_client.get.side_effect = httpx.RequestError("API unavailable")
        
        user_id = "test-user-123"
        message = "Test message"
        
        # Execute context preparation
        context = await manager.prepare_routine_coaching_context(user_id, message)
        
        # Verify fallback context is returned
        assert context["user_id"] == user_id
        assert context["message"] == message
        assert context["routines"] == []  # Fallback mock data
        assert "error" in context
        assert context["error"] == "Unable to fetch routine data"
        
        # Verify analysis request is still present
        assert "analysis_request" in context
        assert context["analysis_request"]["type"] == "routine_coaching"
    
    @pytest.mark.asyncio
    async def test_routine_focus_extraction(self, manager):
        """Test routine focus area extraction from messages"""
        test_cases = [
            ("I need help with consistency in my routine", ["consistency"]),
            ("What's the best time for my morning routine?", ["timing"]),
            ("My routine is too difficult to maintain", ["difficulty"]),
            ("I lack motivation for my habits", ["motivation"]),
            ("Help me improve my routine", ["general_improvement"]),
            ("I struggle with timing and staying motivated", ["timing", "motivation"])
        ]
        
        for message, expected_focuses in test_cases:
            focuses = manager._extract_routine_focus(message)
            for expected in expected_focuses:
                assert expected in focuses, f"Expected {expected} in focuses for message: {message}"
    
    @pytest.mark.asyncio
    async def test_routine_stats_calculation(self, manager):
        """Test routine statistics calculation"""
        routines = [
            {"id": "routine-1", "name": "Morning Routine"},
            {"id": "routine-2", "name": "Evening Routine"}
        ]
        
        completions = [
            {
                "routine_id": "routine-1",
                "completion_date": "2024-08-01",
                "completion_percentage": 100
            },
            {
                "routine_id": "routine-1",
                "completion_date": "2024-07-31", 
                "completion_percentage": 80
            },
            {
                "routine_id": "routine-2",
                "completion_date": "2024-08-01",
                "completion_percentage": 90
            }
        ]
        
        stats = manager._calculate_routine_stats(routines, completions)
        
        assert stats["total_routines"] == 2
        assert stats["recent_completions"] == 3
        assert stats["average_completion_rate"] == 90.0  # (100 + 80 + 90) / 3
        assert stats["improvement_trend"] == "improving"  # avg > 70
        assert "streak_days" in stats


class TestProjectIntelligenceContext(TestContextManager):
    """Test project intelligence context preparation"""
    
    @pytest.mark.asyncio
    async def test_prepare_project_intelligence_context_success(self, manager, mock_httpx_client):
        """Test successful project intelligence context preparation"""
        # Mock successful API response
        mock_projects_response = MagicMock()
        mock_projects_response.raise_for_status.return_value = None
        mock_projects_response.json.return_value = {
            "projects": [
                {
                    "id": "project-1",
                    "name": "RIX Development",
                    "status": "active",
                    "priority": "high",
                    "aiHealthScore": 87,
                    "progress": 65
                },
                {
                    "id": "project-2",
                    "name": "Personal Website", 
                    "status": "active",
                    "priority": "medium",
                    "aiHealthScore": 73,
                    "progress": 40
                }
            ]
        }
        
        mock_httpx_client.get.return_value = mock_projects_response
        
        user_id = "test-user-123"
        message = "Analyze the health of my RIX Development project"
        
        # Execute context preparation
        context = await manager.prepare_project_intelligence_context(user_id, message)
        
        # Verify context structure
        assert context["user_id"] == user_id
        assert context["message"] == message
        assert "projects" in context
        assert "target_project" in context
        assert "insights" in context
        assert "analysis_request" in context
        assert "metrics" in context
        
        # Verify projects data
        assert len(context["projects"]) == 2
        
        # Verify target project extraction
        target_project = context["target_project"]
        assert target_project is not None
        assert target_project["name"] == "RIX Development"
        
        # Verify metrics
        metrics = context["metrics"]
        assert metrics["total_projects"] == 2
        assert metrics["active_projects"] == 2
        assert metrics["average_health_score"] == 80.0  # (87 + 73) / 2
        
        # Verify insights calculation
        insights = context["insights"]
        assert insights["average_health_score"] == 80.0
        assert insights["at_risk_count"] == 1  # One project < 60 score (none actually)
        
        # Verify analysis request
        analysis_request = context["analysis_request"]
        assert analysis_request["type"] == "project_intelligence"
        assert analysis_request["include_health_score"] is True
        assert analysis_request["include_recommendations"] is True
    
    @pytest.mark.asyncio
    async def test_project_focus_extraction(self, manager):
        """Test project focus area extraction from messages"""
        test_cases = [
            ("Check my project health scores", ["health_score"]),
            ("What's the progress on my projects?", ["progress"]),
            ("Are there any risks in my projects?", ["risks"]),
            ("How can I optimize my project workflow?", ["optimization"]),
            ("Give me a general project analysis", ["general_analysis"]),
            ("Check health and progress", ["health_score", "progress"])
        ]
        
        for message, expected_focuses in test_cases:
            focuses = manager._extract_project_focus(message)
            for expected in expected_focuses:
                assert expected in focuses, f"Expected {expected} in focuses for message: {message}"
    
    @pytest.mark.asyncio
    async def test_project_reference_extraction(self, manager):
        """Test specific project reference extraction from messages"""
        projects = [
            {"id": "project-1", "name": "RIX Development"},
            {"id": "project-2", "name": "Personal Website"},
            {"id": "project-3", "name": "Mobile App"}
        ]
        
        test_cases = [
            ("Analyze my RIX Development project", "RIX Development"),
            ("How is the Personal Website doing?", "Personal Website"),
            ("Mobile App status check", "Mobile App"),
            ("General project overview", None)  # No specific project mentioned
        ]
        
        for message, expected_project in test_cases:
            project = manager._extract_project_reference(message, projects)
            if expected_project:
                assert project is not None
                assert project["name"] == expected_project
            else:
                assert project is None
    
    @pytest.mark.asyncio
    async def test_project_insights_calculation(self, manager):
        """Test project insights calculation"""
        projects = [
            {"id": "p1", "aiHealthScore": 90},
            {"id": "p2", "aiHealthScore": 75},
            {"id": "p3", "aiHealthScore": 45},  # At risk (< 60)
            {"id": "p4", "aiHealthScore": 88}
        ]
        
        insights = manager._calculate_project_insights(projects)
        
        assert insights["average_health_score"] == 74.5  # (90 + 75 + 45 + 88) / 4
        assert insights["at_risk_count"] == 1  # One project < 60
        assert insights["top_performing_project"]["aiHealthScore"] == 90
        assert len(insights["needs_attention"]) == 2  # Two projects < 70


class TestCalendarOptimizationContext(TestContextManager):
    """Test calendar optimization context preparation"""
    
    @pytest.mark.asyncio
    async def test_prepare_calendar_optimization_context_success(self, manager, mock_httpx_client):
        """Test successful calendar optimization context preparation"""
        # Mock successful API responses
        mock_calendar_response = MagicMock()
        mock_calendar_response.raise_for_status.return_value = None
        mock_calendar_response.json.return_value = {
            "events": [
                {
                    "id": "event-1",
                    "title": "Team Meeting",
                    "startTime": (datetime.now() + timedelta(hours=2)).isoformat(),
                    "endTime": (datetime.now() + timedelta(hours=3)).isoformat(),
                    "priority": "high"
                },
                {
                    "id": "event-2",
                    "title": "Deep Work Block",
                    "startTime": (datetime.now() + timedelta(days=1, hours=9)).isoformat(),
                    "endTime": (datetime.now() + timedelta(days=1, hours=11)).isoformat(),
                    "eventType": "time_block"
                }
            ]
        }
        
        mock_time_blocks_response = MagicMock()
        mock_time_blocks_response.raise_for_status.return_value = None
        mock_time_blocks_response.json.return_value = {
            "timeBlocks": [
                {
                    "id": "block-1",
                    "title": "Focus Time",
                    "startTime": "09:00",
                    "endTime": "11:00",
                    "type": "deep_work"
                }
            ]
        }
        
        # Set up mock responses in order
        mock_httpx_client.get.side_effect = [mock_calendar_response, mock_time_blocks_response]
        
        user_id = "test-user-123"
        message = "How can I optimize my schedule for better productivity?"
        
        # Execute context preparation
        context = await manager.prepare_calendar_optimization_context(user_id, message)
        
        # Verify context structure
        assert context["user_id"] == user_id
        assert context["message"] == message
        assert "calendar_events" in context
        assert "time_blocks" in context
        assert "schedule_analysis" in context
        assert "optimization_request" in context
        assert "patterns" in context
        
        # Verify calendar events
        assert len(context["calendar_events"]) == 2
        event = context["calendar_events"][0]
        assert event["title"] == "Team Meeting"
        assert event["priority"] == "high"
        
        # Verify time blocks
        assert len(context["time_blocks"]) == 1
        time_block = context["time_blocks"][0]
        assert time_block["title"] == "Focus Time"
        assert time_block["type"] == "deep_work"
        
        # Verify schedule analysis
        schedule_analysis = context["schedule_analysis"]
        assert "meeting_density" in schedule_analysis
        assert "productivity_windows" in schedule_analysis
        assert "schedule_efficiency" in schedule_analysis
        
        # Verify optimization request
        optimization_request = context["optimization_request"]
        assert optimization_request["type"] == "calendar_optimization"
        assert "preferences" in optimization_request
        assert "time_range" in optimization_request
        assert "focus_areas" in optimization_request
        
        # Verify patterns
        patterns = context["patterns"]
        assert "productivity_peaks" in patterns
        assert "meeting_density" in patterns
        assert "free_time_blocks" in patterns
        
        # Verify API calls were made correctly
        assert mock_httpx_client.get.call_count == 2
    
    @pytest.mark.asyncio
    async def test_calendar_focus_extraction(self, manager):
        """Test calendar focus area extraction from messages"""
        test_cases = [
            ("I need better productivity in my schedule", ["productivity"]),
            ("Too many meetings in my calendar", ["meetings"]),
            ("Help me with time blocking", ["time_blocking"]),
            ("My schedule has too many conflicts", ["conflicts"]),
            ("Optimize my calendar for focus", ["productivity"]),
            ("General calendar optimization", ["general_optimization"])
        ]
        
        for message, expected_focuses in test_cases:
            focuses = manager._extract_calendar_focus(message)
            for expected in expected_focuses:
                assert expected in focuses, f"Expected {expected} in focuses for message: {message}"
    
    @pytest.mark.asyncio
    async def test_time_range_extraction(self, manager):
        """Test time range extraction from messages"""
        test_cases = [
            ("Optimize my schedule for today", "today"),
            ("How can I improve my calendar this week?", "week"),
            ("General schedule optimization", "default")  # Should default to 7 days
        ]
        
        for message, expected_range in test_cases:
            time_range = manager._extract_time_range(message)
            
            assert "start" in time_range
            assert "end" in time_range
            
            if expected_range == "today":
                # Start and end should be the same date
                assert time_range["start"] == time_range["end"]
            elif expected_range == "week" or expected_range == "default":
                # End should be 7 days after start
                start_date = datetime.strptime(time_range["start"], "%Y-%m-%d")
                end_date = datetime.strptime(time_range["end"], "%Y-%m-%d")
                assert (end_date - start_date).days == 7
    
    @pytest.mark.asyncio
    async def test_optimization_preferences_extraction(self, manager):
        """Test optimization preferences extraction from messages"""
        test_cases = [
            ("I need more focus time", {"prioritize_deep_work": True}),
            ("Too many meetings", {"minimize_meetings": False}),  # "fewer meetings" not in message
            ("I want to optimize for energy", {"optimize_for_energy": True}),
            ("Keep my existing schedule", {"respect_existing": True}),
            ("General optimization", {"prioritize_deep_work": False})
        ]
        
        for message, expected_prefs in test_cases:
            prefs = manager._extract_optimization_preferences(message)
            
            for pref_key, expected_value in expected_prefs.items():
                assert prefs[pref_key] == expected_value, f"Expected {pref_key}={expected_value} for message: {message}"
    
    @pytest.mark.asyncio
    async def test_schedule_pattern_analysis(self, manager):
        """Test schedule pattern analysis"""
        events = [
            {"title": "Meeting 1", "type": "meeting"},
            {"title": "Meeting 2", "type": "meeting"},
            {"title": "Focus Block", "type": "time_block"}
        ]
        
        time_blocks = [
            {"title": "Deep Work", "type": "focus"},
            {"title": "Email Time", "type": "admin"}
        ]
        
        analysis = manager._analyze_schedule_patterns(events, time_blocks)
        
        assert "meeting_density" in analysis
        assert analysis["meeting_density"] == 3/7  # 3 events over 7 days average
        assert "productivity_windows" in analysis
        assert "conflicts" in analysis
        assert "free_blocks" in analysis
        assert "schedule_efficiency" in analysis
        
        # Verify productivity windows are returned
        assert len(analysis["productivity_windows"]) > 0
        assert isinstance(analysis["productivity_windows"], list)


class TestContextManagerIntegration:
    """Integration tests for context manager"""
    
    @pytest.mark.asyncio
    async def test_global_context_manager_instance(self):
        """Test that global context manager instance is properly configured"""
        assert context_manager is not None
        assert isinstance(context_manager, ContextManager)
        assert hasattr(context_manager, 'rix_frontend_url')
        assert context_manager.rix_frontend_url == "http://localhost:3000"
    
    @pytest.mark.asyncio
    async def test_concurrent_context_preparation(self):
        """Test concurrent context preparation for multiple features"""
        user_id = "test-user-123"
        
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # Mock API responses
            mock_response = MagicMock()
            mock_response.raise_for_status.return_value = None
            mock_response.json.return_value = {"routines": [], "projects": [], "events": [], "timeBlocks": []}
            mock_client.get.return_value = mock_response
            
            # Prepare contexts concurrently
            routine_task = context_manager.prepare_routine_coaching_context(user_id, "routine message")
            project_task = context_manager.prepare_project_intelligence_context(user_id, "project message")
            calendar_task = context_manager.prepare_calendar_optimization_context(user_id, "calendar message")
            
            routine_context, project_context, calendar_context = await asyncio.gather(
                routine_task, project_task, calendar_task
            )
            
            # Verify all contexts were prepared successfully
            assert routine_context["user_id"] == user_id
            assert project_context["user_id"] == user_id
            assert calendar_context["user_id"] == user_id
            
            assert routine_context["analysis_request"]["type"] == "routine_coaching"
            assert project_context["analysis_request"]["type"] == "project_intelligence"
            assert calendar_context["optimization_request"]["type"] == "calendar_optimization"
    
    @pytest.mark.asyncio
    async def test_error_handling_consistency(self):
        """Test consistent error handling across all context preparation methods"""
        user_id = "test-user-123"
        message = "test message"
        
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            # Mock API failure
            mock_client.get.side_effect = Exception("API Error")
            
            # Test all context preparation methods
            routine_context = await context_manager.prepare_routine_coaching_context(user_id, message)
            project_context = await context_manager.prepare_project_intelligence_context(user_id, message)
            calendar_context = await context_manager.prepare_calendar_optimization_context(user_id, message)
            
            # Verify all contexts have consistent error handling
            contexts = [routine_context, project_context, calendar_context]
            
            for context in contexts:
                assert context["user_id"] == user_id
                assert context["message"] == message
                assert "error" in context
                assert "Unable to fetch" in context["error"]
                
                # Verify each has appropriate empty data structures
                if "routines" in context:
                    assert context["routines"] == []
                if "projects" in context:
                    assert context["projects"] == []
                if "calendar_events" in context:
                    assert context["calendar_events"] == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])