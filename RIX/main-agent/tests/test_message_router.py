# /main-agent/tests/test_message_router.py
# Comprehensive test suite for Message Router pattern-based intelligence routing
# Tests pattern matching for routine coaching, project intelligence, and calendar optimization
# RELEVANT FILES: /main-agent/app/services/message_router.py, /main-agent/app/models/chat.py

import pytest
import asyncio
from unittest.mock import MagicMock, patch
from typing import List, Dict, Any

from app.services.message_router import MessageRouter
from app.models.chat import WorkflowType, ContentAnalysisResult


class TestMessageRouter:
    """Test suite for Phase 5 Intelligence Features message routing"""
    
    @pytest.fixture
    def router(self):
        """Create MessageRouter instance"""
        return MessageRouter()
    
    @pytest.fixture
    def mock_nltk_data(self):
        """Mock NLTK data downloads"""
        with patch('app.services.message_router.nltk') as mock_nltk:
            mock_nltk.data.find.return_value = True
            yield mock_nltk


class TestIntelligencePatternMatching(TestMessageRouter):
    """Test pattern matching for Phase 5 Intelligence Features"""
    
    def test_routine_coaching_pattern_recognition(self, router):
        """Test routine coaching pattern matching"""
        routine_messages = [
            # Direct routine coaching requests
            "How can I improve my morning routine?",
            "My habit streak is broken, what should I do?",
            "Give me advice on routine consistency",
            "Help me optimize my daily habits",
            "I'm struggling with my routine",
            
            # Specific routine improvement queries
            "How to make my morning routine better?",
            "Advice for improving routine performance",
            "My routine needs optimization",
            "Coaching for habit building",
            "Help with routine streak maintenance",
            
            # Complex routine questions
            "What's the best way to improve my morning routine consistency?",
            "I need coaching advice for my evening routine habits",
            "How can I optimize my routine for better results?",
            "My routine completion rate is low, need suggestions"
        ]
        
        for message in routine_messages:
            # Extract workflow patterns
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            # Should identify as routine coaching with high confidence
            best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
            assert best_workflow[0] == WorkflowType.ROUTINE_COACHING, f"Failed for message: {message}"
            assert best_workflow[1] >= 0.7, f"Low confidence ({best_workflow[1]}) for message: {message}"
    
    def test_project_intelligence_pattern_recognition(self, router):
        """Test project intelligence pattern matching"""
        project_messages = [
            # Direct project intelligence requests
            "Analyze my project health scores",
            "What's the status of my RIX Development project?",
            "Give me project intelligence insights",
            "Project assessment needed",
            "How are my projects performing?",
            
            # Health score specific queries
            "What's my project health score?",
            "Calculate AI health scores for projects",
            "Project health analysis required",
            "AI score for my development project",
            "Health check on active projects",
            
            # Project analysis requests
            "Analyze progress on my projects",
            "Project intelligence review needed",
            "Assessment of project status",
            "Project metrics analysis",
            "Insight into project performance"
        ]
        
        for message in project_messages:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
            assert best_workflow[0] == WorkflowType.PROJECT_INTELLIGENCE, f"Failed for message: {message}"
            assert best_workflow[1] >= 0.7, f"Low confidence ({best_workflow[1]}) for message: {message}"
    
    def test_calendar_optimization_pattern_recognition(self, router):
        """Test calendar optimization pattern matching"""
        calendar_messages = [
            # Direct calendar optimization requests
            "Optimize my schedule for better productivity",
            "How can I improve my calendar organization?",
            "Schedule optimization needed",
            "Calendar advice for time management",
            "Help me organize my calendar better",
            
            # Time blocking specific queries
            "Time blocking optimization",
            "How to schedule productive time blocks?",
            "Calendar scheduling advice",
            "Optimize my time management",
            "Better calendar organization tips",
            
            # Productivity focused requests
            "How to make my schedule more productive?",
            "Calendar optimization for efficiency",
            "Smart scheduling recommendations",
            "Productive calendar setup",
            "Schedule better for deep work"
        ]
        
        for message in calendar_messages:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
            assert best_workflow[0] == WorkflowType.CALENDAR_OPTIMIZATION, f"Failed for message: {message}"
            assert best_workflow[1] >= 0.7, f"Low confidence ({best_workflow[1]}) for message: {message}"
    
    def test_intelligence_vs_existing_patterns(self, router):
        """Test that intelligence patterns take priority over existing patterns when appropriate"""
        # Messages that could match multiple patterns but should prioritize intelligence
        intelligence_priority_cases = [
            ("How can I optimize my morning routine habits?", WorkflowType.ROUTINE_COACHING),
            ("Analyze the health of my development project", WorkflowType.PROJECT_INTELLIGENCE),
            ("Optimize my calendar for productivity", WorkflowType.CALENDAR_OPTIMIZATION),
            ("My routine needs coaching advice", WorkflowType.ROUTINE_COACHING),
            ("Project intelligence assessment", WorkflowType.PROJECT_INTELLIGENCE),
            ("Schedule optimization with time blocking", WorkflowType.CALENDAR_OPTIMIZATION)
        ]
        
        for message, expected_workflow in intelligence_priority_cases:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
            assert best_workflow[0] == expected_workflow, f"Expected {expected_workflow} for: {message}, got {best_workflow[0]}"
    
    def test_pattern_confidence_scoring(self, router):
        """Test confidence scoring for intelligence patterns"""
        confidence_test_cases = [
            # High confidence cases
            ("How can I improve my morning routine consistency?", WorkflowType.ROUTINE_COACHING, 0.8),
            ("Analyze my project health scores", WorkflowType.PROJECT_INTELLIGENCE, 0.8),
            ("Optimize my calendar schedule", WorkflowType.CALENDAR_OPTIMIZATION, 0.8),
            
            # Medium confidence cases
            ("routine help needed", WorkflowType.ROUTINE_COACHING, 0.6),
            ("project analysis", WorkflowType.PROJECT_INTELLIGENCE, 0.6),
            ("schedule better", WorkflowType.CALENDAR_OPTIMIZATION, 0.6),
            
            # Lower confidence cases that should still match
            ("habit advice", WorkflowType.ROUTINE_COACHING, 0.4),
            ("project status", WorkflowType.PROJECT_INTELLIGENCE, 0.4),
            ("time management", WorkflowType.CALENDAR_OPTIMIZATION, 0.4)
        ]
        
        for message, expected_workflow, min_confidence in confidence_test_cases:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
            assert best_workflow[0] == expected_workflow, f"Wrong workflow for: {message}"
            assert best_workflow[1] >= min_confidence, f"Low confidence ({best_workflow[1]}) for: {message}"


