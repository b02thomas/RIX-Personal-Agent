#!/usr/bin/env python3
"""
/Users/benediktthomas/RIX Personal Agent/RIX/main-agent/tests/test_workflow_manager.py
Comprehensive test suite for N8N workflow manager service
Tests workflow discovery, categorization, activation, and performance metrics
RELEVANT FILES: app/services/workflow_manager.py, app/services/n8n_client.py, app/services/database.py
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from app.services.workflow_manager import WorkflowManager, workflow_manager
from app.models.n8n import N8NWorkflowInfo, WorkflowSyncResponse
from app.models.chat import WorkflowType


class TestWorkflowManager:
    """Test suite for WorkflowManager class"""

    @pytest.fixture
    def manager(self):
        """Create a fresh WorkflowManager instance for testing"""
        return WorkflowManager()

    @pytest.fixture
    def mock_workflows(self):
        """Mock N8N workflow data"""
        return [
            N8NWorkflowInfo(
                id="wf-001",
                name="Morning Briefing Workflow",
                active=True,
                tags=["morning", "briefing", "intelligence"],
                created_at=datetime.utcnow() - timedelta(days=10),
                updated_at=datetime.utcnow() - timedelta(days=1),
                version="1.2.0"
            ),
            N8NWorkflowInfo(
                id="wf-002",
                name="Task Management Automation",
                active=False,
                tags=["tasks", "productivity", "automation"],
                created_at=datetime.utcnow() - timedelta(days=15),
                updated_at=datetime.utcnow() - timedelta(days=2),
                version="2.1.0"
            ),
            N8NWorkflowInfo(
                id="wf-003",
                name="Calendar Optimization",
                active=True,
                tags=["calendar", "optimization", "scheduling"],
                created_at=datetime.utcnow() - timedelta(days=5),
                updated_at=datetime.utcnow() - timedelta(hours=6),
                version="1.0.0"
            ),
            N8NWorkflowInfo(
                id="wf-004",
                name="News Intelligence Reporter",
                active=True,
                tags=["news", "analysis", "intelligence"],
                created_at=datetime.utcnow() - timedelta(days=8),
                updated_at=datetime.utcnow() - timedelta(hours=3),
                version="1.1.0"
            )
        ]

    @pytest.fixture
    def mock_database_workflows(self):
        """Mock database workflow entries"""
        return [
            {
                "id": "wf-001",
                "name": "Morning Briefing Workflow",
                "active": True,
                "category": "intelligence",
                "tags": ["morning", "briefing", "intelligence"],
                "execution_count": 150,
                "ai_triggered_count": 45,
                "success_rate": 0.96,
                "average_execution_time": 2.3,
                "last_execution_at": datetime.utcnow() - timedelta(hours=2),
                "created_at": datetime.utcnow() - timedelta(days=10),
                "updated_at": datetime.utcnow() - timedelta(days=1)
            },
            {
                "id": "wf-002",
                "name": "Task Management Automation",
                "active": False,
                "category": "productivity",
                "tags": ["tasks", "productivity", "automation"],
                "execution_count": 85,
                "ai_triggered_count": 12,
                "success_rate": 0.89,
                "average_execution_time": 4.1,
                "last_execution_at": datetime.utcnow() - timedelta(days=3),
                "created_at": datetime.utcnow() - timedelta(days=15),
                "updated_at": datetime.utcnow() - timedelta(days=2)
            }
        ]

    def test_initialization(self, manager):
        """Test WorkflowManager initialization"""
        assert manager.sync_in_progress is False
        assert manager.last_sync_time is None
        assert isinstance(manager.workflow_cache, dict)
        assert isinstance(manager.category_cache, dict)
        assert len(manager.categorization_rules) > 0
        
        # Test categorization rules are properly defined
        assert "productivity" in manager.categorization_rules
        assert "intelligence" in manager.categorization_rules
        assert "communication" in manager.categorization_rules
        assert "automation" in manager.categorization_rules
        assert "analytics" in manager.categorization_rules

    def test_categorize_workflow_productivity(self, manager):
        """Test workflow categorization for productivity category"""
        workflow = N8NWorkflowInfo(
            id="test-001",
            name="Task Management System",
            active=True,
            tags=["task", "project", "planning"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(workflow)
        assert category == "productivity"

    def test_categorize_workflow_intelligence(self, manager):
        """Test workflow categorization for intelligence category"""
        workflow = N8NWorkflowInfo(
            id="test-002",
            name="News Analysis and Briefing",
            active=True,
            tags=["news", "analysis", "smart", "ai"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(workflow)
        assert category == "intelligence"

    def test_categorize_workflow_communication(self, manager):
        """Test workflow categorization for communication category"""
        workflow = N8NWorkflowInfo(
            id="test-003",
            name="Email Notification Handler",
            active=True,
            tags=["email", "notification", "message"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(workflow)
        assert category == "communication"

    def test_categorize_workflow_automation(self, manager):
        """Test workflow categorization for automation category"""
        workflow = N8NWorkflowInfo(
            id="test-004",
            name="API Integration Webhook",
            active=True,
            tags=["automation", "webhook", "integration"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(workflow)
        assert category == "automation"

    def test_categorize_workflow_analytics(self, manager):
        """Test workflow categorization for analytics category"""
        workflow = N8NWorkflowInfo(
            id="test-005",
            name="Performance Metrics Dashboard",
            active=True,
            tags=["analytics", "metrics", "dashboard"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(workflow)
        assert category == "analytics"

    def test_categorize_workflow_general_fallback(self, manager):
        """Test workflow categorization fallback to general"""
        workflow = N8NWorkflowInfo(
            id="test-006",
            name="Unknown Workflow",
            active=True,
            tags=["unknown", "misc"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(workflow)
        assert category == "general"

    def test_categorize_workflow_scoring(self, manager):
        """Test workflow categorization scoring logic"""
        # Workflow with multiple productivity keywords should score higher
        workflow = N8NWorkflowInfo(
            id="test-007",
            name="Task Calendar Project Management",
            active=True,
            tags=["task", "calendar", "project", "planning"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(workflow)
        assert category == "productivity"

    def test_generate_workflow_description(self, manager):
        """Test workflow description generation"""
        workflow = N8NWorkflowInfo(
            id="test-001",
            name="Test Workflow",
            active=True,
            tags=["test", "example", "demo"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        # Test productivity category description
        description = manager._generate_workflow_description(workflow, "productivity")
        assert "N8N workflow: Test Workflow" in description
        assert "Enhances productivity and task management" in description
        assert "test, example, demo" in description

        # Test intelligence category description
        description = manager._generate_workflow_description(workflow, "intelligence")
        assert "Provides AI-powered insights and analysis" in description

        # Test general category description
        description = manager._generate_workflow_description(workflow, "general")
        assert "General purpose workflow" in description

    def test_normalize_workflow_type(self, manager):
        """Test workflow type normalization"""
        assert manager._normalize_workflow_type("Task Management") == "task-management"
        assert manager._normalize_workflow_type("Morning_Briefing") == "morning-briefing"
        assert manager._normalize_workflow_type("news analysis") == "news-analysis"
        assert manager._normalize_workflow_type("Simple") == "simple"

    @pytest.mark.asyncio
    async def test_discover_and_sync_workflows_success(self, manager, mock_workflows):
        """Test successful workflow discovery and sync"""
        with patch('app.services.database.database') as mock_db, \
             patch('app.services.n8n_client.n8n_client') as mock_n8n:
            
            # Mock database responses
            mock_db.get_workflows_by_category.return_value = []
            mock_db.store_workflow_metadata.return_value = {"id": "wf-001", "name": "Test"}
            
            # Mock N8N client response
            mock_n8n.discover_workflows.return_value = mock_workflows
            
            result = await manager.discover_and_sync_workflows()
            
            assert isinstance(result, WorkflowSyncResponse)
            assert result.success is True
            assert result.synced_count == len(mock_workflows)
            assert result.new_count == len(mock_workflows)
            assert result.updated_count == 0
            assert len(result.categories) > 0

    @pytest.mark.asyncio
    async def test_discover_and_sync_workflows_with_existing(self, manager, mock_workflows):
        """Test workflow sync with existing workflows"""
        with patch('app.services.database.database') as mock_db, \
             patch('app.services.n8n_client.n8n_client') as mock_n8n:
            
            # Mock existing workflows in database
            existing_workflows = [{"id": "wf-001"}, {"id": "wf-002"}]
            mock_db.get_workflows_by_category.return_value = existing_workflows
            mock_db.store_workflow_metadata.return_value = {"id": "wf-001", "name": "Test"}
            
            # Mock N8N client response
            mock_n8n.discover_workflows.return_value = mock_workflows
            
            result = await manager.discover_and_sync_workflows()
            
            assert result.success is True
            assert result.updated_count == 2  # wf-001 and wf-002 exist
            assert result.new_count == 2  # wf-003 and wf-004 are new

    @pytest.mark.asyncio
    async def test_discover_and_sync_workflows_already_in_progress(self, manager):
        """Test sync prevention when already in progress"""
        manager.sync_in_progress = True
        
        result = await manager.discover_and_sync_workflows()
        
        assert result.success is False
        assert "already in progress" in result.message
        assert result.synced_count == 0

    @pytest.mark.asyncio
    async def test_discover_and_sync_workflows_n8n_error(self, manager):
        """Test sync handling of N8N errors"""
        with patch('app.services.database.database') as mock_db, \
             patch('app.services.n8n_client.n8n_client') as mock_n8n:
            
            mock_db.get_workflows_by_category.return_value = []
            mock_n8n.discover_workflows.side_effect = Exception("N8N connection failed")
            
            result = await manager.discover_and_sync_workflows()
            
            assert result.success is False
            assert "N8N connection failed" in result.message
            assert result.synced_count == 0

    @pytest.mark.asyncio
    async def test_discover_and_sync_workflows_database_error(self, manager, mock_workflows):
        """Test sync handling of database errors"""
        with patch('app.services.database.database') as mock_db, \
             patch('app.services.n8n_client.n8n_client') as mock_n8n:
            
            mock_db.get_workflows_by_category.side_effect = Exception("Database connection failed")
            mock_n8n.discover_workflows.return_value = mock_workflows
            
            result = await manager.discover_and_sync_workflows()
            
            assert result.success is False
            assert "Database connection failed" in result.message

    @pytest.mark.asyncio
    async def test_discover_and_sync_workflows_individual_failure(self, manager, mock_workflows):
        """Test sync with individual workflow failures"""
        with patch('app.services.database.database') as mock_db, \
             patch('app.services.n8n_client.n8n_client') as mock_n8n:
            
            mock_db.get_workflows_by_category.return_value = []
            
            # Mock N8N client response
            mock_n8n.discover_workflows.return_value = mock_workflows
            
            # Mock database store to fail for one workflow
            def store_side_effect(*args, **kwargs):
                if kwargs.get('workflow_id') == 'wf-002':
                    raise Exception("Individual workflow storage failed")
                return {"id": kwargs.get('workflow_id'), "name": "Test"}
            
            mock_db.store_workflow_metadata.side_effect = store_side_effect
            
            result = await manager.discover_and_sync_workflows()
            
            # Should still succeed overall but with reduced count
            assert result.success is True
            assert result.synced_count == len(mock_workflows) - 1  # One failed

    @pytest.mark.asyncio
    async def test_update_category_cache(self, manager, mock_database_workflows):
        """Test category cache update"""
        with patch('app.services.database.database') as mock_db:
            mock_db.get_workflows_by_category.return_value = mock_database_workflows
            
            await manager._update_category_cache()
            
            assert len(manager.category_cache) > 0
            assert "intelligence" in manager.category_cache
            assert "productivity" in manager.category_cache
            assert len(manager.category_cache["intelligence"]) > 0

    @pytest.mark.asyncio
    async def test_update_category_cache_error(self, manager):
        """Test category cache update error handling"""
        with patch('app.services.database.database') as mock_db:
            mock_db.get_workflows_by_category.side_effect = Exception("Database error")
            
            # Should not raise exception
            await manager._update_category_cache()
            
            # Cache should remain empty
            assert len(manager.category_cache) == 0

    @pytest.mark.asyncio
    async def test_get_workflows_by_category(self, manager, mock_database_workflows):
        """Test getting workflows by category"""
        with patch('app.services.database.database') as mock_db:
            mock_db.get_workflows_by_category.return_value = mock_database_workflows
            
            # Test getting all workflows
            workflows = await manager.get_workflows_by_category()
            assert len(workflows) == len(mock_database_workflows)
            
            # Test getting specific category
            productivity_workflows = await manager.get_workflows_by_category("productivity", True)
            assert isinstance(productivity_workflows, list)

    @pytest.mark.asyncio
    async def test_get_workflows_by_category_with_enrichment(self, manager, mock_database_workflows):
        """Test workflow enrichment with performance metrics"""
        with patch('app.services.database.database') as mock_db:
            mock_db.get_workflows_by_category.return_value = mock_database_workflows
            
            workflows = await manager.get_workflows_by_category()
            
            for workflow in workflows:
                assert "performance" in workflow
                assert "ai_trigger_percentage" in workflow
                
                performance = workflow["performance"]
                assert "execution_count" in performance
                assert "ai_triggered_count" in performance
                assert "success_rate" in performance
                assert "average_execution_time" in performance

    @pytest.mark.asyncio
    async def test_get_workflows_by_category_ai_trigger_percentage(self, manager):
        """Test AI trigger percentage calculation"""
        workflow_data = [{
            "id": "wf-001",
            "name": "Test Workflow",
            "execution_count": 100,
            "ai_triggered_count": 25,
            "success_rate": 0.95,
            "average_execution_time": 2.0
        }]
        
        with patch('app.services.database.database') as mock_db:
            mock_db.get_workflows_by_category.return_value = workflow_data
            
            workflows = await manager.get_workflows_by_category()
            
            assert len(workflows) == 1
            assert workflows[0]["ai_trigger_percentage"] == 25.0

    @pytest.mark.asyncio
    async def test_get_workflows_by_category_zero_executions(self, manager):
        """Test AI trigger percentage with zero executions"""
        workflow_data = [{
            "id": "wf-001",
            "name": "Test Workflow",
            "execution_count": 0,
            "ai_triggered_count": 0,
            "success_rate": 0.0,
            "average_execution_time": 0.0
        }]
        
        with patch('app.services.database.database') as mock_db:
            mock_db.get_workflows_by_category.return_value = workflow_data
            
            workflows = await manager.get_workflows_by_category()
            
            assert workflows[0]["ai_trigger_percentage"] == 0.0

    @pytest.mark.asyncio
    async def test_get_workflows_by_category_error(self, manager):
        """Test error handling in get_workflows_by_category"""
        with patch('app.services.database.database') as mock_db:
            mock_db.get_workflows_by_category.side_effect = Exception("Database error")
            
            workflows = await manager.get_workflows_by_category()
            
            assert workflows == []

    def test_get_sync_status(self, manager):
        """Test sync status retrieval"""
        # Test initial state
        status = manager.get_sync_status()
        
        assert asyncio.iscoroutine(status)
        
        # Test with sync in progress
        manager.sync_in_progress = True
        manager.last_sync_time = datetime.utcnow()
        manager.workflow_cache = {"wf-001": Mock()}
        manager.category_cache = {"productivity": [Mock()]}
        
        status = asyncio.run(manager.get_sync_status())
        
        assert status["sync_in_progress"] is True
        assert status["last_sync_time"] is not None
        assert status["cached_workflows"] == 1
        assert status["cached_categories"] == 1

    def test_categorization_rules_completeness(self, manager):
        """Test that categorization rules are comprehensive"""
        rules = manager.categorization_rules
        
        # Check that all expected categories are present
        expected_categories = ["productivity", "communication", "intelligence", "automation", "analytics"]
        for category in expected_categories:
            assert category in rules
            assert isinstance(rules[category], list)
            assert len(rules[category]) > 0

    def test_categorization_rules_keywords(self, manager):
        """Test specific categorization keywords"""
        rules = manager.categorization_rules
        
        # Productivity keywords
        assert "task" in rules["productivity"]
        assert "calendar" in rules["productivity"]
        assert "project" in rules["productivity"]
        
        # Intelligence keywords
        assert "news" in rules["intelligence"]
        assert "analysis" in rules["intelligence"]
        assert "ai" in rules["intelligence"]
        
        # Communication keywords
        assert "chat" in rules["communication"]
        assert "message" in rules["communication"]
        assert "email" in rules["communication"]

    @pytest.mark.asyncio
    async def test_workflow_cache_management(self, manager, mock_workflows):
        """Test workflow cache management during sync"""
        with patch('app.services.database.database') as mock_db, \
             patch('app.services.n8n_client.n8n_client') as mock_n8n:
            
            mock_db.get_workflows_by_category.return_value = []
            mock_db.store_workflow_metadata.return_value = {"id": "wf-001", "name": "Test"}
            mock_n8n.discover_workflows.return_value = mock_workflows
            
            # Cache should be empty initially
            assert len(manager.workflow_cache) == 0
            
            await manager.discover_and_sync_workflows()
            
            # Cache should be populated after sync
            assert len(manager.workflow_cache) == len(mock_workflows)
            for workflow in mock_workflows:
                assert workflow.id in manager.workflow_cache

    @pytest.mark.asyncio
    async def test_concurrent_sync_prevention(self, manager):
        """Test prevention of concurrent sync operations"""
        async def slow_sync():
            manager.sync_in_progress = True
            await asyncio.sleep(0.1)  # Simulate slow sync
            manager.sync_in_progress = False
            return WorkflowSyncResponse(
                synced_count=1, updated_count=0, new_count=1,
                categories=["test"], success=True, message="Success"
            )
        
        with patch.object(manager, 'discover_and_sync_workflows', side_effect=slow_sync):
            # Start first sync
            task1 = asyncio.create_task(manager.discover_and_sync_workflows())
            
            # Try to start second sync immediately
            result2 = await manager.discover_and_sync_workflows()
            
            # Second sync should be rejected
            assert result2.success is False
            assert "already in progress" in result2.message
            
            # Wait for first sync to complete
            result1 = await task1
            assert result1.success is True


class TestWorkflowManagerIntegration:
    """Integration tests for WorkflowManager"""

    def test_global_workflow_manager_instance(self):
        """Test that global workflow_manager instance is properly initialized"""
        assert workflow_manager is not None
        assert isinstance(workflow_manager, WorkflowManager)
        assert workflow_manager.sync_in_progress is False

    @pytest.mark.asyncio
    async def test_workflow_manager_with_real_structure(self):
        """Test workflow manager with realistic workflow structure"""
        manager = WorkflowManager()
        
        # Test with workflows that have realistic names and tags
        realistic_workflows = [
            N8NWorkflowInfo(
                id="morning-brief-001",
                name="Daily Morning Intelligence Brief",
                active=True,
                tags=["morning", "daily", "intelligence", "news", "briefing"],
                created_at=datetime.utcnow() - timedelta(days=30),
                updated_at=datetime.utcnow() - timedelta(hours=2),
                version="2.3.1"
            ),
            N8NWorkflowInfo(
                id="task-mgmt-002",
                name="Automated Task Prioritization",
                active=True,
                tags=["tasks", "productivity", "automation", "priority"],
                created_at=datetime.utcnow() - timedelta(days=20),
                updated_at=datetime.utcnow() - timedelta(days=1),
                version="1.8.0"
            ),
            N8NWorkflowInfo(
                id="comm-hub-003",
                name="Team Communication Hub",
                active=False,
                tags=["communication", "team", "chat", "notifications"],
                created_at=datetime.utcnow() - timedelta(days=45),
                updated_at=datetime.utcnow() - timedelta(days=5),
                version="1.0.2"
            )
        ]
        
        # Test categorization
        categories = [manager._categorize_workflow(wf) for wf in realistic_workflows]
        assert "intelligence" in categories
        assert "productivity" in categories
        assert "communication" in categories

    @pytest.mark.asyncio
    async def test_error_recovery_and_logging(self, caplog):
        """Test error recovery and logging behavior"""
        manager = WorkflowManager()
        
        with patch('app.services.n8n_client.n8n_client') as mock_n8n:
            mock_n8n.discover_workflows.side_effect = Exception("Test error for logging")
            
            result = await manager.discover_and_sync_workflows()
            
            assert result.success is False
            # Check that error was logged (if logging is configured)

    def test_workflow_description_generation_edge_cases(self):
        """Test workflow description generation with edge cases"""
        manager = WorkflowManager()
        
        # Test workflow with no tags
        workflow_no_tags = N8NWorkflowInfo(
            id="test-001",
            name="Simple Workflow",
            active=True,
            tags=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        description = manager._generate_workflow_description(workflow_no_tags, "general")
        assert "Simple Workflow" in description
        assert "General purpose workflow" in description
        
        # Test workflow with many tags
        workflow_many_tags = N8NWorkflowInfo(
            id="test-002",
            name="Complex Workflow",
            active=True,
            tags=["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        description = manager._generate_workflow_description(workflow_many_tags, "automation")
        assert "Complex Workflow" in description
        assert "tag1, tag2, tag3" in description  # Should limit to first 3 tags

    def test_categorization_with_mixed_signals(self):
        """Test categorization when workflow has keywords from multiple categories"""
        manager = WorkflowManager()
        
        # Workflow with mixed category signals
        mixed_workflow = N8NWorkflowInfo(
            id="mixed-001",
            name="Task Management with AI Analysis",
            active=True,
            tags=["task", "ai", "analysis", "automation", "project"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            version="1.0.0"
        )
        
        category = manager._categorize_workflow(mixed_workflow)
        
        # Should pick the category with highest score
        # This workflow should likely be categorized as "productivity" due to "task" and "project"
        # but could also be "intelligence" due to "ai" and "analysis"
        assert category in ["productivity", "intelligence"]