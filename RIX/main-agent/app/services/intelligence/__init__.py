# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/intelligence/__init__.py
# Intelligence calculation services for RIX Personal Agent
# Pattern-based algorithms for coaching and optimization (no LLM integration)
# RELEVANT FILES: routine_coach.py, project_health.py, calendar_optimizer.py, behavioral_analytics.py

from .behavioral_analytics import BehavioralAnalyticsService
from .calendar_optimizer import CalendarOptimizerService
from .project_health import ProjectHealthService
from .routine_coach import RoutineCoachingService

__all__ = ["RoutineCoachingService", "ProjectHealthService", "CalendarOptimizerService", "BehavioralAnalyticsService"]