class TestIntelligenceRouting(TestMessageRouter):
    """Test intelligent message routing for Phase 5 features"""
    
    @pytest.mark.asyncio
    async def test_route_routine_coaching_message(self, router):
        """Test routing of routine coaching messages"""
        message = "How can I improve my morning routine consistency?"
        user_id = "test-user-123"
        
        with patch.object(router, '_execute_workflow') as mock_execute:
            mock_execute.return_value = ContentAnalysisResult(
                workflow_type=WorkflowType.ROUTINE_COACHING,
                confidence=0.85,
                response="Routine coaching insights here",
                processing_time=2.3,
                metadata={"feature": "routine_coaching"}
            )
            
            result = await router.route_message(message, user_id)
            
            assert result.workflow_type == WorkflowType.ROUTINE_COACHING
            assert result.confidence >= 0.8
            assert "routine coaching" in result.response.lower()
            mock_execute.assert_called_once_with(
                WorkflowType.ROUTINE_COACHING, message, user_id
            )
    
    @pytest.mark.asyncio
    async def test_route_project_intelligence_message(self, router):
        """Test routing of project intelligence messages"""
        message = "Analyze the health scores of my development projects"
        user_id = "test-user-123"
        
        with patch.object(router, '_execute_workflow') as mock_execute:
            mock_execute.return_value = ContentAnalysisResult(
                workflow_type=WorkflowType.PROJECT_INTELLIGENCE,
                confidence=0.92,
                response="Project intelligence analysis complete",
                processing_time=1.8,
                metadata={"feature": "project_intelligence"}
            )
            
            result = await router.route_message(message, user_id)
            
            assert result.workflow_type == WorkflowType.PROJECT_INTELLIGENCE
            assert result.confidence >= 0.8
            assert "project" in result.response.lower()
            mock_execute.assert_called_once_with(
                WorkflowType.PROJECT_INTELLIGENCE, message, user_id
            )
    
    @pytest.mark.asyncio
    async def test_route_calendar_optimization_message(self, router):
        """Test routing of calendar optimization messages"""
        message = "How can I optimize my schedule for better productivity?"
        user_id = "test-user-123"
        
        with patch.object(router, '_execute_workflow') as mock_execute:
            mock_execute.return_value = ContentAnalysisResult(
                workflow_type=WorkflowType.CALENDAR_OPTIMIZATION,
                confidence=0.88,
                response="Calendar optimization suggestions provided",
                processing_time=2.1,
                metadata={"feature": "calendar_optimization"}
            )
            
            result = await router.route_message(message, user_id)
            
            assert result.workflow_type == WorkflowType.CALENDAR_OPTIMIZATION
            assert result.confidence >= 0.8
            assert "calendar" in result.response.lower() or "schedule" in result.response.lower()
            mock_execute.assert_called_once_with(
                WorkflowType.CALENDAR_OPTIMIZATION, message, user_id
            )
    
    @pytest.mark.asyncio
    async def test_fallback_to_general_conversation(self, router):
        """Test fallback to general conversation for unclear intelligence requests"""
        ambiguous_messages = [
            "What's the best way to be productive?",  # Could be routine or calendar
            "I need help with my daily activities",   # Could be routine or task management
            "How to improve my work performance?"     # Could be project or routine
        ]
        
        for message in ambiguous_messages:
            with patch.object(router, '_execute_workflow') as mock_execute:
                mock_execute.return_value = ContentAnalysisResult(
                    workflow_type=WorkflowType.GENERAL_CONVERSATION,
                    confidence=0.6,
                    response="General conversation response",
                    processing_time=1.0,
                    metadata={"fallback": True}
                )
                
                result = await router.route_message(message, "test-user")
                
                # Should either route to specific intelligence feature or general conversation
                assert result.workflow_type in [
                    WorkflowType.ROUTINE_COACHING,
                    WorkflowType.PROJECT_INTELLIGENCE,
                    WorkflowType.CALENDAR_OPTIMIZATION,
                    WorkflowType.GENERAL_CONVERSATION
                ]


