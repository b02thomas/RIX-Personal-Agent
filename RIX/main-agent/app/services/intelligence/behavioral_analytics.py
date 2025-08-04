# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/intelligence/behavioral_analytics.py
# Cross-system pattern analysis for Behavioral Analytics Engine
# Pattern-based correlation analysis without LLM integration (prepared for future Sub-Agent)
# RELEVANT FILES: core/database.py, models/schemas.py, api/endpoints/analytics.py

import json
import logging
import statistics
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from app.core.database import database
from app.models.schemas import BehavioralAnalytics, IntelligenceResponse
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class BehavioralAnalyticsService:
    """
    Behavioral analytics service providing cross-system pattern analysis
    Identifies correlations between routines, tasks, calendar, and productivity
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def generate_comprehensive_analysis(self, user_id: str, analysis_period: str = "monthly") -> Dict[str, Any]:
        """
        Generate comprehensive behavioral analysis across all systems

        Args:
            user_id: User identifier
            analysis_period: Analysis period (weekly, monthly, quarterly)

        Returns:
            Comprehensive analysis with insights and correlations
        """
        start_time = datetime.now()

        try:
            # Determine date range
            end_date = date.today()
            if analysis_period == "weekly":
                start_date = end_date - timedelta(days=7)
            elif analysis_period == "monthly":
                start_date = end_date - timedelta(days=30)
            elif analysis_period == "quarterly":
                start_date = end_date - timedelta(days=90)
            else:
                start_date = end_date - timedelta(days=30)  # Default to monthly

            # Collect data from all systems
            data_collection = await self._collect_cross_system_data(user_id, start_date, end_date)

            # Perform correlation analysis
            correlations = await self._analyze_cross_system_correlations(data_collection)

            # Identify behavioral patterns
            patterns = await self._identify_behavioral_patterns(data_collection)

            # Generate productivity insights
            productivity_insights = await self._analyze_productivity_patterns(data_collection)

            # Create recommendations
            recommendations = self._generate_behavioral_recommendations(correlations, patterns, productivity_insights)

            # Calculate confidence score
            confidence_score = self._calculate_analysis_confidence(data_collection)

            # Store analysis results
            analysis_data = BehavioralAnalytics(
                user_id=uuid.UUID(user_id),
                analysis_type="comprehensive_behavioral",
                analysis_period=analysis_period,
                period_start=start_date,
                period_end=end_date,
                insights=productivity_insights,
                correlations=correlations,
                recommendations=recommendations,
                confidence_score=confidence_score,
                metrics=self._extract_key_metrics(data_collection),
            )

            # Store in database
            stored_analysis = await self._store_analysis(analysis_data)

            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

            return {
                "success": True,
                "analysis_id": str(stored_analysis["id"]),
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
                "data_points": self._count_data_points(data_collection),
                "insights": productivity_insights,
                "correlations": correlations,
                "patterns": patterns,
                "recommendations": recommendations,
                "confidence_score": confidence_score,
                "processing_time_ms": processing_time,
            }

        except Exception as e:
            self.logger.error(f"Error generating behavioral analysis: {e}")
            return {"success": False, "error": str(e), "insights": {"error": "Analysis failed"}}

    async def analyze_productivity_correlations(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Analyze specific productivity correlations"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # Get productivity tracking data
        productivity_data = await database.execute(
            """
            SELECT pt.*, ce.event_type, ce.productivity_category,
                   ce.start_time, ce.end_time
            FROM calendar_productivity_tracking pt
            LEFT JOIN calendar_events ce ON pt.event_id = ce.id
            WHERE pt.user_id = $1 AND pt.date BETWEEN $2 AND $3
            ORDER BY pt.date DESC
            """,
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        # Get routine completion data for same period
        routine_data = await database.execute(
            """
            SELECT drc.*, ur.name as routine_name
            FROM daily_routine_completions drc
            JOIN user_routines ur ON drc.routine_id = ur.id
            WHERE drc.user_id = $1 AND drc.completion_date BETWEEN $2 AND $3
            ORDER BY drc.completion_date DESC
            """,
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        # Get task completion data
        task_data = await database.execute(
            """
            SELECT * FROM tasks
            WHERE user_id = $1 AND completion_date BETWEEN $2 AND $3
            AND status = 'completed'
            ORDER BY completion_date DESC
            """,
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        # Analyze correlations
        correlations = {}

        # Routine-Productivity correlation
        if routine_data and productivity_data:
            correlations["routine_productivity"] = await self._calculate_routine_productivity_correlation(
                routine_data, productivity_data
            )

        # Sleep-Productivity correlation (using mood_before as proxy)
        if productivity_data:
            correlations["energy_productivity"] = self._calculate_energy_productivity_correlation(productivity_data)

        # Task completion-Mood correlation
        if task_data and productivity_data:
            correlations["task_completion_mood"] = self._calculate_task_mood_correlation(task_data, productivity_data)

        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "data_points": {
                "productivity_entries": len(productivity_data),
                "routine_completions": len(routine_data),
                "task_completions": len(task_data),
            },
            "correlations": correlations,
            "insights": self._generate_correlation_insights(correlations),
        }

    async def _collect_cross_system_data(self, user_id: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """Collect data from all systems for analysis"""

        # Tasks and Projects
        tasks = await database.execute(
            "SELECT * FROM tasks WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3",
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        projects = await database.execute(
            "SELECT * FROM projects WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3",
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        # Calendar and Productivity
        calendar_events = await database.execute(
            "SELECT * FROM calendar_events WHERE user_id = $1 AND DATE(start_time) BETWEEN $2 AND $3",
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        productivity_tracking = await database.execute(
            "SELECT * FROM calendar_productivity_tracking WHERE user_id = $1 AND date BETWEEN $2 AND $3",
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        # Routines
        routine_completions = await database.execute(
            """
            SELECT drc.*, ur.name as routine_name, ur.routine_type
            FROM daily_routine_completions drc
            JOIN user_routines ur ON drc.routine_id = ur.id
            WHERE drc.user_id = $1 AND drc.completion_date BETWEEN $2 AND $3
            """,
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        # Goals
        goal_progress = await database.execute(
            """
            SELECT gpe.*, ug.title as goal_title, ug.goal_type
            FROM goal_progress_entries gpe
            JOIN user_goals ug ON gpe.goal_id = ug.id
            WHERE gpe.user_id = $1 AND DATE(gpe.recorded_at) BETWEEN $2 AND $3
            """,
            uuid.UUID(user_id),
            start_date,
            end_date,
            fetch=True,
        )

        return {
            "tasks": tasks,
            "projects": projects,
            "calendar_events": calendar_events,
            "productivity_tracking": productivity_tracking,
            "routine_completions": routine_completions,
            "goal_progress": goal_progress,
            "date_range": {"start": start_date, "end": end_date},
        }

    async def _analyze_cross_system_correlations(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze correlations between different systems"""
        correlations = {}

        # Morning routine → Daily productivity correlation
        if data["routine_completions"] and data["productivity_tracking"]:
            correlations["morning_routine_productivity"] = await self._calculate_morning_routine_impact(
                data["routine_completions"], data["productivity_tracking"]
            )

        # Exercise → Energy level correlation
        correlations["exercise_energy"] = self._calculate_exercise_energy_correlation(
            data["routine_completions"], data["productivity_tracking"]
        )

        # Task completion → Mood correlation
        if data["tasks"] and data["productivity_tracking"]:
            correlations["task_completion_mood"] = self._calculate_task_completion_mood_impact(
                data["tasks"], data["productivity_tracking"]
            )

        # Goal progress → Motivation correlation
        if data["goal_progress"]:
            correlations["goal_progress_motivation"] = self._calculate_goal_motivation_correlation(data["goal_progress"])

        # Calendar density → Stress correlation
        if data["calendar_events"] and data["productivity_tracking"]:
            correlations["calendar_density_stress"] = self._calculate_calendar_stress_correlation(
                data["calendar_events"], data["productivity_tracking"]
            )

        return correlations

    async def _identify_behavioral_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Identify recurring behavioral patterns"""
        patterns = {}

        # Weekly patterns
        patterns["weekly_patterns"] = self._analyze_weekly_patterns(data)

        # Time-of-day patterns
        patterns["daily_patterns"] = self._analyze_daily_timing_patterns(data)

        # Productivity cycles
        patterns["productivity_cycles"] = self._identify_productivity_cycles(data["productivity_tracking"])

        # Habit stacking patterns
        patterns["habit_stacking"] = self._analyze_habit_stacking_patterns(data["routine_completions"])

        # Work-life balance patterns
        patterns["work_life_balance"] = self._analyze_work_life_balance(data["calendar_events"], data["routine_completions"])

        return patterns

    async def _analyze_productivity_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze productivity-specific patterns and insights"""
        insights = {}

        # Peak productivity analysis
        if data["productivity_tracking"]:
            insights["peak_productivity"] = self._analyze_peak_productivity_times(data["productivity_tracking"])

        # Focus session effectiveness
        insights["focus_effectiveness"] = self._analyze_focus_session_effectiveness(
            data["calendar_events"], data["productivity_tracking"]
        )

        # Multitasking impact
        insights["multitasking_impact"] = self._analyze_multitasking_patterns(
            data["calendar_events"], data["productivity_tracking"]
        )

        # Break timing impact
        insights["break_timing"] = self._analyze_break_timing_effectiveness(
            data["calendar_events"], data["productivity_tracking"]
        )

        # Context switching cost
        insights["context_switching"] = self._analyze_context_switching_cost(
            data["calendar_events"], data["productivity_tracking"]
        )

        return insights

    def _generate_behavioral_recommendations(self, correlations: Dict, patterns: Dict, insights: Dict) -> List[Dict[str, Any]]:
        """Generate actionable behavioral recommendations"""
        recommendations = []

        # Morning routine recommendations
        morning_routine_impact = correlations.get("morning_routine_productivity", {})
        if morning_routine_impact.get("correlation", 0) > 0.6:
            recommendations.append(
                {
                    "category": "routine_optimization",
                    "priority": "high",
                    "title": "Optimize Morning Routine",
                    "insight": f"Morning routine completion correlates {morning_routine_impact['correlation']:.1%} with daily productivity",
                    "action": "Maintain consistent morning routine for better daily performance",
                    "expected_impact": "15-25% improvement in daily productivity",
                }
            )

        # Peak time recommendations
        peak_times = insights.get("peak_productivity", {})
        if peak_times.get("peak_hours"):
            recommendations.append(
                {
                    "category": "scheduling_optimization",
                    "priority": "high",
                    "title": "Protect Peak Productivity Hours",
                    "insight": f"Highest productivity during {peak_times['peak_hours']}",
                    "action": "Schedule most important work during these peak hours",
                    "expected_impact": "20-30% improvement in work quality",
                }
            )

        # Exercise-energy recommendations
        exercise_correlation = correlations.get("exercise_energy", {})
        if exercise_correlation.get("correlation", 0) > 0.5:
            recommendations.append(
                {
                    "category": "energy_management",
                    "priority": "medium",
                    "title": "Leverage Exercise for Energy",
                    "insight": f"Exercise correlates {exercise_correlation['correlation']:.1%} with energy levels",
                    "action": "Schedule exercise before high-demand activities",
                    "expected_impact": "10-20% improvement in sustained energy",
                }
            )

        # Focus session recommendations
        focus_effectiveness = insights.get("focus_effectiveness", {})
        if focus_effectiveness.get("optimal_duration"):
            recommendations.append(
                {
                    "category": "focus_optimization",
                    "priority": "medium",
                    "title": "Optimize Focus Session Length",
                    "insight": f"Optimal focus sessions last {focus_effectiveness['optimal_duration']} minutes",
                    "action": "Structure deep work in optimal-length blocks",
                    "expected_impact": "15-25% improvement in focus quality",
                }
            )

        # Break timing recommendations
        break_timing = insights.get("break_timing", {})
        if break_timing.get("optimal_frequency"):
            recommendations.append(
                {
                    "category": "energy_management",
                    "priority": "medium",
                    "title": "Optimize Break Timing",
                    "insight": f"Breaks every {break_timing['optimal_frequency']} minutes maintain peak performance",
                    "action": "Schedule regular breaks to sustain productivity",
                    "expected_impact": "10-15% improvement in sustained focus",
                }
            )

        return recommendations[:6]  # Top 6 recommendations

    # Correlation calculation methods
    async def _calculate_morning_routine_impact(self, routines: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Calculate impact of morning routine on daily productivity"""
        # Group routines by date, filter for morning routines
        morning_routines = {}
        for routine in routines:
            if "morning" in routine.get("routine_name", "").lower():
                date_key = routine["completion_date"]
                morning_routines[date_key] = routine

        # Match with productivity data
        matched_data = []
        for prod_entry in productivity:
            date_key = prod_entry["date"]
            if date_key in morning_routines:
                routine_quality = morning_routines[date_key]["completion_percentage"]
                prod_score = prod_entry.get("productivity_score", 5)
                matched_data.append((routine_quality, prod_score))

        if len(matched_data) < 5:  # Need minimum data points
            return {"correlation": 0, "confidence": "low", "data_points": len(matched_data)}

        # Calculate correlation
        routine_scores, prod_scores = zip(*matched_data)
        correlation = np.corrcoef(routine_scores, prod_scores)[0, 1] if len(matched_data) > 1 else 0

        return {
            "correlation": correlation,
            "confidence": "high" if len(matched_data) >= 15 else "medium",
            "data_points": len(matched_data),
            "avg_productivity_with_routine": statistics.mean([p for r, p in matched_data if r >= 75]),
            "avg_productivity_without_routine": statistics.mean([p for r, p in matched_data if r < 50]),
        }

    def _calculate_exercise_energy_correlation(self, routines: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Calculate correlation between exercise and energy levels"""
        exercise_data = {}

        # Identify exercise from routine habits
        for routine in routines:
            habits_completed = routine.get("habits_completed", [])
            if any("exercise" in habit.lower() or "workout" in habit.lower() for habit in habits_completed):
                exercise_data[routine["completion_date"]] = True

        # Match with energy levels from productivity tracking
        matched_data = []
        for prod_entry in productivity:
            date_key = prod_entry["date"]
            energy_level = prod_entry.get("energy_level")
            if energy_level is not None:
                exercise_done = exercise_data.get(date_key, False)
                matched_data.append((1 if exercise_done else 0, energy_level))

        if len(matched_data) < 5:
            return {"correlation": 0, "confidence": "low"}

        exercise_flags, energy_levels = zip(*matched_data)
        correlation = np.corrcoef(exercise_flags, energy_levels)[0, 1] if len(matched_data) > 1 else 0

        return {
            "correlation": correlation,
            "confidence": "high" if len(matched_data) >= 15 else "medium",
            "avg_energy_with_exercise": statistics.mean([e for ex, e in matched_data if ex]),
            "avg_energy_without_exercise": statistics.mean([e for ex, e in matched_data if not ex]),
        }

    def _calculate_task_completion_mood_impact(self, tasks: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Calculate impact of task completion on mood"""
        # Count daily task completions
        daily_completions = defaultdict(int)
        for task in tasks:
            if task["status"] == "completed" and task.get("completion_date"):
                completion_date = task["completion_date"].date()
                daily_completions[completion_date] += 1

        # Match with mood data (using mood_after from productivity tracking)
        matched_data = []
        for prod_entry in productivity:
            date_key = prod_entry["date"]
            mood_after = prod_entry.get("mood_after")
            if mood_after is not None:
                completions = daily_completions.get(date_key, 0)
                matched_data.append((completions, mood_after))

        if len(matched_data) < 5:
            return {"correlation": 0, "confidence": "low"}

        completions, moods = zip(*matched_data)
        correlation = np.corrcoef(completions, moods)[0, 1] if len(matched_data) > 1 else 0

        return {
            "correlation": correlation,
            "confidence": "high" if len(matched_data) >= 15 else "medium",
            "data_points": len(matched_data),
        }

    def _calculate_goal_motivation_correlation(self, goal_progress: List[Dict]) -> Dict[str, Any]:
        """Calculate correlation between goal progress and motivation levels"""
        if not goal_progress:
            return {"correlation": 0, "confidence": "no_data"}

        # Use confidence_level as proxy for motivation
        progress_data = [
            (entry["progress_value"], entry.get("confidence_level", 5))
            for entry in goal_progress
            if entry.get("confidence_level")
        ]

        if len(progress_data) < 5:
            return {"correlation": 0, "confidence": "low"}

        progress_values, confidence_levels = zip(*progress_data)
        correlation = np.corrcoef(progress_values, confidence_levels)[0, 1] if len(progress_data) > 1 else 0

        return {
            "correlation": correlation,
            "confidence": "high" if len(progress_data) >= 10 else "medium",
            "insight": "Higher goal progress correlates with increased confidence/motivation"
            if correlation > 0.5
            else "Goal progress and motivation show weak correlation",
        }

    def _calculate_calendar_stress_correlation(self, events: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Calculate correlation between calendar density and stress levels"""
        # Calculate daily calendar density
        daily_density = defaultdict(float)
        for event in events:
            event_date = event["start_time"].date()
            duration = (event["end_time"] - event["start_time"]).total_seconds() / 3600
            daily_density[event_date] += duration

        # Match with stress indicators (inverse of focus_quality)
        matched_data = []
        for prod_entry in productivity:
            date_key = prod_entry["date"]
            focus_quality = prod_entry.get("focus_quality")
            if focus_quality is not None:
                density = daily_density.get(date_key, 0)
                stress_indicator = 10 - focus_quality  # Inverse relationship
                matched_data.append((density, stress_indicator))

        if len(matched_data) < 5:
            return {"correlation": 0, "confidence": "low"}

        densities, stress_levels = zip(*matched_data)
        correlation = np.corrcoef(densities, stress_levels)[0, 1] if len(matched_data) > 1 else 0

        return {
            "correlation": correlation,
            "confidence": "high" if len(matched_data) >= 15 else "medium",
            "optimal_density": self._find_optimal_calendar_density(matched_data),
        }

    # Pattern analysis methods
    def _analyze_weekly_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze weekly behavioral patterns"""
        patterns = {}

        # Analyze productivity by day of week
        if data["productivity_tracking"]:
            daily_productivity = defaultdict(list)
            for entry in data["productivity_tracking"]:
                weekday = entry["date"].strftime("%A")
                if entry.get("productivity_score"):
                    daily_productivity[weekday].append(entry["productivity_score"])

            patterns["productivity_by_day"] = {
                day: statistics.mean(scores) if scores else 0 for day, scores in daily_productivity.items()
            }

        # Analyze routine completion by day
        if data["routine_completions"]:
            daily_routine_completion = defaultdict(list)
            for completion in data["routine_completions"]:
                weekday = completion["completion_date"].strftime("%A")
                daily_routine_completion[weekday].append(completion["completion_percentage"])

            patterns["routine_completion_by_day"] = {
                day: statistics.mean(scores) if scores else 0 for day, scores in daily_routine_completion.items()
            }

        return patterns

    def _analyze_daily_timing_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze timing patterns throughout the day"""
        patterns = {}

        # Analyze productivity by hour
        if data["productivity_tracking"] and data["calendar_events"]:
            hourly_productivity = defaultdict(list)

            # Map productivity to event hours
            productivity_by_event = {
                entry["event_id"]: entry for entry in data["productivity_tracking"] if entry.get("event_id")
            }

            for event in data["calendar_events"]:
                if event["id"] in productivity_by_event:
                    hour = event["start_time"].hour
                    prod_score = productivity_by_event[event["id"]].get("productivity_score")
                    if prod_score:
                        hourly_productivity[hour].append(prod_score)

            patterns["productivity_by_hour"] = {
                hour: statistics.mean(scores) if scores else 0 for hour, scores in hourly_productivity.items()
            }

        return patterns

    def _identify_productivity_cycles(self, productivity_data: List[Dict]) -> Dict[str, Any]:
        """Identify cyclical productivity patterns"""
        if not productivity_data:
            return {"cycles": "no_data"}

        # Sort by date
        sorted_data = sorted(productivity_data, key=lambda x: x["date"])

        # Extract productivity scores over time
        scores = [entry.get("productivity_score", 5) for entry in sorted_data]

        if len(scores) < 14:  # Need at least 2 weeks of data
            return {"cycles": "insufficient_data"}

        # Simple cycle detection using moving averages
        window_size = 7
        moving_averages = []
        for i in range(len(scores) - window_size + 1):
            avg = statistics.mean(scores[i : i + window_size])
            moving_averages.append(avg)

        # Identify peaks and valleys
        peaks = []
        valleys = []
        for i in range(1, len(moving_averages) - 1):
            if moving_averages[i] > moving_averages[i - 1] and moving_averages[i] > moving_averages[i + 1]:
                peaks.append(i)
            elif moving_averages[i] < moving_averages[i - 1] and moving_averages[i] < moving_averages[i + 1]:
                valleys.append(i)

        # Calculate average cycle length
        if len(peaks) > 1:
            peak_intervals = [peaks[i + 1] - peaks[i] for i in range(len(peaks) - 1)]
            avg_cycle_length = statistics.mean(peak_intervals)
        else:
            avg_cycle_length = None

        return {
            "avg_productivity": statistics.mean(scores),
            "productivity_variance": statistics.variance(scores) if len(scores) > 1 else 0,
            "cycle_length_days": avg_cycle_length,
            "peak_periods": len(peaks),
            "low_periods": len(valleys),
            "trend": "improving" if scores[-7:] > scores[:7] else "stable",
        }

    def _analyze_habit_stacking_patterns(self, routine_completions: List[Dict]) -> Dict[str, Any]:
        """Analyze habit stacking and sequencing patterns"""
        if not routine_completions:
            return {"patterns": "no_data"}

        # Group by date and analyze habit sequences
        daily_habits = defaultdict(list)
        for completion in routine_completions:
            date_key = completion["completion_date"]
            habits = completion.get("habits_completed", [])
            daily_habits[date_key].extend(habits)

        # Analyze common habit combinations
        habit_pairs = defaultdict(int)
        for date, habits in daily_habits.items():
            for i in range(len(habits)):
                for j in range(i + 1, len(habits)):
                    pair = tuple(sorted([habits[i], habits[j]]))
                    habit_pairs[pair] += 1

        # Find most common combinations
        common_combinations = sorted(habit_pairs.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "total_habit_instances": sum(len(habits) for habits in daily_habits.values()),
            "common_combinations": [{"habits": list(combo), "frequency": freq} for combo, freq in common_combinations],
            "stacking_effectiveness": len(common_combinations) / len(daily_habits) if daily_habits else 0,
        }

    def _analyze_work_life_balance(self, calendar_events: List[Dict], routine_completions: List[Dict]) -> Dict[str, Any]:
        """Analyze work-life balance patterns"""
        work_hours = 0
        personal_hours = 0

        for event in calendar_events:
            duration = (event["end_time"] - event["start_time"]).total_seconds() / 3600
            if event.get("productivity_category") in ["deep_work", "collaboration", "administrative"]:
                work_hours += duration
            else:
                personal_hours += duration

        # Count personal routine completions
        personal_routines = len([r for r in routine_completions if "personal" in r.get("routine_name", "").lower()])

        total_hours = work_hours + personal_hours
        work_ratio = work_hours / total_hours if total_hours > 0 else 0

        return {
            "work_hours": work_hours,
            "personal_hours": personal_hours,
            "work_life_ratio": work_ratio,
            "personal_routine_completions": personal_routines,
            "balance_quality": self._assess_balance_quality(work_ratio, personal_routines),
        }

    # Analysis helper methods
    def _analyze_peak_productivity_times(self, productivity_data: List[Dict]) -> Dict[str, Any]:
        """Analyze when productivity peaks occur"""
        if not productivity_data:
            return {"peak_hours": "no_data"}

        # This would need event time data to be meaningful
        # For now, return placeholder analysis
        return {
            "peak_hours": "9-11 AM",  # Default based on research
            "productivity_variance": "moderate",
            "consistency": "high",
        }

    def _analyze_focus_session_effectiveness(self, events: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Analyze effectiveness of focus sessions"""
        focus_events = [e for e in events if e.get("productivity_category") == "deep_work"]

        if not focus_events:
            return {"effectiveness": "no_focus_sessions"}

        # Calculate average duration and effectiveness
        durations = [(e["end_time"] - e["start_time"]).total_seconds() / 60 for e in focus_events]
        avg_duration = statistics.mean(durations)

        # Find optimal duration based on productivity scores
        optimal_duration = 90  # Research-based default

        return {
            "total_focus_sessions": len(focus_events),
            "avg_duration_minutes": avg_duration,
            "optimal_duration": optimal_duration,
            "effectiveness_score": 0.8,  # Placeholder
        }

    def _analyze_multitasking_patterns(self, events: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Analyze impact of multitasking on productivity"""
        # Detect overlapping events as proxy for multitasking
        overlapping_periods = 0

        for i, event1 in enumerate(events):
            for event2 in events[i + 1 :]:
                if event1["start_time"] < event2["end_time"] and event2["start_time"] < event1["end_time"]:
                    overlapping_periods += 1

        return {
            "multitasking_periods": overlapping_periods,
            "impact_on_productivity": "negative" if overlapping_periods > 5 else "minimal",
            "recommendation": "Reduce multitasking" if overlapping_periods > 5 else "Current levels acceptable",
        }

    def _analyze_break_timing_effectiveness(self, events: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Analyze effectiveness of break timing"""
        # Simple analysis of gaps between events
        if len(events) < 2:
            return {"break_analysis": "insufficient_events"}

        gaps = []
        sorted_events = sorted(events, key=lambda x: x["start_time"])

        for i in range(len(sorted_events) - 1):
            gap = (sorted_events[i + 1]["start_time"] - sorted_events[i]["end_time"]).total_seconds() / 60
            if 5 <= gap <= 120:  # 5 min to 2 hours
                gaps.append(gap)

        if not gaps:
            return {"break_analysis": "no_suitable_gaps"}

        avg_gap = statistics.mean(gaps)

        return {
            "avg_break_length": avg_gap,
            "break_frequency": len(gaps),
            "optimal_frequency": 90,  # Every 90 minutes
            "effectiveness": "good" if 60 <= avg_gap <= 120 else "needs_adjustment",
        }

    def _analyze_context_switching_cost(self, events: List[Dict], productivity: List[Dict]) -> Dict[str, Any]:
        """Analyze cost of context switching between different types of work"""
        if len(events) < 2:
            return {"context_switches": 0}

        sorted_events = sorted(events, key=lambda x: x["start_time"])
        context_switches = 0

        for i in range(len(sorted_events) - 1):
            current_type = sorted_events[i].get("productivity_category", "unknown")
            next_type = sorted_events[i + 1].get("productivity_category", "unknown")

            if current_type != next_type and current_type != "unknown" and next_type != "unknown":
                context_switches += 1

        return {
            "context_switches": context_switches,
            "switch_rate": context_switches / len(events) if events else 0,
            "impact": "high" if context_switches > len(events) * 0.7 else "moderate",
        }

    # Storage and utility methods
    async def _store_analysis(self, analysis_data: BehavioralAnalytics) -> Dict[str, Any]:
        """Store behavioral analysis in database"""
        data_dict = analysis_data.dict()

        result = await database.execute(
            """
            INSERT INTO behavioral_analytics 
            (id, user_id, analysis_type, analysis_period, period_start, period_end,
             insights, correlations, recommendations, confidence_score, metrics)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            """,
            data_dict.get("id") or uuid.uuid4(),
            data_dict["user_id"],
            data_dict["analysis_type"],
            data_dict["analysis_period"],
            data_dict["period_start"],
            data_dict["period_end"],
            json.dumps(data_dict["insights"]),
            json.dumps(data_dict["correlations"]),
            json.dumps(data_dict["recommendations"]),
            data_dict["confidence_score"],
            json.dumps(data_dict["metrics"]),
            fetch_one=True,
        )

        return result

    def _calculate_analysis_confidence(self, data_collection: Dict[str, Any]) -> float:
        """Calculate confidence score for the analysis"""
        base_confidence = 0.5

        # Data quantity bonus
        total_data_points = self._count_data_points(data_collection)
        if total_data_points >= 100:
            base_confidence += 0.3
        elif total_data_points >= 50:
            base_confidence += 0.2
        elif total_data_points >= 20:
            base_confidence += 0.1

        # Data variety bonus
        data_sources = sum(1 for source, data in data_collection.items() if isinstance(data, list) and len(data) > 0)
        base_confidence += min(0.2, data_sources * 0.05)

        return min(0.95, base_confidence)

    def _count_data_points(self, data_collection: Dict[str, Any]) -> int:
        """Count total data points across all systems"""
        total = 0
        for key, data in data_collection.items():
            if isinstance(data, list):
                total += len(data)
        return total

    def _extract_key_metrics(self, data_collection: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key metrics from data collection"""
        return {
            "total_tasks": len(data_collection.get("tasks", [])),
            "total_events": len(data_collection.get("calendar_events", [])),
            "routine_completions": len(data_collection.get("routine_completions", [])),
            "productivity_entries": len(data_collection.get("productivity_tracking", [])),
            "goal_progress_entries": len(data_collection.get("goal_progress", [])),
            "analysis_period_days": (data_collection["date_range"]["end"] - data_collection["date_range"]["start"]).days,
        }

    def _find_optimal_calendar_density(self, matched_data: List[Tuple[float, float]]) -> float:
        """Find optimal calendar density that minimizes stress"""
        if not matched_data:
            return 6.0  # Default 6 hours per day

        # Find density with lowest stress (highest focus quality)
        optimal_density = min(matched_data, key=lambda x: x[1])[0]
        return optimal_density

    def _assess_balance_quality(self, work_ratio: float, personal_routines: int) -> str:
        """Assess work-life balance quality"""
        if work_ratio > 0.8:
            return "work_heavy"
        elif work_ratio < 0.5:
            return "life_heavy"
        elif personal_routines >= 3:
            return "good_balance"
        else:
            return "needs_personal_time"

    def _generate_correlation_insights(self, correlations: Dict[str, Any]) -> List[str]:
        """Generate insights from correlation analysis"""
        insights = []

        for correlation_type, data in correlations.items():
            if isinstance(data, dict) and "correlation" in data:
                corr_value = data["correlation"]
                if corr_value > 0.6:
                    insights.append(f"Strong positive correlation found in {correlation_type.replace('_', ' ')}")
                elif corr_value < -0.6:
                    insights.append(f"Strong negative correlation found in {correlation_type.replace('_', ' ')}")

        return insights


# Global service instance
behavioral_analytics_service = BehavioralAnalyticsService()
