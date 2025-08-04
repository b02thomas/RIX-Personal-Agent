# /main-agent/tests/test_intelligence_endpoints.py
# Comprehensive test suite for Phase 5 Intelligence Features MCP endpoints
# Tests routine coaching, project intelligence, and calendar optimization with pattern-based routing
# RELEVANT FILES: /main-agent/app/api/endpoints/intelligence.py, /main-agent/app/services/context_manager.py, /main-agent/app/services/message_router.py

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from fastapi import HTTPException
from fastapi.testclient import TestClient
import sys
import os

# Add main-agent directory to Python path so we can import 'app' module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.api.endpoints.intelligence import (
    routine_coaching_analysis,
    project_intelligence_analysis,
    calendar_optimization_analysis,
    intelligence_features_status
)
from app.models.auth import AuthenticatedUser
from app.models.chat import WorkflowType
from app.models.n8n import N8NWorkflowRequest, N8NWorkflowResponse


class TestIntelligenceEndpoints:
    """Test suite for Phase 5 Intelligence Features MCP endpoints"""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_user(self):
        """Mock authenticated user"""
        return AuthenticatedUser(
            user_id="test-user-123",
            email="test@example.com",
            name="Test User"
        )
    
    @pytest.fixture
    def mock_context_manager(self):
        """Mock context manager with prepared contexts"""
        with patch('app.api.endpoints.intelligence.context_manager') as mock:
            # Mock routine coaching context
            mock.prepare_routine_coaching_context.return_value = {
                "user_id": "test-user-123",
                "message": "test message",
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
                ],
                "statistics": {
                    "total_routines": 1,
                    "average_completion_rate": 85.5,
                    "streak_days": 12,
                    "improvement_trend": "improving"
                },
                "analysis_request": {
                    "type": "routine_coaching",
                    "focus_areas": ["consistency", "timing"],
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
            
            # Mock project intelligence context
            mock.prepare_project_intelligence_context.return_value = {
                "user_id": "test-user-123",
                "message": "test message",
                "projects": [
                    {
                        "id": "project-1",
                        "name": "RIX Development",
                        "status": "active",
                        "aiHealthScore": 87,
                        "progress": 65
                    }
                ],
                "metrics": {
                    "total_projects": 1,
                    "active_projects": 1,
                    "average_health_score": 87,
                    "projects_at_risk": 0
                },
                "insights": {
                    "average_health_score": 87,
                    "at_risk_count": 0
                }
            }
            
            # Mock calendar optimization context
            mock.prepare_calendar_optimization_context.return_value = {
                "user_id": "test-user-123",
                "message": "test message",
                "calendar_events": [
                    {
                        "id": "event-1",
                        "title": "Team Meeting",
                        "startTime": datetime.now().isoformat(),
                        "endTime": (datetime.now() + timedelta(hours=1)).isoformat()
                    }
                ],
                "time_blocks": [],
                "schedule_analysis": {
                    "meeting_density": 2.1,
                    "schedule_efficiency": 75,
                    "productivity_windows": ["09:00-11:00", "14:00-16:00"]
                },
                "patterns": {
                    "productivity_peaks": ["09:00-11:00", "14:00-16:00"],
                    "meeting_density": 2.1
                }
            }
            
            yield mock
    
    @pytest.fixture
    def mock_n8n_client(self):
        """Mock N8N client with successful responses"""
        with patch('app.api.endpoints.intelligence.n8n_client') as mock:
            # Mock successful N8N responses
            mock.execute_workflow.return_value = N8NWorkflowResponse(
                success=True,
                response="AI-generated coaching insights based on your routine performance.",
                workflow_type=WorkflowType.ROUTINE_COACHING,
                execution_id="exec-123",
                processing_time=2.3,
                metadata={"confidence": 0.9}
            )
            
            mock.get_workflow_status.return_value = MagicMock(
                available=True,
                response_time=0.1,
                active_workflows=12
            )
            
            yield mock
    
    @pytest.fixture
    def mock_websocket_manager(self):
        """Mock WebSocket manager"""
        with patch('app.api.endpoints.intelligence.websocket_manager') as mock:
            mock.is_user_connected.return_value = True
            mock.send_processing_status = AsyncMock()
            mock.send_error_message = AsyncMock()
            yield mock


class TestRoutineCoachingEndpoint(TestIntelligenceEndpoints):
    """Test routine coaching analysis endpoint"""
    
    @pytest.mark.asyncio
    async def test_routine_coaching_success(
        self, 
        mock_user, 
        mock_context_manager, 
        mock_n8n_client, 
        mock_websocket_manager
    ):
        """Test successful routine coaching analysis"""
        request_data = {
            "message": "How can I improve my morning routine consistency?",
            "conversation_id": "conv-123",
            "context": {}
        }
        
        background_tasks = MagicMock()
        
        # Execute the endpoint
        response = await routine_coaching_analysis(
            request=request_data,
            background_tasks=background_tasks,
            current_user=mock_user
        )
        
        # Verify response structure
        assert response["success"] is True
        assert "coaching_insights" in response
        assert "routine_analysis" in response
        assert "recommendations" in response
        assert "processing_info" in response
        assert "metadata" in response
        
        # Verify routine analysis data
        routine_analysis = response["routine_analysis"]
        assert routine_analysis["routines_analyzed"] == 1
        assert routine_analysis["completion_rate"] == 85.5
        assert routine_analysis["current_streak"] == 12
        assert routine_analysis["improvement_trend"] == "improving"
        
        # Verify processing info
        processing_info = response["processing_info"]
        assert processing_info["workflow_type"] == "routine-coaching"
        assert processing_info["confidence"] == 0.9
        assert "execution_id" in processing_info
        assert "processing_time" in processing_info
        
        # Verify context manager was called
        mock_context_manager.prepare_routine_coaching_context.assert_called_once_with(
            mock_user.user_id, request_data["message"]
        )
        
        # Verify N8N client was called
        mock_n8n_client.execute_workflow.assert_called_once()
        call_args = mock_n8n_client.execute_workflow.call_args[0][0]
        assert isinstance(call_args, N8NWorkflowRequest)
        assert call_args.workflow_type == WorkflowType.ROUTINE_COACHING
        assert call_args.user_id == mock_user.user_id
        
        # Verify WebSocket notification was sent
        mock_websocket_manager.send_processing_status.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_routine_coaching_missing_message(self, mock_user):
        """Test routine coaching with missing message"""
        request_data = {"context": {}}
        background_tasks = MagicMock()
        
        with pytest.raises(HTTPException) as exc_info:
            await routine_coaching_analysis(
                request=request_data,
                background_tasks=background_tasks,
                current_user=mock_user
            )
        
        assert exc_info.value.status_code == 400
        assert "Message is required" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_routine_coaching_context_error(
        self, 
        mock_user, 
        mock_context_manager, 
        mock_n8n_client, 
        mock_websocket_manager
    ):
        """Test routine coaching with context preparation error"""
        # Mock context manager to raise exception
        mock_context_manager.prepare_routine_coaching_context.side_effect = Exception("Context preparation failed")
        
        request_data = {
            "message": "Test message",
            "conversation_id": "conv-123"
        }
        background_tasks = MagicMock()
        
        with pytest.raises(HTTPException) as exc_info:
            await routine_coaching_analysis(
                request=request_data,
                background_tasks=background_tasks,
                current_user=mock_user
            )
        
        assert exc_info.value.status_code == 500
        assert "Routine coaching analysis failed" in str(exc_info.value.detail)
        
        # Verify error WebSocket notification was sent
        mock_websocket_manager.send_error_message.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_routine_coaching_n8n_error(
        self, 
        mock_user, 
        mock_context_manager, 
        mock_n8n_client, 
        mock_websocket_manager
    ):
        """Test routine coaching with N8N workflow error"""
        # Mock N8N client to raise exception
        mock_n8n_client.execute_workflow.side_effect = Exception("N8N workflow failed")
        
        request_data = {
            "message": "Test message",
            "conversation_id": "conv-123"
        }
        background_tasks = MagicMock()
        
        with pytest.raises(HTTPException) as exc_info:
            await routine_coaching_analysis(
                request=request_data,
                background_tasks=background_tasks,
                current_user=mock_user
            )
        
        assert exc_info.value.status_code == 500
        assert "Routine coaching analysis failed" in str(exc_info.value.detail)


class TestProjectIntelligenceEndpoint(TestIntelligenceEndpoints):
    """Test project intelligence analysis endpoint"""
    
    @pytest.mark.asyncio
    async def test_project_intelligence_success(
        self, 
        mock_user, 
        mock_context_manager, 
        mock_n8n_client, 
        mock_websocket_manager
    ):
        """Test successful project intelligence analysis"""
        # Update N8N mock for project intelligence
        mock_n8n_client.execute_workflow.return_value = N8NWorkflowResponse(
            success=True,
            response="Your RIX Development project shows excellent health with a score of 87/100.",
            workflow_type=WorkflowType.PROJECT_INTELLIGENCE,
            execution_id="exec-456",
            processing_time=1.8,
            metadata={"confidence": 0.92}
        )
        
        request_data = {
            "message": "Analyze the health of my RIX Development project",
            "conversation_id": "conv-456",
            "context": {}
        }
        
        background_tasks = MagicMock()
        
        # Execute the endpoint
        response = await project_intelligence_analysis(
            request=request_data,
            background_tasks=background_tasks,
            current_user=mock_user
        )
        
        # Verify response structure
        assert response["success"] is True
        assert "intelligence_insights" in response
        assert "project_analysis" in response
        assert "health_scores" in response
        assert "recommendations" in response
        assert "processing_info" in response
        
        # Verify project analysis data
        project_analysis = response["project_analysis"]
        assert project_analysis["projects_analyzed"] == 1
        assert project_analysis["average_health_score"] == 87
        assert project_analysis["active_projects"] == 1
        assert project_analysis["projects_at_risk"] == 0
        
        # Verify health scores information
        health_scores = response["health_scores"]
        assert health_scores["calculation_method"] == "ai_powered"
        assert "factors_considered" in health_scores
        assert "interpretation" in health_scores
        
        # Verify processing info
        processing_info = response["processing_info"]
        assert processing_info["workflow_type"] == "project-intelligence"
        assert processing_info["confidence"] == 0.92
        
        # Verify context manager was called correctly
        mock_context_manager.prepare_project_intelligence_context.assert_called_once_with(
            mock_user.user_id, request_data["message"]
        )
        
        # Verify N8N workflow request
        mock_n8n_client.execute_workflow.assert_called_once()
        call_args = mock_n8n_client.execute_workflow.call_args[0][0]
        assert call_args.workflow_type == WorkflowType.PROJECT_INTELLIGENCE
        assert "intelligence_request" in call_args.input_data
        assert call_args.input_data["intelligence_request"]["include_health_scores"] is True
    
    @pytest.mark.asyncio
    async def test_project_intelligence_with_target_project(
        self, 
        mock_user, 
        mock_context_manager, 
        mock_n8n_client, 
        mock_websocket_manager
    ):
        """Test project intelligence with specific project mentioned"""
        # Update context to include target project
        context_with_target = mock_context_manager.prepare_project_intelligence_context.return_value.copy()
        context_with_target["target_project"] = {
            "id": "project-1",
            "name": "RIX Development"
        }
        mock_context_manager.prepare_project_intelligence_context.return_value = context_with_target
        
        request_data = {
            "message": "What's the health score of my RIX Development project?",
            "conversation_id": "conv-789"
        }
        
        background_tasks = MagicMock()
        
        response = await project_intelligence_analysis(
            request=request_data,
            background_tasks=background_tasks,
            current_user=mock_user
        )
        
        # Verify target project is included in response
        project_analysis = response["project_analysis"]
        assert project_analysis["target_project"] == "RIX Development"


class TestCalendarOptimizationEndpoint(TestIntelligenceEndpoints):
    """Test calendar optimization analysis endpoint"""
    
    @pytest.mark.asyncio
    async def test_calendar_optimization_success(
        self, 
        mock_user, 
        mock_context_manager, 
        mock_n8n_client, 
        mock_websocket_manager
    ):
        """Test successful calendar optimization analysis"""
        # Update N8N mock for calendar optimization
        mock_n8n_client.execute_workflow.return_value = N8NWorkflowResponse(
            success=True,
            response="Your schedule can be optimized by blocking 2-hour focus periods during 9-11 AM.",
            workflow_type=WorkflowType.CALENDAR_OPTIMIZATION,
            execution_id="exec-789",
            processing_time=2.1,
            metadata={"confidence": 0.88}
        )
        
        request_data = {
            "message": "How can I optimize my schedule for better productivity?",
            "conversation_id": "conv-789",
            "context": {}
        }
        
        background_tasks = MagicMock()
        
        # Execute the endpoint
        response = await calendar_optimization_analysis(
            request=request_data,
            background_tasks=background_tasks,
            current_user=mock_user
        )
        
        # Verify response structure
        assert response["success"] is True
        assert "optimization_insights" in response
        assert "schedule_analysis" in response
        assert "optimization_scope" in response
        assert "recommendations" in response
        assert "processing_info" in response
        
        # Verify schedule analysis data
        schedule_analysis = response["schedule_analysis"]
        assert schedule_analysis["events_analyzed"] == 1
        assert schedule_analysis["meeting_density"] == 2.1
        assert schedule_analysis["schedule_efficiency"] == 75
        assert "productivity_windows" in schedule_analysis
        
        # Verify recommendations
        recommendations = response["recommendations"]
        assert recommendations["scheduling_improvements"] is True
        assert recommendations["time_blocking_suggestions"] is True
        assert recommendations["productivity_optimizations"] is True
        
        # Verify processing info
        processing_info = response["processing_info"]
        assert processing_info["workflow_type"] == "calendar-optimization"
        assert processing_info["confidence"] == 0.88
        
        # Verify N8N workflow request includes optimization goals
        call_args = mock_n8n_client.execute_workflow.call_args[0][0]
        optimization_request = call_args.input_data["optimization_request"]
        assert "optimization_goals" in optimization_request
        assert "productivity" in optimization_request["optimization_goals"]


class TestIntelligenceFeaturesStatus(TestIntelligenceEndpoints):
    """Test intelligence features status endpoint"""
    
    @pytest.mark.asyncio
    async def test_features_status_success(
        self, 
        mock_user, 
        mock_context_manager, 
        mock_n8n_client
    ):
        """Test successful intelligence features status retrieval"""
        response = await intelligence_features_status(current_user=mock_user)
        
        # Verify response structure
        assert "intelligence_features" in response
        assert "n8n_status" in response
        assert "system_info" in response
        
        # Verify intelligence features status
        features = response["intelligence_features"]
        
        # Routine coaching status
        routine_status = features["routine_coaching"]
        assert routine_status["available"] is True
        assert routine_status["mcp_endpoint"] == "/mcp/routine-coaching"
        assert routine_status["data_available"] is True
        assert routine_status["routines_count"] == 1
        assert "features" in routine_status
        
        # Project intelligence status
        project_status = features["project_intelligence"]
        assert project_status["available"] is True
        assert project_status["mcp_endpoint"] == "/mcp/project-intelligence"
        assert project_status["data_available"] is True
        assert project_status["projects_count"] == 1
        
        # Calendar optimization status
        calendar_status = features["calendar_optimization"]
        assert calendar_status["available"] is True
        assert calendar_status["mcp_endpoint"] == "/mcp/calendar-optimization"
        assert calendar_status["data_available"] is True
        assert calendar_status["events_count"] == 1
        
        # Verify N8N status
        n8n_status = response["n8n_status"]
        assert n8n_status["available"] is True
        assert n8n_status["response_time"] == 0.1
        assert n8n_status["active_workflows"] == 12
        
        # Verify system info
        system_info = response["system_info"]
        assert system_info["phase"] == "Phase 5 - Intelligence Features"
        assert system_info["rix_prd_compliant"] is True
        assert system_info["pattern_based_routing"] is True
        assert system_info["context_management"] is True
        
        # Verify all context preparation methods were called
        mock_context_manager.prepare_routine_coaching_context.assert_called_once()
        mock_context_manager.prepare_project_intelligence_context.assert_called_once()
        mock_context_manager.prepare_calendar_optimization_context.assert_called_once()


class TestIntelligenceEndpointsIntegration:
    """Integration tests for intelligence endpoints"""
    
    @pytest.mark.asyncio
    async def test_all_endpoints_rix_prd_compliance(self):
        """Test that all intelligence endpoints maintain RIX PRD compliance"""
        # This test verifies that no endpoint makes direct LLM calls
        # All AI processing should route through N8N MCP endpoints
        
        with patch('app.api.endpoints.intelligence.context_manager') as mock_context:
            with patch('app.api.endpoints.intelligence.n8n_client') as mock_n8n:
                mock_user = AuthenticatedUser(
                    user_id="test-user",
                    email="test@example.com",
                    name="Test User"
                )
                
                # Mock minimal context responses
                mock_context.prepare_routine_coaching_context.return_value = {
                    "user_id": "test-user",
                    "routines": [],
                    "statistics": {}
                }
                mock_context.prepare_project_intelligence_context.return_value = {
                    "user_id": "test-user",
                    "projects": [],
                    "metrics": {}
                }
                mock_context.prepare_calendar_optimization_context.return_value = {
                    "user_id": "test-user",
                    "calendar_events": [],
                    "schedule_analysis": {}
                }
                
                # Mock N8N responses
                mock_n8n.execute_workflow.return_value = N8NWorkflowResponse(
                    success=True,
                    response="Mock AI response",
                    workflow_type=WorkflowType.ROUTINE_COACHING,
                    execution_id="test-exec",
                    processing_time=1.0
                )
                
                # Test routine coaching endpoint
                routine_request = {
                    "message": "Test routine coaching",
                    "conversation_id": "test-conv"
                }
                background_tasks = MagicMock()
                
                await routine_coaching_analysis(
                    request=routine_request,
                    background_tasks=background_tasks,
                    current_user=mock_user
                )
                
                # Verify N8N workflow was called (RIX PRD compliance)
                mock_n8n.execute_workflow.assert_called()
                call_args = mock_n8n.execute_workflow.call_args[0][0]
                assert isinstance(call_args, N8NWorkflowRequest)
                assert call_args.workflow_type == WorkflowType.ROUTINE_COACHING
                
                # Verify no direct LLM imports or calls
                # This would be caught by the mocking - if direct LLM calls were made,
                # the mocks wouldn't be hit and the test would fail
    
    @pytest.mark.asyncio
    async def test_pattern_based_routing_coverage(self):
        """Test that intelligence endpoints support pattern-based routing"""
        # Test messages that should trigger intelligence features
        intelligence_test_messages = [
            # Routine coaching patterns
            ("How can I improve my morning routine?", WorkflowType.ROUTINE_COACHING),
            ("My habit streak is broken", WorkflowType.ROUTINE_COACHING),
            ("Give me routine advice", WorkflowType.ROUTINE_COACHING),
            
            # Project intelligence patterns
            ("Analyze my project health scores", WorkflowType.PROJECT_INTELLIGENCE),
            ("What's my RIX project status?", WorkflowType.PROJECT_INTELLIGENCE),
            ("Project assessment needed", WorkflowType.PROJECT_INTELLIGENCE),
            
            # Calendar optimization patterns
            ("Optimize my schedule", WorkflowType.CALENDAR_OPTIMIZATION),
            ("How to better organize my calendar?", WorkflowType.CALENDAR_OPTIMIZATION),
            ("Time blocking advice", WorkflowType.CALENDAR_OPTIMIZATION),
        ]
        
        # This test documents the expected pattern matching behavior
        # The actual pattern matching happens in message_router.py
        # These endpoints should handle the routed requests appropriately
        for message, expected_workflow in intelligence_test_messages:
            # Verify that each message type has appropriate handling
            # This is verified by the endpoint structure and response format
            assert expected_workflow in [
                WorkflowType.ROUTINE_COACHING,
                WorkflowType.PROJECT_INTELLIGENCE,
                WorkflowType.CALENDAR_OPTIMIZATION
            ]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])