class TestPatternPrecedence(TestMessageRouter):
    """Test pattern precedence and conflict resolution"""
    
    def test_intelligence_pattern_priorities(self, router):
        """Test that intelligence patterns have appropriate priorities"""
        # Verify priorities are set correctly
        patterns = router.workflow_patterns
        
        assert patterns[WorkflowType.ROUTINE_COACHING]["priority"] == 0.85
        assert patterns[WorkflowType.PROJECT_INTELLIGENCE]["priority"] == 0.82
        assert patterns[WorkflowType.CALENDAR_OPTIMIZATION]["priority"] == 0.83
        
        # Intelligence features should have higher priority than some existing features
        assert patterns[WorkflowType.ROUTINE_COACHING]["priority"] > patterns[WorkflowType.TASK_MANAGEMENT]["priority"]
        assert patterns[WorkflowType.PROJECT_INTELLIGENCE]["priority"] > patterns[WorkflowType.PROJECT_CHATBOT]["priority"]
    
    def test_overlapping_pattern_resolution(self, router):
        """Test resolution of overlapping patterns"""
        # Messages that could match multiple patterns
        overlap_test_cases = [
            ("Create a task for my morning routine", [WorkflowType.TASK_MANAGEMENT, WorkflowType.ROUTINE_COACHING]),
            ("Calendar meeting scheduling", [WorkflowType.CALENDAR_INTELLIGENCE, WorkflowType.CALENDAR_OPTIMIZATION]),
            ("Project development task", [WorkflowType.PROJECT_CHATBOT, WorkflowType.PROJECT_INTELLIGENCE, WorkflowType.TASK_MANAGEMENT])
        ]
        
        for message, possible_workflows in overlap_test_cases:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                if workflow_type in possible_workflows:
                    score = router._calculate_pattern_score(message, config)
                    workflow_scores[workflow_type] = score
            
            if workflow_scores:
                best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
                assert best_workflow[0] in possible_workflows, f"Unexpected workflow for: {message}"
    
    def test_keyword_vs_pattern_matching(self, router):
        """Test that pattern matching works alongside keyword matching"""
        # Test cases where patterns should override simple keyword matches
        pattern_priority_cases = [
            ("I want to optimize my morning routine habits", WorkflowType.ROUTINE_COACHING),
            ("Project health score analysis needed", WorkflowType.PROJECT_INTELLIGENCE),
            ("Schedule optimization for productive time blocks", WorkflowType.CALENDAR_OPTIMIZATION)
        ]
        
        for message, expected_workflow in pattern_priority_cases:
            # Test keyword matching
            config = router.workflow_patterns[expected_workflow]
            keyword_score = router._calculate_keyword_score(message, config["keywords"])
            pattern_score = router._calculate_pattern_score(message, config)
            
            # Pattern score should contribute significantly
            assert pattern_score > 0, f"No pattern match for: {message}"
            
            # Combined score should be high
            total_score = keyword_score + pattern_score
            assert total_score >= 0.7, f"Low total score ({total_score}) for: {message}"


