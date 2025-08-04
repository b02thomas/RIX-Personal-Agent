# /Users/benediktthomas/RIX Personal Agent/backend-enhancements/voice-intelligence/intent_testing.py
# Comprehensive test suite for German Intent Classification Phase 1.2
# Tests pattern matching, entity extraction, and 90% accuracy target validation
# RELEVANT FILES: german_intent_classifier.py, german_language_utils.py, enhanced_voice_processor.py

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Tuple

from german_intent_classifier import GermanIntentClassifier, IntentCategory, IntentResult
from german_language_utils import GermanLanguageUtils


@dataclass
class TestCase:
    """Test case for intent classification"""

    text: str
    expected_intent: IntentCategory
    expected_confidence_min: float
    expected_entities: List[str]  # Expected entity keys
    description: str
    context: Dict[str, Any] = None


@dataclass
class TestResult:
    """Result of intent classification test"""

    test_case: TestCase
    actual_result: IntentResult
    passed: bool
    confidence_match: bool
    entity_match: bool
    error_message: str = ""


class IntentTestingSuite:
    """
    Comprehensive Testing Suite for German Intent Classification

    Features:
    - Test all 7 Intelligence Hubs with German voice patterns
    - Validate 90% classification accuracy target
    - Test cultural context awareness (Sie/Du forms)
    - Validate entity extraction quality
    - Performance benchmarking and regression testing
    - Comprehensive German language pattern coverage
    """

    def __init__(self):
        """Initialize Intent Testing Suite"""
        self.logger = logging.getLogger(__name__)

        # Initialize components
        self.language_utils = GermanLanguageUtils()
        self.intent_classifier = GermanIntentClassifier(self.language_utils)

        # Test cases for all Intelligence Hubs
        self.test_cases = self._initialize_test_cases()

        # Performance targets
        self.performance_targets = {
            "accuracy_threshold": 0.90,  # 90% accuracy target
            "confidence_threshold": 0.8,  # High confidence threshold
            "processing_time_max": 0.5,  # Max processing time per classification
            "entity_extraction_rate": 0.7,  # 70% of cases should extract entities
        }

        # Test results tracking
        self.test_results = []
        self.performance_metrics = {}

        self.logger.info("Intent Testing Suite initialized with {} test cases".format(len(self.test_cases)))

    def _initialize_test_cases(self) -> List[TestCase]:
        """
        Initialize comprehensive test cases for German intent classification

        Returns:
            List of test cases covering all scenarios
        """
        test_cases = []

        # Calendar Intelligence Hub Tests
        calendar_tests = [
            TestCase(
                text="Erstelle einen Termin für morgen um 14 Uhr",
                expected_intent=IntentCategory.CALENDAR_CREATE,
                expected_confidence_min=0.85,
                expected_entities=["action", "event_type", "date", "time"],
                description="Basic calendar creation with date and time",
            ),
            TestCase(
                text="Meeting morgen anlegen",
                expected_intent=IntentCategory.CALENDAR_CREATE,
                expected_confidence_min=0.8,
                expected_entities=["event_type", "date"],
                description="Informal meeting creation",
            ),
            TestCase(
                text="Plane eine Besprechung für nächste Woche",
                expected_intent=IntentCategory.CALENDAR_CREATE,
                expected_confidence_min=0.8,
                expected_entities=["action", "event_type", "date"],
                description="Meeting planning with relative date",
            ),
            TestCase(
                text="Was sind meine Termine heute",
                expected_intent=IntentCategory.CALENDAR_QUERY,
                expected_confidence_min=0.85,
                expected_entities=["query_type", "date"],
                description="Calendar query for today",
            ),
            TestCase(
                text="Zeig mir den Kalender für diese Woche",
                expected_intent=IntentCategory.CALENDAR_QUERY,
                expected_confidence_min=0.8,
                expected_entities=["action", "target", "date_range"],
                description="Calendar overview request",
            ),
            TestCase(
                text="Wann ist das Meeting mit Herrn Schmidt",
                expected_intent=IntentCategory.CALENDAR_QUERY,
                expected_confidence_min=0.8,
                expected_entities=["query_type", "event_type"],
                description="Specific meeting time query with formal address",
            ),
        ]

        # Task Management Hub Tests
        task_tests = [
            TestCase(
                text="Erstelle eine neue Aufgabe",
                expected_intent=IntentCategory.TASK_CREATE,
                expected_confidence_min=0.9,
                expected_entities=["action", "task_type"],
                description="Basic task creation",
            ),
            TestCase(
                text="Todo hinzufügen: Einkaufen gehen",
                expected_intent=IntentCategory.TASK_CREATE,
                expected_confidence_min=0.85,
                expected_entities=["task_type", "description"],
                description="Todo with specific description",
            ),
            TestCase(
                text="Erinnere mich daran die Rechnung zu bezahlen",
                expected_intent=IntentCategory.TASK_CREATE,
                expected_confidence_min=0.8,
                expected_entities=["action", "reminder"],
                description="Reminder task creation",
            ),
            TestCase(
                text="Ich muss noch das Projekt abschließen",
                expected_intent=IntentCategory.TASK_CREATE,
                expected_confidence_min=0.75,
                expected_entities=["obligation"],
                description="Informal task expression",
            ),
            TestCase(
                text="Was sind meine Aufgaben für heute",
                expected_intent=IntentCategory.TASK_QUERY,
                expected_confidence_min=0.9,
                expected_entities=["query_type", "target", "date"],
                description="Daily task query",
            ),
            TestCase(
                text="Zeig mir alle offenen Todos",
                expected_intent=IntentCategory.TASK_QUERY,
                expected_confidence_min=0.85,
                expected_entities=["action", "target", "status"],
                description="Open tasks query",
            ),
            TestCase(
                text="Aufgabe erledigt",
                expected_intent=IntentCategory.TASK_UPDATE,
                expected_confidence_min=0.9,
                expected_entities=["status"],
                description="Task completion",
            ),
            TestCase(
                text="Das Todo ist fertig",
                expected_intent=IntentCategory.TASK_UPDATE,
                expected_confidence_min=0.85,
                expected_entities=["status"],
                description="Todo completion confirmation",
            ),
        ]

        # Routine Management Hub Tests
        routine_tests = [
            TestCase(
                text="Morgenroutine erledigt",
                expected_intent=IntentCategory.ROUTINE_UPDATE,
                expected_confidence_min=0.9,
                expected_entities=["routine_type", "status"],
                description="Morning routine completion",
            ),
            TestCase(
                text="Gewohnheit gemacht",
                expected_intent=IntentCategory.ROUTINE_UPDATE,
                expected_confidence_min=0.8,
                expected_entities=["status"],
                description="General habit completion",
            ),
            TestCase(
                text="Bin joggen gewesen",
                expected_intent=IntentCategory.ROUTINE_UPDATE,
                expected_confidence_min=0.8,
                expected_entities=["activity", "completion"],
                description="Exercise routine update",
            ),
            TestCase(
                text="Habe Sport gemacht",
                expected_intent=IntentCategory.ROUTINE_UPDATE,
                expected_confidence_min=0.85,
                expected_entities=["activity", "completion"],
                description="Sports activity completion",
            ),
            TestCase(
                text="Wie ist meine Routine heute",
                expected_intent=IntentCategory.ROUTINE_QUERY,
                expected_confidence_min=0.85,
                expected_entities=["query_type", "routine_reference", "date"],
                description="Daily routine status query",
            ),
            TestCase(
                text="Fortschritt meiner Gewohnheiten",
                expected_intent=IntentCategory.ROUTINE_QUERY,
                expected_confidence_min=0.8,
                expected_entities=["metric", "target"],
                description="Habit progress inquiry",
            ),
        ]

        # Goal Management Hub Tests
        goal_tests = [
            TestCase(
                text="Wie läuft mein Ziel",
                expected_intent=IntentCategory.GOAL_STATUS,
                expected_confidence_min=0.9,
                expected_entities=["query_type", "goal_reference"],
                description="Goal progress inquiry",
            ),
            TestCase(
                text="Fortschritt beim Abnehmen",
                expected_intent=IntentCategory.GOAL_STATUS,
                expected_confidence_min=0.85,
                expected_entities=["metric", "goal_reference"],
                description="Specific goal progress query",
            ),
            TestCase(
                text="Bin ich auf Kurs mit meinem Fitness-Ziel",
                expected_intent=IntentCategory.GOAL_STATUS,
                expected_confidence_min=0.8,
                expected_entities=["progress_query", "goal_reference"],
                description="Goal tracking question",
            ),
            TestCase(
                text="Update mein Sparziel",
                expected_intent=IntentCategory.GOAL_UPDATE,
                expected_confidence_min=0.85,
                expected_entities=["action", "goal_reference"],
                description="Goal update request",
            ),
            TestCase(
                text="Meilenstein erreicht",
                expected_intent=IntentCategory.GOAL_UPDATE,
                expected_confidence_min=0.8,
                expected_entities=["progress_type", "achievement"],
                description="Milestone achievement",
            ),
        ]

        # Knowledge Management Hub Tests
        knowledge_tests = [
            TestCase(
                text="Speichere dieses Wissen",
                expected_intent=IntentCategory.KNOWLEDGE_STORE,
                expected_confidence_min=0.9,
                expected_entities=["action", "content_type"],
                description="Knowledge storage request",
            ),
            TestCase(
                text="Merk dir die wichtige Information",
                expected_intent=IntentCategory.KNOWLEDGE_STORE,
                expected_confidence_min=0.85,
                expected_entities=["action", "content_type"],
                description="Important information storage",
            ),
            TestCase(
                text="Das ist zu merken",
                expected_intent=IntentCategory.KNOWLEDGE_STORE,
                expected_confidence_min=0.8,
                expected_entities=["importance_marker"],
                description="Information importance marker",
            ),
            TestCase(
                text="Was weißt du über Machine Learning",
                expected_intent=IntentCategory.KNOWLEDGE_QUERY,
                expected_confidence_min=0.9,
                expected_entities=["query_action", "topic"],
                description="Knowledge query about specific topic",
            ),
            TestCase(
                text="Zeig mir Informationen zu Python",
                expected_intent=IntentCategory.KNOWLEDGE_QUERY,
                expected_confidence_min=0.85,
                expected_entities=["need_expression", "topic"],
                description="Information request",
            ),
            TestCase(
                text="Ich brauche Wissen über Projektmanagement",
                expected_intent=IntentCategory.KNOWLEDGE_QUERY,
                expected_confidence_min=0.8,
                expected_entities=["need_expression", "content_type", "topic"],
                description="Knowledge need expression",
            ),
        ]

        # News Intelligence Hub Tests
        news_tests = [
            TestCase(
                text="Nachrichten heute",
                expected_intent=IntentCategory.NEWS_REQUEST,
                expected_confidence_min=0.95,
                expected_entities=["news_type", "date"],
                description="Daily news request",
            ),
            TestCase(
                text="Aktuelle News zeigen",
                expected_intent=IntentCategory.NEWS_REQUEST,
                expected_confidence_min=0.9,
                expected_entities=["news_type"],
                description="Current news request",
            ),
            TestCase(
                text="Was passiert in der Welt",
                expected_intent=IntentCategory.NEWS_REQUEST,
                expected_confidence_min=0.9,
                expected_entities=["general_inquiry", "scope"],
                description="World news inquiry",
            ),
            TestCase(
                text="Was gibt es Neues in der Politik",
                expected_intent=IntentCategory.NEWS_REQUEST,
                expected_confidence_min=0.85,
                expected_entities=["general_inquiry", "category"],
                description="Political news request",
            ),
            TestCase(
                text="Tagesbriefing",
                expected_intent=IntentCategory.NEWS_REQUEST,
                expected_confidence_min=0.85,
                expected_entities=["update_type"],
                description="Daily briefing request",
            ),
        ]

        # General Conversation Tests
        general_tests = [
            TestCase(
                text="Hallo, wie geht es dir",
                expected_intent=IntentCategory.GENERAL_CONVERSATION,
                expected_confidence_min=0.9,
                expected_entities=["greeting", "casual_inquiry"],
                description="Greeting with inquiry",
            ),
            TestCase(
                text="Guten Tag",
                expected_intent=IntentCategory.GENERAL_CONVERSATION,
                expected_confidence_min=0.9,
                expected_entities=["greeting"],
                description="Formal greeting",
            ),
            TestCase(
                text="Hi, alles klar",
                expected_intent=IntentCategory.GENERAL_CONVERSATION,
                expected_confidence_min=0.85,
                expected_entities=["greeting", "casual_inquiry"],
                description="Informal greeting",
            ),
            TestCase(
                text="Kannst du mir helfen",
                expected_intent=IntentCategory.GENERAL_CONVERSATION,
                expected_confidence_min=0.9,
                expected_entities=["help_request"],
                description="Help request",
            ),
            TestCase(
                text="Was kannst du alles",
                expected_intent=IntentCategory.GENERAL_CONVERSATION,
                expected_confidence_min=0.85,
                expected_entities=["help_request"],
                description="Capability inquiry",
            ),
        ]

        # Cultural Context Tests (Sie/Du forms)
        cultural_tests = [
            TestCase(
                text="Könnten Sie mir einen Termin erstellen",
                expected_intent=IntentCategory.CALENDAR_CREATE,
                expected_confidence_min=0.8,
                expected_entities=["action", "event_type", "formality"],
                description="Formal calendar creation request",
                context={"formality": "high"},
            ),
            TestCase(
                text="Kannst du mir eine Aufgabe hinzufügen",
                expected_intent=IntentCategory.TASK_CREATE,
                expected_confidence_min=0.8,
                expected_entities=["action", "task_type", "formality"],
                description="Informal task creation request",
                context={"formality": "low"},
            ),
            TestCase(
                text="Bitte zeigen Sie mir die Nachrichten",
                expected_intent=IntentCategory.NEWS_REQUEST,
                expected_confidence_min=0.8,
                expected_entities=["news_type", "politeness_markers"],
                description="Polite formal news request",
                context={"politeness": "high"},
            ),
        ]

        # Edge Cases and Ambiguous Tests
        edge_cases = [
            TestCase(
                text="morgen",
                expected_intent=IntentCategory.GENERAL_CONVERSATION,
                expected_confidence_min=0.3,
                expected_entities=["date"],
                description="Single word ambiguous input",
            ),
            TestCase(
                text="Das ist nicht klar was ich will",
                expected_intent=IntentCategory.GENERAL_CONVERSATION,
                expected_confidence_min=0.4,
                expected_entities=["uncertainty_markers"],
                description="Unclear intent expression",
            ),
            TestCase(
                text="Vielleicht könnte ich ein Meeting machen oder auch nicht",
                expected_intent=IntentCategory.CALENDAR_CREATE,
                expected_confidence_min=0.6,
                expected_entities=["event_type", "uncertainty_markers"],
                description="Uncertain meeting creation",
            ),
        ]

        # Combine all test cases
        test_cases.extend(calendar_tests)
        test_cases.extend(task_tests)
        test_cases.extend(routine_tests)
        test_cases.extend(goal_tests)
        test_cases.extend(knowledge_tests)
        test_cases.extend(news_tests)
        test_cases.extend(general_tests)
        test_cases.extend(cultural_tests)
        test_cases.extend(edge_cases)

        return test_cases

    async def run_all_tests(self) -> Dict[str, Any]:
        """
        Run all intent classification tests

        Returns:
            Comprehensive test results and performance metrics
        """
        self.logger.info(f"Starting comprehensive intent classification testing with {len(self.test_cases)} test cases")

        start_time = datetime.utcnow()
        self.test_results = []

        # Track performance metrics
        processing_times = []
        accuracy_results = []
        confidence_results = []
        entity_extraction_results = []

        for i, test_case in enumerate(self.test_cases):
            try:
                # Run individual test
                test_start = datetime.utcnow()
                result = await self._run_single_test(test_case)
                test_duration = (datetime.utcnow() - test_start).total_seconds()

                self.test_results.append(result)

                # Track metrics
                processing_times.append(test_duration)
                accuracy_results.append(1.0 if result.passed else 0.0)
                confidence_results.append(result.actual_result.confidence)
                entity_extraction_results.append(1.0 if len(result.actual_result.entities) > 0 else 0.0)

                if (i + 1) % 10 == 0:
                    self.logger.info(f"Completed {i + 1}/{len(self.test_cases)} tests")

            except Exception as e:
                self.logger.error(f"Test failed for case '{test_case.description}': {e}")
                # Create error result
                error_result = TestResult(
                    test_case=test_case,
                    actual_result=None,
                    passed=False,
                    confidence_match=False,
                    entity_match=False,
                    error_message=str(e),
                )
                self.test_results.append(error_result)
                accuracy_results.append(0.0)

        total_duration = (datetime.utcnow() - start_time).total_seconds()

        # Calculate performance metrics
        self.performance_metrics = await self._calculate_performance_metrics(
            processing_times, accuracy_results, confidence_results, entity_extraction_results, total_duration
        )

        self.logger.info(f"Testing completed in {total_duration:.2f} seconds")

        return await self._generate_test_report()

    async def _run_single_test(self, test_case: TestCase) -> TestResult:
        """
        Run a single intent classification test

        Args:
            test_case: Test case to execute

        Returns:
            Test result with validation details
        """
        try:
            # Classify intent
            actual_result = await self.intent_classifier.classify_intent(test_case.text, test_case.context)

            if not actual_result:
                return TestResult(
                    test_case=test_case,
                    actual_result=None,
                    passed=False,
                    confidence_match=False,
                    entity_match=False,
                    error_message="Classification returned None",
                )

            # Validate intent match
            intent_match = actual_result.intent == test_case.expected_intent

            # Validate confidence
            confidence_match = actual_result.confidence >= test_case.expected_confidence_min

            # Validate entity extraction
            entity_match = await self._validate_entities(actual_result.entities, test_case.expected_entities)

            # Overall test pass/fail
            passed = intent_match and confidence_match

            return TestResult(
                test_case=test_case,
                actual_result=actual_result,
                passed=passed,
                confidence_match=confidence_match,
                entity_match=entity_match,
                error_message=""
                if passed
                else f"Expected: {test_case.expected_intent.value}, Got: {actual_result.intent.value}",
            )

        except Exception as e:
            return TestResult(
                test_case=test_case,
                actual_result=None,
                passed=False,
                confidence_match=False,
                entity_match=False,
                error_message=str(e),
            )

    async def _validate_entities(self, actual_entities: Dict[str, Any], expected_entity_keys: List[str]) -> bool:
        """
        Validate entity extraction results

        Args:
            actual_entities: Entities extracted by classifier
            expected_entity_keys: Expected entity keys

        Returns:
            True if entity extraction is satisfactory
        """
        if not expected_entity_keys:
            return True  # No entities expected

        # Check if at least 50% of expected entities are present
        matched_entities = 0
        for expected_key in expected_entity_keys:
            if expected_key in actual_entities:
                matched_entities += 1

        match_rate = matched_entities / len(expected_entity_keys)
        return match_rate >= 0.5  # At least 50% match required

    async def _calculate_performance_metrics(
        self,
        processing_times: List[float],
        accuracy_results: List[float],
        confidence_results: List[float],
        entity_extraction_results: List[float],
        total_duration: float,
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive performance metrics

        Args:
            processing_times: Individual processing times
            accuracy_results: Accuracy results (1.0 or 0.0)
            confidence_results: Confidence scores
            entity_extraction_results: Entity extraction success rates
            total_duration: Total test duration

        Returns:
            Performance metrics dictionary
        """
        total_tests = len(self.test_results)

        if not processing_times:
            return {"error": "No valid test results"}

        # Basic metrics
        accuracy = sum(accuracy_results) / len(accuracy_results)
        avg_confidence = sum(confidence_results) / len(confidence_results)
        entity_extraction_rate = sum(entity_extraction_results) / len(entity_extraction_results)
        avg_processing_time = sum(processing_times) / len(processing_times)

        # High confidence tests
        high_confidence_tests = [r for r in confidence_results if r >= self.performance_targets["confidence_threshold"]]
        high_confidence_rate = len(high_confidence_tests) / len(confidence_results)

        # Intent distribution
        intent_distribution = {}
        for result in self.test_results:
            if result.actual_result:
                intent = result.actual_result.intent.value
                intent_distribution[intent] = intent_distribution.get(intent, 0) + 1

        # Performance targets assessment
        targets_met = {
            "accuracy_target_met": accuracy >= self.performance_targets["accuracy_threshold"],
            "confidence_target_met": high_confidence_rate >= 0.7,  # 70% should be high confidence
            "processing_time_target_met": avg_processing_time <= self.performance_targets["processing_time_max"],
            "entity_extraction_target_met": entity_extraction_rate >= self.performance_targets["entity_extraction_rate"],
        }

        return {
            "total_tests": total_tests,
            "accuracy": accuracy,
            "accuracy_percentage": accuracy * 100,
            "average_confidence": avg_confidence,
            "high_confidence_rate": high_confidence_rate,
            "entity_extraction_rate": entity_extraction_rate,
            "average_processing_time": avg_processing_time,
            "total_duration": total_duration,
            "intent_distribution": intent_distribution,
            "performance_targets": self.performance_targets,
            "targets_met": targets_met,
            "overall_performance": "EXCELLENT"
            if all(targets_met.values())
            else "GOOD"
            if accuracy >= 0.8
            else "NEEDS_IMPROVEMENT",
        }

    async def _generate_test_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive test report

        Returns:
            Detailed test report
        """
        # Categorize results by intent
        results_by_intent = {}
        failed_tests = []

        for result in self.test_results:
            if result.actual_result:
                intent = result.test_case.expected_intent.value
                if intent not in results_by_intent:
                    results_by_intent[intent] = {"total": 0, "passed": 0, "failed": 0}

                results_by_intent[intent]["total"] += 1
                if result.passed:
                    results_by_intent[intent]["passed"] += 1
                else:
                    results_by_intent[intent]["failed"] += 1
                    failed_tests.append(
                        {
                            "description": result.test_case.description,
                            "text": result.test_case.text,
                            "expected": result.test_case.expected_intent.value,
                            "actual": result.actual_result.intent.value,
                            "confidence": result.actual_result.confidence,
                            "error": result.error_message,
                        }
                    )

        # Calculate accuracy by intent
        intent_accuracies = {}
        for intent, stats in results_by_intent.items():
            if stats["total"] > 0:
                intent_accuracies[intent] = stats["passed"] / stats["total"]

        return {
            "test_summary": {
                "total_tests": len(self.test_results),
                "passed_tests": len([r for r in self.test_results if r.passed]),
                "failed_tests": len([r for r in self.test_results if not r.passed]),
                "test_completion_rate": len([r for r in self.test_results if r.actual_result is not None])
                / len(self.test_results),
            },
            "performance_metrics": self.performance_metrics,
            "intent_breakdown": results_by_intent,
            "intent_accuracies": intent_accuracies,
            "failed_tests": failed_tests[:10],  # Show first 10 failures
            "recommendations": await self._generate_recommendations(),
            "timestamp": datetime.utcnow().isoformat(),
            "phase": "1.2 - German Intent Classification",
        }

    async def _generate_recommendations(self) -> List[str]:
        """
        Generate recommendations based on test results

        Returns:
            List of improvement recommendations
        """
        recommendations = []

        if not self.performance_metrics:
            return ["Run tests first to generate recommendations"]

        accuracy = self.performance_metrics.get("accuracy", 0)
        avg_confidence = self.performance_metrics.get("average_confidence", 0)
        entity_rate = self.performance_metrics.get("entity_extraction_rate", 0)
        processing_time = self.performance_metrics.get("average_processing_time", 0)

        # Accuracy recommendations
        if accuracy < 0.9:
            recommendations.append(f"Accuracy is {accuracy:.1%}, below 90% target. Consider refining pattern matching rules.")

        if accuracy < 0.8:
            recommendations.append(
                "Critical: Accuracy is below 80%. Review intent patterns and add more specific German language patterns."
            )

        # Confidence recommendations
        if avg_confidence < 0.7:
            recommendations.append(
                f"Average confidence is {avg_confidence:.1%}. Improve pattern specificity and confidence scoring."
            )

        # Entity extraction recommendations
        if entity_rate < 0.7:
            recommendations.append(
                f"Entity extraction rate is {entity_rate:.1%}. Enhance German language entity extraction patterns."
            )

        # Performance recommendations
        if processing_time > 0.5:
            recommendations.append(
                f"Processing time is {processing_time:.3f}s. Optimize pattern matching for better performance."
            )

        # Intent-specific recommendations
        failed_intents = []
        for result in self.test_results:
            if not result.passed and result.actual_result:
                failed_intents.append(result.test_case.expected_intent.value)

        from collections import Counter

        intent_failures = Counter(failed_intents)

        for intent, count in intent_failures.most_common(3):
            recommendations.append(f"Intent '{intent}' has {count} failures. Review patterns for this intent category.")

        # German language specific recommendations
        if accuracy < 0.85:
            recommendations.append("Add more German compound word patterns and cultural context markers.")
            recommendations.append("Enhance temporal expression recognition for German time expressions.")
            recommendations.append("Improve handling of German grammar patterns (Sie/Du forms, modal verbs).")

        if not recommendations:
            recommendations.append("Excellent performance! All targets met. Consider adding more edge cases for robustness.")

        return recommendations

    async def run_performance_benchmark(self, iterations: int = 100) -> Dict[str, Any]:
        """
        Run performance benchmark test

        Args:
            iterations: Number of iterations for each test case

        Returns:
            Performance benchmark results
        """
        self.logger.info(f"Starting performance benchmark with {iterations} iterations")

        # Select representative test cases
        benchmark_cases = [test for test in self.test_cases if test.expected_intent != IntentCategory.GENERAL_CONVERSATION][
            :10
        ]  # Top 10 diverse cases

        processing_times = []
        start_time = datetime.utcnow()

        for iteration in range(iterations):
            for test_case in benchmark_cases:
                test_start = datetime.utcnow()
                await self.intent_classifier.classify_intent(test_case.text, test_case.context)
                duration = (datetime.utcnow() - test_start).total_seconds()
                processing_times.append(duration)

        total_duration = (datetime.utcnow() - start_time).total_seconds()

        # Calculate statistics
        avg_time = sum(processing_times) / len(processing_times)
        min_time = min(processing_times)
        max_time = max(processing_times)

        # Percentiles
        sorted_times = sorted(processing_times)
        p50 = sorted_times[len(sorted_times) // 2]
        p95 = sorted_times[int(len(sorted_times) * 0.95)]
        p99 = sorted_times[int(len(sorted_times) * 0.99)]

        return {
            "benchmark_summary": {
                "total_iterations": iterations * len(benchmark_cases),
                "total_duration": total_duration,
                "throughput": len(processing_times) / total_duration,  # classifications per second
            },
            "timing_stats": {
                "average_time": avg_time,
                "min_time": min_time,
                "max_time": max_time,
                "p50_time": p50,
                "p95_time": p95,
                "p99_time": p99,
            },
            "performance_assessment": {
                "meets_target": avg_time <= self.performance_targets["processing_time_max"],
                "target_time": self.performance_targets["processing_time_max"],
                "performance_ratio": avg_time / self.performance_targets["processing_time_max"],
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def test_cultural_context_awareness(self) -> Dict[str, Any]:
        """
        Test German cultural context awareness (Sie/Du forms, politeness)

        Returns:
            Cultural context test results
        """
        self.logger.info("Testing German cultural context awareness")

        cultural_test_cases = [
            {
                "formal": "Könnten Sie mir bitte einen Termin erstellen",
                "informal": "Kannst du mir einen Termin machen",
                "expected_intent": IntentCategory.CALENDAR_CREATE,
            },
            {
                "formal": "Würden Sie mir die Nachrichten zeigen",
                "informal": "Zeig mir die News",
                "expected_intent": IntentCategory.NEWS_REQUEST,
            },
            {
                "formal": "Haben Sie die Güte, mir bei den Aufgaben zu helfen",
                "informal": "Hilf mir mit den Todos",
                "expected_intent": IntentCategory.TASK_QUERY,
            },
        ]

        results = []

        for test_pair in cultural_test_cases:
            # Test formal version
            formal_result = await self.intent_classifier.classify_intent(test_pair["formal"])
            informal_result = await self.intent_classifier.classify_intent(test_pair["informal"])

            # Check if both classify to same intent
            intent_consistency = formal_result.intent == informal_result.intent == test_pair["expected_intent"]

            # Check cultural marker detection
            formal_cultural = formal_result.entities.get("formality", "unknown")
            informal_cultural = informal_result.entities.get("formality", "unknown")

            results.append(
                {
                    "formal_text": test_pair["formal"],
                    "informal_text": test_pair["informal"],
                    "intent_consistency": intent_consistency,
                    "formal_cultural_detected": formal_cultural == "high",
                    "informal_cultural_detected": informal_cultural == "low",
                    "formal_confidence": formal_result.confidence,
                    "informal_confidence": informal_result.confidence,
                }
            )

        # Calculate cultural awareness metrics
        intent_consistency_rate = sum(r["intent_consistency"] for r in results) / len(results)
        formal_detection_rate = sum(r["formal_cultural_detected"] for r in results) / len(results)
        informal_detection_rate = sum(r["informal_cultural_detected"] for r in results) / len(results)

        return {
            "cultural_test_results": results,
            "metrics": {
                "intent_consistency_rate": intent_consistency_rate,
                "formal_detection_rate": formal_detection_rate,
                "informal_detection_rate": informal_detection_rate,
                "overall_cultural_awareness": (intent_consistency_rate + formal_detection_rate + informal_detection_rate) / 3,
            },
            "assessment": {
                "excellent": intent_consistency_rate >= 0.9 and formal_detection_rate >= 0.8,
                "good": intent_consistency_rate >= 0.8 and formal_detection_rate >= 0.6,
                "needs_improvement": intent_consistency_rate < 0.8 or formal_detection_rate < 0.6,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def generate_test_summary(self) -> str:
        """
        Generate human-readable test summary

        Returns:
            Formatted test summary string
        """
        if not self.test_results:
            return "No tests have been run yet. Run tests first."

        report = await self._generate_test_report()
        metrics = self.performance_metrics

        summary = f"""
        🧪 RIX Voice Intelligence Phase 1.2 - German Intent Classification Test Results
        
        📊 Overall Performance: {metrics.get('overall_performance', 'UNKNOWN')}
        
        🎯 Accuracy: {metrics.get('accuracy_percentage', 0):.1f}% (Target: 90%)
        ✅ Passed Tests: {report['test_summary']['passed_tests']}/{report['test_summary']['total_tests']}
        ⏱️  Avg Processing Time: {metrics.get('average_processing_time', 0):.3f}s (Target: <0.5s)
        🔍 Entity Extraction Rate: {metrics.get('entity_extraction_rate', 0):.1%}
        💪 High Confidence Rate: {metrics.get('high_confidence_rate', 0):.1%}
        
        🎯 Performance Targets Met:
        • Accuracy ≥90%: {'✅' if metrics.get('targets_met', {}).get('accuracy_target_met', False) else '❌'}
        • Processing Time ≤0.5s: {'✅' if metrics.get('targets_met', {}).get('processing_time_target_met', False) else '❌'}
        • Entity Extraction ≥70%: {'✅' if metrics.get('targets_met', {}).get('entity_extraction_target_met', False) else '❌'}
        
        🧠 Intent Classification Distribution:
        """

        for intent, accuracy in report.get("intent_accuracies", {}).items():
            summary += f"• {intent}: {accuracy:.1%}\n        "

        if report.get("failed_tests"):
            summary += f"\n        ⚠️  Failed Tests: {len(report['failed_tests'])} (showing first few)\n        "
            for failure in report["failed_tests"][:3]:
                summary += f"• '{failure['text']}' -> Expected: {failure['expected']}, Got: {failure['actual']}\n        "

        recommendations = report.get("recommendations", [])
        if recommendations:
            summary += f"\n        💡 Recommendations:\n        "
            for rec in recommendations[:3]:
                summary += f"• {rec}\n        "

        summary += f"\n        📅 Test completed: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"

        return summary.strip()

    async def export_results(self, format: str = "json") -> Dict[str, Any]:
        """
        Export test results in specified format

        Args:
            format: Export format ("json", "summary", "detailed")

        Returns:
            Exported results
        """
        if format == "summary":
            return {"summary": await self.generate_test_summary(), "timestamp": datetime.utcnow().isoformat()}
        elif format == "detailed":
            return {
                "test_results": [
                    {
                        "description": r.test_case.description,
                        "text": r.test_case.text,
                        "expected_intent": r.test_case.expected_intent.value,
                        "actual_intent": r.actual_result.intent.value if r.actual_result else None,
                        "confidence": r.actual_result.confidence if r.actual_result else 0.0,
                        "passed": r.passed,
                        "entities": r.actual_result.entities if r.actual_result else {},
                        "error": r.error_message,
                    }
                    for r in self.test_results
                ],
                "performance_metrics": self.performance_metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }
        else:  # json format
            return await self._generate_test_report()
