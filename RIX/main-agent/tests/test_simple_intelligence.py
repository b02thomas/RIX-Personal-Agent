# /main-agent/tests/test_simple_intelligence.py
# Simple test to validate Phase 5 Intelligence Features approach
# Tests core intelligence patterns and routing logic without complex dependencies
# RELEVANT FILES: /main-agent/app/services/message_router.py

import os
import re
import sys

import pytest

# Add main-agent directory to Python path so we can import 'app' module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.chat import WorkflowType
from app.services.message_router import MessageRouter


class TestSimpleIntelligence:
    """Simple validation tests for Phase 5 Intelligence Features"""

    @pytest.fixture
    def router(self):
        """Create MessageRouter instance"""
        return MessageRouter()

    def test_routine_coaching_patterns(self, router):
        """Test that routine coaching patterns are properly configured"""
        patterns = router.workflow_patterns[WorkflowType.ROUTINE_COACHING]

        assert "routine" in patterns["keywords"]
        assert "habit" in patterns["keywords"]
        assert "coaching" in patterns["keywords"]
        assert patterns["priority"] == 0.85
        assert len(patterns["patterns"]) > 0

    def test_project_intelligence_patterns(self, router):
        """Test that project intelligence patterns are properly configured"""
        patterns = router.workflow_patterns[WorkflowType.PROJECT_INTELLIGENCE]

        assert "project" in patterns["keywords"]
        assert "health score" in patterns["keywords"]  # It's "health score", not just "health"
        assert "intelligence" in patterns["keywords"]
        assert patterns["priority"] == 0.82
        assert len(patterns["patterns"]) > 0

    def test_calendar_optimization_patterns(self, router):
        """Test that calendar optimization patterns are properly configured"""
        patterns = router.workflow_patterns[WorkflowType.CALENDAR_OPTIMIZATION]

        assert "calendar" in patterns["keywords"]
        assert "schedule" in patterns["keywords"]
        assert "optimize" in patterns["keywords"]
        assert patterns["priority"] == 0.83
        assert len(patterns["patterns"]) > 0

    def test_intelligence_pattern_priorities(self, router):
        """Test that intelligence patterns have appropriate priorities"""
        patterns = router.workflow_patterns

        # Intelligence features should have higher priorities than some existing features
        assert patterns[WorkflowType.ROUTINE_COACHING]["priority"] > patterns[WorkflowType.TASK_MANAGEMENT]["priority"]
        assert patterns[WorkflowType.PROJECT_INTELLIGENCE]["priority"] > patterns[WorkflowType.PROJECT_CHATBOT]["priority"]

    def test_simple_pattern_matching(self, router):
        """Test basic pattern matching for intelligence features"""
        # Test routine coaching recognition using patterns
        routine_message = "How can I improve my morning routine?"
        routine_patterns = router.workflow_patterns[WorkflowType.ROUTINE_COACHING]["patterns"]

        # Check if any pattern matches
        routine_match = any(re.search(pattern, routine_message, re.IGNORECASE) for pattern in routine_patterns)
        assert routine_match, "Should match routine coaching pattern"

        # Test project intelligence recognition
        project_message = "Analyze my project health scores"
        project_patterns = router.workflow_patterns[WorkflowType.PROJECT_INTELLIGENCE]["patterns"]

        project_match = any(re.search(pattern, project_message, re.IGNORECASE) for pattern in project_patterns)
        assert project_match, "Should match project intelligence pattern"

        # Test calendar optimization recognition
        calendar_message = "Optimize my schedule for productivity"
        calendar_patterns = router.workflow_patterns[WorkflowType.CALENDAR_OPTIMIZATION]["patterns"]

        calendar_match = any(re.search(pattern, calendar_message, re.IGNORECASE) for pattern in calendar_patterns)
        assert calendar_match, "Should match calendar optimization pattern"

    def test_intelligence_features_exist(self, router):
        """Test that all Phase 5 intelligence features are properly registered"""
        workflow_types = router.workflow_patterns.keys()

        assert WorkflowType.ROUTINE_COACHING in workflow_types
        assert WorkflowType.PROJECT_INTELLIGENCE in workflow_types
        assert WorkflowType.CALENDAR_OPTIMIZATION in workflow_types

    def test_keyword_scoring_basic(self, router):
        """Test basic keyword scoring for intelligence patterns"""
        routine_keywords = router.workflow_patterns[WorkflowType.ROUTINE_COACHING]["keywords"]

        # Test basic keyword presence
        message_with_keywords = "routine optimization coaching advice"
        words = message_with_keywords.lower().split()

        # Check if any keywords match
        keyword_matches = sum(1 for word in words if word in routine_keywords)
        assert keyword_matches > 0, "Should find keyword matches"

        # Message without keywords should have no matches
        unrelated_message = "weather forecast tomorrow"
        unrelated_words = unrelated_message.lower().split()

        no_matches = sum(1 for word in unrelated_words if word in routine_keywords)
        assert no_matches == 0, "Should find no keyword matches"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