class TestEdgeCasesAndErrorHandling(TestMessageRouter):
    """Test edge cases and error handling for intelligence routing"""
    
    def test_empty_and_invalid_messages(self, router):
        """Test handling of empty and invalid messages"""
        invalid_messages = [
            "",
            "   ",
            "\n\t",
            "!@#$%^&*()",
            "123456789",
            "a"
        ]
        
        for message in invalid_messages:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            # Should have low scores for invalid messages
            max_score = max(workflow_scores.values()) if workflow_scores else 0
            assert max_score <= 0.3, f"High score ({max_score}) for invalid message: '{message}'"
    
    def test_very_long_messages(self, router):
        """Test handling of very long messages"""
        # Create a very long message with intelligence keywords
        long_message = "routine optimization " * 100 + "How can I improve my morning routine consistency?"
        
        workflow_scores = {}
        for workflow_type, config in router.workflow_patterns.items():
            score = router._calculate_pattern_score(long_message, config)
            workflow_scores[workflow_type] = score
        
        best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
        assert best_workflow[0] == WorkflowType.ROUTINE_COACHING
        assert best_workflow[1] > 0, "Should still match despite length"
    
    def test_multilingual_keywords(self, router):
        """Test handling of messages with mixed languages or special characters"""
        multilingual_messages = [
            "How can I optimize my Morgen-Routine?",  # German mixed with English
            "Project健康score analysis",  # Chinese mixed with English
            "Календарь optimization needed",  # Cyrillic mixed with English
            "How to améliorer my routine?",  # French mixed with English
        ]
        
        for message in multilingual_messages:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            # Should still be able to match English keywords and patterns
            max_score = max(workflow_scores.values()) if workflow_scores else 0
            assert max_score > 0, f"No match for multilingual message: {message}"
    
    @pytest.mark.asyncio
    async def test_concurrent_routing_requests(self, router):
        """Test handling of concurrent routing requests"""
        messages = [
            "How can I improve my morning routine?",
            "Analyze my project health scores",
            "Optimize my calendar schedule",
            "What's my routine completion rate?",
            "Project intelligence needed"
        ]
        
        with patch.object(router, '_execute_workflow') as mock_execute:
            mock_execute.return_value = ContentAnalysisResult(
                workflow_type=WorkflowType.ROUTINE_COACHING,
                confidence=0.8,
                response="Mock response",
                processing_time=1.0
            )
            
            # Execute multiple routing requests concurrently
            tasks = [router.route_message(msg, f"user-{i}") for i, msg in enumerate(messages)]
            results = await asyncio.gather(*tasks)
            
            # All should complete successfully
            assert len(results) == len(messages)
            for result in results:
                assert isinstance(result, ContentAnalysisResult)
                assert result.confidence > 0
    
    def test_case_insensitive_matching(self, router):
        """Test that pattern matching is case insensitive"""
        case_variations = [
            ("HOW CAN I IMPROVE MY MORNING ROUTINE?", WorkflowType.ROUTINE_COACHING),
            ("analyze my PROJECT HEALTH scores", WorkflowType.PROJECT_INTELLIGENCE),
            ("Optimize My Calendar Schedule", WorkflowType.CALENDAR_OPTIMIZATION),
            ("how can i improve my morning routine?", WorkflowType.ROUTINE_COACHING),
            ("ANALYZE MY PROJECT HEALTH SCORES", WorkflowType.PROJECT_INTELLIGENCE)
        ]
        
        for message, expected_workflow in case_variations:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            
            best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
            assert best_workflow[0] == expected_workflow, f"Case sensitivity issue for: {message}"


class TestRouterPerformance(TestMessageRouter):
    """Test router performance and optimization"""
    
    def test_pattern_matching_performance(self, router):
        """Test that pattern matching completes in reasonable time"""
        import time
        
        test_messages = [
            "How can I improve my morning routine consistency and build better habits?",
            "Analyze the health scores of all my development projects and provide insights",
            "Optimize my calendar schedule for maximum productivity and time blocking efficiency"
        ] * 10  # Test with multiple messages
        
        start_time = time.time()
        
        for message in test_messages:
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
            best_workflow = max(workflow_scores.items(), key=lambda x: x[1])
        
        end_time = time.time()
        elapsed = end_time - start_time
        
        # Should complete pattern matching quickly (< 1 second for 30 messages)
        assert elapsed < 1.0, f"Pattern matching too slow: {elapsed} seconds"
    
    def test_memory_efficiency(self, router):
        """Test that router doesn't consume excessive memory"""
        import sys
        
        # Get initial memory usage
        initial_size = sys.getsizeof(router)
        
        # Process many messages
        for i in range(1000):
            message = f"Test message {i} for routine optimization and project analysis"
            workflow_scores = {}
            for workflow_type, config in router.workflow_patterns.items():
                score = router._calculate_pattern_score(message, config)
                workflow_scores[workflow_type] = score
        
        # Check final memory usage
        final_size = sys.getsizeof(router)
        
        # Memory usage shouldn't increase significantly
        assert final_size <= initial_size * 1.1, f"Memory usage increased too much: {initial_size} -> {final_size}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])