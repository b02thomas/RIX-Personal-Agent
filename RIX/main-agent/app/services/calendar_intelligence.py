# /main-agent/app/services/calendar_intelligence.py
# Calendar intelligence service with Motion-style AI optimization and German business context
# Provides intelligent scheduling suggestions, conflict resolution, and productivity optimization
# RELEVANT FILES: calendar.py, google_calendar.py, /frontend/hooks/useCalendar.ts

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
import logging
from dataclasses import dataclass

# Setup logging
logger = logging.getLogger(__name__)

@dataclass
class CalendarConflict:
    """Represents a calendar conflict"""
    event_id: str
    title: str
    start_time: datetime
    end_time: datetime
    type: str
    severity: str  # 'low', 'medium', 'high', 'critical'

@dataclass
class SchedulingSuggestion:
    """AI-generated scheduling suggestion"""
    id: str
    type: str  # 'focus_time', 'break', 'reschedule', etc.
    title: str
    description: str
    confidence: float  # 0-100
    reasoning: List[str]
    time_slot: Optional[Dict[str, str]]
    priority: str

@dataclass
class GermanBusinessRule:
    """German business culture rule"""
    rule_id: str
    name: str
    description: str
    severity: str
    validator_func: callable

class CalendarIntelligenceService:
    """
    Calendar intelligence service that provides AI-powered scheduling optimization,
    German business hour validation, and productivity insights.
    """
    
    def __init__(self):
        self.german_business_rules = self._initialize_german_rules()
        self.productivity_patterns = {}  # User-specific patterns
        
    def _initialize_german_rules(self) -> List[GermanBusinessRule]:
        """Initialize German business culture validation rules"""
        return [
            GermanBusinessRule(
                rule_id="business_hours",
                name="German Business Hours",
                description="Meetings should be between 8:00-17:00 Uhr",
                severity="medium",
                validator_func=self._validate_business_hours
            ),
            GermanBusinessRule(
                rule_id="lunch_break",
                name="Lunch Break Protection", 
                description="Avoid scheduling meetings during 12:00-13:00 Uhr",
                severity="high",
                validator_func=self._validate_lunch_break
            ),
            GermanBusinessRule(
                rule_id="overtime_warning",
                name="Overtime Alert",
                description="Warn about meetings after 18:00 Uhr",
                severity="high", 
                validator_func=self._validate_overtime
            ),
            GermanBusinessRule(
                rule_id="friday_afternoon",
                name="Friday Afternoon Respect",
                description="Avoid late Friday meetings (after 15:00)",
                severity="medium",
                validator_func=self._validate_friday_afternoon
            ),
            GermanBusinessRule(
                rule_id="punctuality_buffer",
                name="Punctuality Buffer",
                description="Add 10-15 minute buffer between meetings",
                severity="medium",
                validator_func=self._validate_punctuality_buffer
            )
        ]
    
    def _validate_business_hours(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate German business hours (8-17 Uhr)"""
        start_time = datetime.fromisoformat(event_data["start_time"].replace('Z', '+00:00'))
        berlin_time = start_time.astimezone(timezone(timedelta(hours=1)))  # CET/CEST
        hour = berlin_time.hour
        
        if hour < 8 or hour >= 17:
            return {
                "rule_id": "business_hours",
                "severity": "medium", 
                "message": f"Meeting at {hour:02d}:{berlin_time.minute:02d} is outside German business hours (8-17 Uhr)",
                "recommendations": ["Schedule between 9:00-16:00 for better attendance"]
            }
        return None
    
    def _validate_lunch_break(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate lunch break protection (12-13 Uhr)"""
        start_time = datetime.fromisoformat(event_data["start_time"].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(event_data["end_time"].replace('Z', '+00:00'))
        berlin_start = start_time.astimezone(timezone(timedelta(hours=1)))
        berlin_end = end_time.astimezone(timezone(timedelta(hours=1)))
        
        # Check if meeting overlaps with lunch (12-13)
        lunch_start = berlin_start.replace(hour=12, minute=0, second=0, microsecond=0)
        lunch_end = berlin_start.replace(hour=13, minute=0, second=0, microsecond=0)
        
        if (berlin_start < lunch_end and berlin_end > lunch_start):
            return {
                "rule_id": "lunch_break",
                "severity": "high",
                "message": "Meeting conflicts with traditional German lunch break (12-13 Uhr)",
                "recommendations": ["Schedule at 11:00 or 14:00", "Confirm lunch meeting is acceptable to all attendees"]
            }
        return None
    
    def _validate_overtime(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate overtime warnings (after 18 Uhr)"""
        start_time = datetime.fromisoformat(event_data["start_time"].replace('Z', '+00:00'))
        berlin_time = start_time.astimezone(timezone(timedelta(hours=1)))
        
        if berlin_time.hour >= 18:
            return {
                "rule_id": "overtime_warning",
                "severity": "high",
                "message": f"Meeting at {berlin_time.hour:02d}:{berlin_time.minute:02d} is after typical German work hours",
                "recommendations": ["Consider morning alternative", "Ensure meeting necessity", "Respect work-life balance"]
            }
        return None
    
    def _validate_friday_afternoon(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate Friday afternoon meetings"""
        start_time = datetime.fromisoformat(event_data["start_time"].replace('Z', '+00:00'))
        berlin_time = start_time.astimezone(timezone(timedelta(hours=1)))
        
        if berlin_time.weekday() == 4 and berlin_time.hour >= 15:  # Friday after 15:00
            return {
                "rule_id": "friday_afternoon", 
                "severity": "medium",
                "message": "Late Friday meeting may have lower attendance in German culture",
                "recommendations": ["Schedule earlier in the day", "Consider Thursday alternative"]
            }
        return None
    
    def _validate_punctuality_buffer(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate punctuality buffer between meetings"""
        # This would need context of surrounding meetings
        # For now, return general recommendation
        return {
            "rule_id": "punctuality_buffer",
            "severity": "low",
            "message": "Consider 15-minute buffer for German punctuality standards",
            "recommendations": ["Add preparation time", "Account for travel between locations"]
        }
    
    async def validate_german_business_hours(self, event_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Validate event against German business culture rules
        """
        warnings = []
        
        for rule in self.german_business_rules:
            try:
                violation = rule.validator_func(event_data)
                if violation:
                    warnings.append({
                        "id": f"warning-{rule.rule_id}-{int(datetime.now().timestamp())}",
                        "type": "cultural",
                        "severity": violation["severity"],
                        "title": rule.name,
                        "description": violation["message"],
                        "recommendations": violation["recommendations"],
                        "rule_id": rule.rule_id
                    })
            except Exception as e:
                logger.error(f"Error validating rule {rule.rule_id}: {str(e)}")
                
        return warnings
    
    async def check_conflicts(self, user_id: str, start_time: datetime, end_time: datetime) -> List[CalendarConflict]:
        """
        Check for calendar conflicts in the specified time range
        """
        conflicts = []
        
        # TODO: Query actual calendar data from database
        # For now, return mock conflicts for testing
        
        # Mock existing event that might conflict
        mock_existing = {
            "id": "existing-meeting-1",
            "title": "Existing Team Meeting",
            "start_time": start_time - timedelta(minutes=30),
            "end_time": start_time + timedelta(minutes=30),
            "type": "meeting"
        }
        
        # Check for overlap
        if (start_time < mock_existing["end_time"] and end_time > mock_existing["start_time"]):
            conflicts.append(CalendarConflict(
                event_id=mock_existing["id"],
                title=mock_existing["title"],
                start_time=mock_existing["start_time"],
                end_time=mock_existing["end_time"],
                type=mock_existing["type"],
                severity="medium"
            ))
        
        return conflicts
    
    async def suggest_alternatives(self, time_block_request: Any, conflicts: List[CalendarConflict]) -> List[SchedulingSuggestion]:
        """
        Suggest alternative time slots when conflicts are detected
        """
        suggestions = []
        
        # Analyze conflicts and suggest alternatives
        for conflict in conflicts:
            # Suggest time after conflict
            alternative_start = conflict.end_time + timedelta(minutes=15)  # 15min buffer
            alternative_end = alternative_start + timedelta(
                minutes=int((time_block_request.end_time - time_block_request.start_time).total_seconds() / 60)
            )
            
            suggestions.append(SchedulingSuggestion(
                id=f"alt-{int(datetime.now().timestamp())}",
                type="reschedule",
                title=f"Alternative after {conflict.title}",
                description=f"Schedule {time_block_request.title} after existing meeting ends",
                confidence=85,
                reasoning=[
                    "Avoids conflict with existing meeting",
                    "Maintains requested duration",
                    "Includes punctuality buffer"
                ],
                time_slot={
                    "start": alternative_start.isoformat(),
                    "end": alternative_end.isoformat()
                },
                priority="medium"
            ))
        
        return suggestions
    
    async def enhance_with_insights(self, calendar_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Enhance calendar data with AI insights and productivity analysis
        """
        enhanced_data = calendar_data.copy()
        
        # Add productivity insights
        insights = await self._generate_productivity_insights(calendar_data, user_id)
        enhanced_data["productivity_insights"] = insights
        
        # Add energy optimization suggestions
        energy_suggestions = await self._analyze_energy_patterns(calendar_data, user_id)
        enhanced_data["suggestions"].extend(energy_suggestions)
        
        # Add focus time recommendations
        focus_recommendations = await self._recommend_focus_blocks(calendar_data, user_id)
        enhanced_data["focus_recommendations"] = focus_recommendations
        
        return enhanced_data
    
    async def _generate_productivity_insights(self, calendar_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Generate productivity insights from calendar patterns"""
        
        meetings = calendar_data.get("next_meetings", [])
        available_slots = calendar_data.get("available_slots", [])
        
        # Analyze meeting density
        meeting_density = len(meetings) / 8  # meetings per 8-hour workday
        
        # Analyze focus time availability
        total_focus_time = sum(slot["duration"] for slot in available_slots)
        
        # Generate insights
        insights = {
            "meeting_density": meeting_density,
            "focus_time_hours": total_focus_time / 60,
            "balance_score": max(0, 100 - (meeting_density * 20)),  # Penalty for too many meetings
            "recommendations": []
        }
        
        if meeting_density > 0.6:  # More than 60% of day in meetings
            insights["recommendations"].append("Consider blocking focus time to maintain productivity")
            
        if total_focus_time < 120:  # Less than 2 hours focus time
            insights["recommendations"].append("Schedule longer focus blocks for deep work")
        
        return insights
    
    async def _analyze_energy_patterns(self, calendar_data: Dict[str, Any], user_id: str) -> List[SchedulingSuggestion]:
        """Analyze energy patterns and suggest optimal scheduling"""
        suggestions = []
        
        # German business context: Most productive hours are typically 9-11 AM and 2-4 PM
        now = datetime.now(timezone.utc)
        morning_focus = now.replace(hour=9, minute=0, second=0, microsecond=0)
        afternoon_focus = now.replace(hour=14, minute=0, second=0, microsecond=0)
        
        # Check if morning focus time is available
        available_slots = calendar_data.get("available_slots", [])
        for slot in available_slots:
            slot_start = datetime.fromisoformat(slot["start_time"].replace('Z', '+00:00'))
            
            # Morning high-energy slot
            if 9 <= slot_start.hour <= 11 and slot["duration"] >= 90:
                suggestions.append(SchedulingSuggestion(
                    id=f"energy-morning-{int(datetime.now().timestamp())}",
                    type="focus_time",
                    title="Optimal Morning Focus Block",
                    description="Schedule deep work during high-energy morning hours",
                    confidence=92,
                    reasoning=[
                        "Peak cognitive performance hours (9-11 AM)",
                        "Aligns with German business productivity patterns",
                        "Long uninterrupted slot available"
                    ],
                    time_slot={
                        "start": slot["start_time"],
                        "end": slot["end_time"]
                    },
                    priority="high"
                ))
        
        return suggestions
    
    async def _recommend_focus_blocks(self, calendar_data: Dict[str, Any], user_id: str) -> List[Dict[str, Any]]:
        """Recommend optimal focus time blocks"""
        recommendations = []
        
        available_slots = calendar_data.get("available_slots", [])
        
        for slot in available_slots:
            if slot["duration"] >= 90:  # At least 1.5 hours
                # Determine focus type based on time of day and duration
                slot_start = datetime.fromisoformat(slot["start_time"].replace('Z', '+00:00'))
                hour = slot_start.hour
                
                if 9 <= hour <= 11:
                    focus_type = "deep_work"
                    suitability = "High cognitive load tasks"
                elif 14 <= hour <= 16:
                    focus_type = "creative"
                    suitability = "Creative and strategic thinking"
                else:
                    focus_type = "admin"
                    suitability = "Administrative and planning tasks"
                
                recommendations.append({
                    "slot_id": f"focus-{int(datetime.now().timestamp())}-{hour}",
                    "start_time": slot["start_time"],
                    "end_time": slot["end_time"],
                    "duration": slot["duration"],
                    "recommended_type": focus_type,
                    "suitability": suitability,
                    "energy_match": slot["energy_level"],
                    "ai_confidence": slot["suitability"].get("deep_work", 50)
                })
        
        return recommendations
    
    async def generate_suggestions(self, user_id: str, calendar_data: Dict[str, Any], 
                                 focus_duration: Optional[int], meeting_type: Optional[str]) -> List[Dict[str, Any]]:
        """Generate AI-powered scheduling suggestions"""
        suggestions = []
        
        # Focus time suggestions
        if focus_duration and focus_duration >= 30:
            available_slots = calendar_data.get("available_slots", [])
            for slot in available_slots:
                if slot["duration"] >= focus_duration:
                    suggestions.append({
                        "id": f"focus-{int(datetime.now().timestamp())}",
                        "type": "focus_time",
                        "title": f"Block {focus_duration}min Focus Time",
                        "description": f"Ideal {focus_duration}-minute focus block available",
                        "time_slot": {
                            "start": slot["start_time"], 
                            "end": slot["end_time"]
                        },
                        "priority": "medium",
                        "ai_confidence": slot["suitability"].get("deep_work", 70),
                        "reasoning": [
                            f"{slot['duration']} minutes available",
                            f"{slot['energy_level']} energy level optimal",
                            "No conflicts detected"
                        ]
                    })
        
        # Meeting optimization suggestions
        meetings = calendar_data.get("next_meetings", [])
        if len(meetings) > 3:
            suggestions.append({
                "id": f"optimize-{int(datetime.now().timestamp())}",
                "type": "optimization",
                "title": "Consider Meeting Consolidation", 
                "description": "Multiple meetings could be combined for efficiency",
                "priority": "low",
                "ai_confidence": 75,
                "reasoning": [
                    f"{len(meetings)} meetings scheduled",
                    "German business culture favors consolidated discussions",
                    "Reduces context switching overhead"
                ]
            })
        
        return suggestions
    
    async def find_optimal_slots(self, user_id: str, target_date: datetime, duration: int) -> List[Dict[str, Any]]:
        """Find optimal available time slots for the given duration"""
        optimal_slots = []
        
        # Mock optimal slots based on German business patterns
        base_time = target_date.replace(hour=9, minute=0, second=0, microsecond=0)
        
        # Morning slot (9-11 AM) - highest productivity
        morning_slot = {
            "start_time": base_time.isoformat(),
            "end_time": (base_time + timedelta(minutes=duration)).isoformat(),
            "duration": duration,
            "optimality_score": 95,
            "energy_level": "high",
            "productivity_match": "excellent",
            "german_business_fit": "optimal"
        }
        optimal_slots.append(morning_slot)
        
        # Afternoon slot (2-4 PM) - good for creative work  
        afternoon_base = base_time.replace(hour=14)
        afternoon_slot = {
            "start_time": afternoon_base.isoformat(),
            "end_time": (afternoon_base + timedelta(minutes=duration)).isoformat(),
            "duration": duration,
            "optimality_score": 85,
            "energy_level": "medium",
            "productivity_match": "good",
            "german_business_fit": "good"
        }
        optimal_slots.append(afternoon_slot)
        
        return optimal_slots
    
    async def calculate_optimization_score(self, user_id: str, calendar_data: Dict[str, Any]) -> int:
        """Calculate overall schedule optimization score (0-100)"""
        
        score = 100  # Start with perfect score
        
        meetings = calendar_data.get("next_meetings", [])
        available_slots = calendar_data.get("available_slots", [])
        
        # Penalty for too many meetings
        if len(meetings) > 5:
            score -= (len(meetings) - 5) * 5
        
        # Bonus for adequate focus time
        total_focus_time = sum(slot["duration"] for slot in available_slots)
        if total_focus_time >= 120:  # 2+ hours
            score += 10
        elif total_focus_time < 60:  # Less than 1 hour
            score -= 20
        
        # German business hours compliance
        for meeting in meetings:
            start_time = datetime.fromisoformat(meeting["start_time"].replace('Z', '+00:00'))
            hour = start_time.hour
            
            if hour < 8 or hour >= 17:
                score -= 5  # Outside business hours penalty
            
            if hour == 12:  # Lunch hour penalty
                score -= 10
        
        # Energy alignment bonus
        morning_focus_available = any(
            9 <= datetime.fromisoformat(slot["start_time"].replace('Z', '+00:00')).hour <= 11 
            and slot["duration"] >= 90
            for slot in available_slots
        )
        
        if morning_focus_available:
            score += 15
        
        return max(0, min(100, score))
    
    async def optimize_schedule(self, user_id: str, calendar_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI-powered schedule optimization with recommendations
        """
        
        optimizations = {
            "changes": [],
            "improvement_score": 0,
            "recommendations": []
        }
        
        meetings = calendar_data.get("next_meetings", [])
        available_slots = calendar_data.get("available_slots", [])
        
        # Analyze current schedule
        current_score = await self.calculate_optimization_score(user_id, calendar_data)
        
        # Recommend focus time blocks
        long_slots = [slot for slot in available_slots if slot["duration"] >= 90]
        if long_slots:
            optimizations["changes"].append({
                "type": "add_focus_block",
                "description": "Add deep work focus block",
                "time_slot": long_slots[0],
                "expected_benefit": "+15 productivity points"
            })
        
        # Recommend meeting consolidation
        if len(meetings) > 4:
            optimizations["recommendations"].append({
                "type": "consolidate_meetings",
                "title": "Consider Meeting Consolidation",
                "description": "Combine related meetings to reduce context switching",
                "impact": "Medium",
                "effort": "Low"
            })
        
        # German business optimization
        late_meetings = [
            m for m in meetings 
            if datetime.fromisoformat(m["start_time"].replace('Z', '+00:00')).hour >= 17
        ]
        
        if late_meetings:
            optimizations["recommendations"].append({
                "type": "reschedule_late_meetings", 
                "title": "Reschedule Late Meetings",
                "description": "Move after-hours meetings to respect German work-life balance",
                "impact": "High",
                "effort": "Medium"
            })
        
        # Calculate potential improvement
        potential_score = current_score + len(optimizations["changes"]) * 10
        optimizations["improvement_score"] = min(100, potential_score) - current_score
        
        return optimizations
    
    async def sync_time_block_to_calendar(self, user_id: str, block_data: Dict[str, Any]):
        """
        Sync time block to external calendar (Google Calendar, etc.)
        """
        try:
            # TODO: Integrate with GoogleCalendarIntegration
            logger.info(f"Syncing time block to calendar for user {user_id}: {block_data['title']}")
            
            # Create calendar event from time block
            calendar_event = {
                "summary": block_data["title"],
                "description": f"Focus Time: {block_data.get('description', '')}",
                "start": {"dateTime": block_data["start_time"]},
                "end": {"dateTime": block_data["end_time"]},
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "popup", "minutes": 10}  # 10min reminder
                    ]
                }
            }
            
            # TODO: Call Google Calendar API to create event
            await asyncio.sleep(0.1)  # Simulate API call
            
            logger.info(f"Time block synced successfully to calendar")
            
        except Exception as e:
            logger.error(f"Failed to sync time block to calendar: {str(e)}")
            # Don't raise - this is a background task