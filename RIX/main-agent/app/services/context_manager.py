"""
Context management for Phase 5 Intelligence Features
Prepares data contexts for N8N MCP endpoints while maintaining RIX PRD compliance
"""

import asyncio
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.services.database import database

logger = get_logger(__name__)


class ContextManager:
    """Context manager for AI intelligence features"""
    
    def __init__(self):
        self.rix_frontend_url = settings.ALLOWED_ORIGINS[0] if settings.ALLOWED_ORIGINS else "http://localhost:3000"
    
    async def prepare_routine_coaching_context(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Prepare context for routine coaching MCP endpoint
        Fetches user routines and completion data for AI analysis
        """
        logger.info("Preparing routine coaching context", user_id=user_id)
        
        try:
            # Fetch user routines from RIX frontend API
            routines_data = await self._fetch_user_routines(user_id)
            completion_history = await self._fetch_routine_completions(user_id)
            
            # Calculate routine statistics
            routine_stats = self._calculate_routine_stats(routines_data, completion_history)
            
            # Prepare context for N8N MCP endpoint
            context = {
                "user_id": user_id,
                "message": message,
                "routines": routines_data,
                "completion_history": completion_history,
                "statistics": routine_stats,
                "analysis_request": {
                    "type": "routine_coaching",
                    "focus_areas": self._extract_routine_focus(message),
                    "timestamp": datetime.utcnow().isoformat()
                },
                "preferences": {
                    "coaching_style": "supportive",  # Can be extracted from user preferences
                    "goal_oriented": True,
                    "data_driven": True
                }
            }
            
            logger.info("Routine coaching context prepared", user_id=user_id, routines_count=len(routines_data))
            return context
            
        except Exception as e:
            logger.error("Failed to prepare routine coaching context", user_id=user_id, error=str(e))
            # Return minimal context for graceful failure
            return {
                "user_id": user_id,
                "message": message,
                "routines": [],
                "error": "Unable to fetch routine data",
                "analysis_request": {"type": "routine_coaching", "timestamp": datetime.utcnow().isoformat()}
            }
    
    async def prepare_project_intelligence_context(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Prepare context for project intelligence MCP endpoint
        Fetches user projects and calculates health score context for AI analysis
        """
        logger.info("Preparing project intelligence context", user_id=user_id)
        
        try:
            # Fetch user projects from RIX frontend API
            projects_data = await self._fetch_user_projects(user_id)
            
            # Calculate project metrics and health indicators
            project_insights = self._calculate_project_insights(projects_data)
            
            # Extract specific project from message if mentioned
            target_project = self._extract_project_reference(message, projects_data)
            
            # Prepare context for N8N MCP endpoint
            context = {
                "user_id": user_id,
                "message": message,
                "projects": projects_data,
                "target_project": target_project,
                "insights": project_insights,
                "analysis_request": {
                    "type": "project_intelligence",
                    "focus": self._extract_project_focus(message),
                    "include_health_score": True,
                    "include_recommendations": True,
                    "timestamp": datetime.utcnow().isoformat()
                },
                "metrics": {
                    "total_projects": len(projects_data),
                    "active_projects": len([p for p in projects_data if p.get("status") == "active"]),
                    "average_health_score": project_insights.get("average_health_score", 0),
                    "projects_at_risk": project_insights.get("at_risk_count", 0)
                }
            }
            
            logger.info("Project intelligence context prepared", user_id=user_id, projects_count=len(projects_data))
            return context
            
        except Exception as e:
            logger.error("Failed to prepare project intelligence context", user_id=user_id, error=str(e))
            # Return minimal context for graceful failure
            return {
                "user_id": user_id,
                "message": message,
                "projects": [],
                "error": "Unable to fetch project data",
                "analysis_request": {"type": "project_intelligence", "timestamp": datetime.utcnow().isoformat()}
            }
    
    async def prepare_calendar_optimization_context(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Prepare context for calendar optimization MCP endpoint
        Fetches calendar events and time-blocking data for AI scheduling optimization
        """
        logger.info("Preparing calendar optimization context", user_id=user_id)
        
        try:
            # Fetch calendar events from RIX frontend API
            calendar_data = await self._fetch_calendar_events(user_id)
            time_blocks = await self._fetch_time_blocks(user_id)
            
            # Analyze scheduling patterns and conflicts
            schedule_analysis = self._analyze_schedule_patterns(calendar_data, time_blocks)
            
            # Extract optimization preferences from message
            optimization_prefs = self._extract_optimization_preferences(message)
            
            # Prepare context for N8N MCP endpoint
            context = {
                "user_id": user_id,
                "message": message,
                "calendar_events": calendar_data,
                "time_blocks": time_blocks,
                "schedule_analysis": schedule_analysis,
                "optimization_request": {
                    "type": "calendar_optimization",
                    "preferences": optimization_prefs,
                    "time_range": self._extract_time_range(message),
                    "focus_areas": self._extract_calendar_focus(message),
                    "timestamp": datetime.utcnow().isoformat()
                },
                "patterns": {
                    "productivity_peaks": schedule_analysis.get("productivity_windows", []),
                    "common_conflicts": schedule_analysis.get("conflicts", []),
                    "free_time_blocks": schedule_analysis.get("free_blocks", []),
                    "meeting_density": schedule_analysis.get("meeting_density", 0)
                }
            }
            
            logger.info("Calendar optimization context prepared", user_id=user_id, events_count=len(calendar_data))
            return context
            
        except Exception as e:
            logger.error("Failed to prepare calendar optimization context", user_id=user_id, error=str(e))
            # Return minimal context for graceful failure
            return {
                "user_id": user_id,
                "message": message,
                "calendar_events": [],
                "error": "Unable to fetch calendar data",
                "optimization_request": {"type": "calendar_optimization", "timestamp": datetime.utcnow().isoformat()}
            }
    
    async def _fetch_user_routines(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user routines from RIX frontend API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.rix_frontend_url}/api/routines?include_completions=true",
                    headers={"X-Internal-Request": "main-agent"}  # Internal service header
                )
                response.raise_for_status()
                data = response.json()
                return data.get("routines", [])
        except Exception as e:
            logger.warning("Failed to fetch routines from API, using mock data", error=str(e))
            # Return mock routine data for development
            return [
                {
                    "id": "routine-1",
                    "name": "Morning Routine",
                    "frequency": "daily",
                    "habits": [
                        {"id": "habit-1", "name": "Meditation", "duration": 10},
                        {"id": "habit-2", "name": "Exercise", "duration": 30},
                        {"id": "habit-3", "name": "Reading", "duration": 15}
                    ],
                    "recentCompletions": []
                }
            ]
    
    async def _fetch_routine_completions(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch routine completion history"""
        try:
            # This would typically fetch from a completions endpoint
            # For now, return mock completion data
            return [
                {
                    "routine_id": "routine-1",
                    "completion_date": (datetime.now() - timedelta(days=1)).isoformat(),
                    "completion_percentage": 100,
                    "habits_completed": {"habit-1": True, "habit-2": True, "habit-3": True}
                },
                {
                    "routine_id": "routine-1", 
                    "completion_date": (datetime.now() - timedelta(days=2)).isoformat(),
                    "completion_percentage": 67,
                    "habits_completed": {"habit-1": True, "habit-2": True, "habit-3": False}
                }
            ]
        except Exception as e:
            logger.warning("Failed to fetch completion history", error=str(e))
            return []
    
    async def _fetch_user_projects(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user projects from RIX frontend API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.rix_frontend_url}/api/projects",
                    headers={"X-Internal-Request": "main-agent"}
                )
                response.raise_for_status()
                data = response.json()
                return data.get("projects", [])
        except Exception as e:
            logger.warning("Failed to fetch projects from API, using mock data", error=str(e))
            # Return mock project data for development
            return [
                {
                    "id": "project-1",
                    "name": "RIX Development",
                    "status": "active",
                    "priority": "high",
                    "aiHealthScore": 87,
                    "startDate": "2024-08-01",
                    "progress": 65
                },
                {
                    "id": "project-2", 
                    "name": "Personal Website",
                    "status": "active",
                    "priority": "medium",
                    "aiHealthScore": 73,
                    "startDate": "2024-07-15",
                    "progress": 40
                }
            ]
    
    async def _fetch_calendar_events(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch calendar events from RIX frontend API"""
        try:
            # Calculate date range for next week
            start_date = datetime.now().strftime("%Y-%m-%d")
            end_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.rix_frontend_url}/api/calendar?start_date={start_date}&end_date={end_date}",
                    headers={"X-Internal-Request": "main-agent"}
                )
                response.raise_for_status()
                data = response.json()
                return data.get("events", [])
        except Exception as e:
            logger.warning("Failed to fetch calendar events, using mock data", error=str(e))
            # Return mock calendar data for development
            return [
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
    
    async def _fetch_time_blocks(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch time blocks from RIX frontend API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.rix_frontend_url}/api/calendar/time-blocks",
                    headers={"X-Internal-Request": "main-agent"}
                )
                response.raise_for_status()
                data = response.json()
                return data.get("timeBlocks", [])
        except Exception as e:
            logger.warning("Failed to fetch time blocks", error=str(e))
            return []
    
    def _calculate_routine_stats(self, routines: List[Dict], completions: List[Dict]) -> Dict[str, Any]:
        """Calculate routine performance statistics"""
        if not routines:
            return {"total_routines": 0, "completion_rate": 0}
        
        total_completions = len(completions)
        avg_completion_rate = sum(c.get("completion_percentage", 0) for c in completions) / max(total_completions, 1)
        
        return {
            "total_routines": len(routines),
            "recent_completions": total_completions,
            "average_completion_rate": round(avg_completion_rate, 2),
            "streak_days": self._calculate_streak(completions),
            "improvement_trend": "improving" if avg_completion_rate > 70 else "needs_attention"
        }
    
    def _calculate_project_insights(self, projects: List[Dict]) -> Dict[str, Any]:
        """Calculate project performance insights"""
        if not projects:
            return {"average_health_score": 0, "at_risk_count": 0}
        
        health_scores = [p.get("aiHealthScore", 0) for p in projects if p.get("aiHealthScore")]
        avg_health = sum(health_scores) / len(health_scores) if health_scores else 0
        at_risk = len([p for p in projects if p.get("aiHealthScore", 0) < 60])
        
        return {
            "average_health_score": round(avg_health, 2),
            "at_risk_count": at_risk,
            "top_performing_project": max(projects, key=lambda p: p.get("aiHealthScore", 0), default=None),
            "needs_attention": [p for p in projects if p.get("aiHealthScore", 0) < 70]
        }
    
    def _analyze_schedule_patterns(self, events: List[Dict], time_blocks: List[Dict]) -> Dict[str, Any]:
        """Analyze scheduling patterns and productivity windows"""
        # Simplified analysis for context preparation
        return {
            "meeting_density": len(events) / 7,  # meetings per day average
            "productivity_windows": ["09:00-11:00", "14:00-16:00"],  # Mock productive times
            "conflicts": [],
            "free_blocks": time_blocks,
            "schedule_efficiency": 75  # Mock efficiency score
        }
    
    def _calculate_streak(self, completions: List[Dict]) -> int:
        """Calculate current routine completion streak"""
        # Simplified streak calculation
        if not completions:
            return 0
        
        # Sort by date and calculate consecutive days
        sorted_completions = sorted(completions, key=lambda x: x.get("completion_date", ""), reverse=True)
        streak = 0
        for completion in sorted_completions:
            if completion.get("completion_percentage", 0) >= 80:  # Consider 80%+ as successful
                streak += 1
            else:
                break
        return streak
    
    def _extract_routine_focus(self, message: str) -> List[str]:
        """Extract routine focus areas from user message"""
        focus_keywords = {
            "consistency": ["consistent", "regular", "daily", "streak"],
            "timing": ["time", "schedule", "when", "morning", "evening"],
            "difficulty": ["hard", "difficult", "struggle", "challenging"],
            "motivation": ["motivated", "energy", "enthusiasm", "drive"]
        }
        
        message_lower = message.lower()
        focuses = []
        
        for focus, keywords in focus_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                focuses.append(focus)
        
        return focuses if focuses else ["general_improvement"]
    
    def _extract_project_focus(self, message: str) -> List[str]:
        """Extract project analysis focus from user message"""
        focus_keywords = {
            "health_score": ["health", "score", "rating", "assessment"],
            "progress": ["progress", "status", "completion", "timeline"],
            "risks": ["risk", "problem", "issue", "concern", "blocker"],
            "optimization": ["optimize", "improve", "better", "enhance"]
        }
        
        message_lower = message.lower()
        focuses = []
        
        for focus, keywords in focus_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                focuses.append(focus)
        
        return focuses if focuses else ["general_analysis"]
    
    def _extract_calendar_focus(self, message: str) -> List[str]:
        """Extract calendar optimization focus from user message"""
        focus_keywords = {
            "productivity": ["productive", "efficiency", "focus", "deep work"],
            "meetings": ["meeting", "calls", "appointments"],
            "time_blocking": ["time block", "scheduling", "organize"],
            "conflicts": ["conflict", "overlap", "busy", "overbooked"]
        }
        
        message_lower = message.lower()
        focuses = []
        
        for focus, keywords in focus_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                focuses.append(focus)
        
        return focuses if focuses else ["general_optimization"]
    
    def _extract_project_reference(self, message: str, projects: List[Dict]) -> Optional[Dict]:
        """Extract specific project reference from message"""
        message_lower = message.lower()
        for project in projects:
            project_name = project.get("name", "").lower()
            if project_name and project_name in message_lower:
                return project
        return None
    
    def _extract_time_range(self, message: str) -> Dict[str, str]:
        """Extract time range from message for calendar optimization"""
        # Simple time range extraction - can be enhanced with NLP
        message_lower = message.lower()
        
        if "today" in message_lower:
            return {"start": datetime.now().strftime("%Y-%m-%d"), "end": datetime.now().strftime("%Y-%m-%d")}
        elif "week" in message_lower:
            return {
                "start": datetime.now().strftime("%Y-%m-%d"),
                "end": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            }
        else:
            # Default to next 7 days
            return {
                "start": datetime.now().strftime("%Y-%m-%d"),
                "end": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            }
    
    def _extract_optimization_preferences(self, message: str) -> Dict[str, Any]:
        """Extract optimization preferences from message"""
        message_lower = message.lower()
        
        preferences = {
            "prioritize_deep_work": "focus" in message_lower or "deep work" in message_lower,
            "minimize_meetings": "fewer meetings" in message_lower or "less meetings" in message_lower,
            "optimize_for_energy": "energy" in message_lower or "productive" in message_lower,
            "respect_existing": "keep" in message_lower or "maintain" in message_lower
        }
        
        return preferences


# Global context manager instance
context_manager = ContextManager()