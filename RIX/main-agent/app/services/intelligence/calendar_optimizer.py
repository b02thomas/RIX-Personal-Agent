# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/intelligence/calendar_optimizer.py
# Schedule optimization & conflict detection for Calendar Intelligence Hub
# Pattern-based calendar analysis and productivity optimization (no LLM integration)
# RELEVANT FILES: core/database.py, models/schemas.py, api/endpoints/calendar.py

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date, timedelta, time
import statistics
import uuid
from collections import defaultdict

from app.core.database import database
from app.models.schemas import CalendarOptimizationResponse, IntelligenceResponse

logger = logging.getLogger(__name__)


class CalendarOptimizerService:
    """
    Calendar optimization service providing pattern-based scheduling analysis
    Detects conflicts, optimizes productivity, and suggests improvements
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # Default productivity patterns (can be personalized based on user data)
        self.default_peak_hours = [(9, 11), (14, 16)]  # 9-11 AM, 2-4 PM
        self.default_low_energy_hours = [(12, 13), (16, 17)]  # Lunch, late afternoon
    
    async def optimize_schedule(self, user_id: str, target_date: date, 
                              preferences: Optional[Dict[str, Any]] = None) -> CalendarOptimizationResponse:
        """
        Optimize schedule for a specific date
        
        Args:
            user_id: User identifier
            target_date: Date to optimize
            preferences: User scheduling preferences
            
        Returns:
            Optimization response with suggestions and improvements
        """
        start_time = datetime.now()
        
        try:
            # Get events for target date
            events = await database.execute(
                """
                SELECT * FROM calendar_events 
                WHERE user_id = $1 AND DATE(start_time) = $2
                ORDER BY start_time ASC
                """,
                uuid.UUID(user_id), target_date,
                fetch=True
            )
            
            # Get user's productivity patterns
            productivity_patterns = await self._analyze_productivity_patterns(user_id)
            
            # Detect conflicts
            conflicts = self._detect_scheduling_conflicts(events)
            
            # Analyze current schedule efficiency
            efficiency_analysis = self._analyze_schedule_efficiency(events, productivity_patterns)
            
            # Generate optimization suggestions
            suggestions = self._generate_optimization_suggestions(
                events, productivity_patterns, conflicts, preferences or {}
            )
            
            # Identify productivity improvements
            productivity_improvements = self._identify_productivity_improvements(
                events, productivity_patterns, efficiency_analysis
            )
            
            # Calculate time block effectiveness
            time_block_analysis = self._analyze_time_blocks(events, productivity_patterns)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return CalendarOptimizationResponse(
                success=True,
                data={
                    "target_date": target_date.isoformat(),
                    "total_events": len(events),
                    "schedule_efficiency": efficiency_analysis,
                    "time_block_analysis": time_block_analysis
                },
                suggestions=suggestions,
                conflicts_resolved=len(conflicts),
                productivity_improvements=productivity_improvements,
                insights={
                    "productivity_patterns": productivity_patterns,
                    "conflict_analysis": conflicts,
                    "schedule_density": self._calculate_schedule_density(events),
                    "focus_time_available": self._calculate_available_focus_time(events, target_date)
                },
                confidence_score=0.78,  # Pattern-based confidence
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            self.logger.error(f"Error optimizing schedule: {e}")
            return CalendarOptimizationResponse(
                success=False,
                data={},
                insights={"error": str(e)}
            )
    
    async def analyze_week_patterns(self, user_id: str, start_date: date) -> Dict[str, Any]:
        """Analyze weekly scheduling patterns and productivity"""
        end_date = start_date + timedelta(days=6)
        
        # Get week's events
        events = await database.execute(
            """
            SELECT * FROM calendar_events 
            WHERE user_id = $1 AND DATE(start_time) BETWEEN $2 AND $3
            ORDER BY start_time ASC
            """,
            uuid.UUID(user_id), start_date, end_date,
            fetch=True
        )
        
        # Get productivity tracking data
        productivity_data = await database.execute(
            """
            SELECT * FROM calendar_productivity_tracking
            WHERE user_id = $1 AND date BETWEEN $2 AND $3
            ORDER BY date ASC
            """,
            uuid.UUID(user_id), start_date, end_date,
            fetch=True
        )
        
        # Analyze patterns
        daily_patterns = self._analyze_daily_patterns(events, productivity_data)
        workload_distribution = self._analyze_workload_distribution(events)
        energy_alignment = self._analyze_energy_alignment(events, productivity_data)
        
        return {
            "week_period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "daily_patterns": daily_patterns,
            "workload_distribution": workload_distribution,
            "energy_alignment": energy_alignment,
            "recommendations": self._generate_weekly_recommendations(
                daily_patterns, workload_distribution, energy_alignment
            )
        }
    
    async def _analyze_productivity_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's historical productivity patterns"""
        # Get productivity tracking data for last 60 days
        productivity_data = await database.execute(
            """
            SELECT pt.*, ce.start_time, ce.end_time, ce.event_type, ce.productivity_category
            FROM calendar_productivity_tracking pt
            LEFT JOIN calendar_events ce ON pt.event_id = ce.id
            WHERE pt.user_id = $1 AND pt.date >= $2
            ORDER BY pt.date DESC
            """,
            uuid.UUID(user_id), date.today() - timedelta(days=60),
            fetch=True
        )
        
        if not productivity_data:
            return {
                "peak_hours": self.default_peak_hours,
                "low_energy_hours": self.default_low_energy_hours,
                "best_days": ["Tuesday", "Wednesday", "Thursday"],
                "data_source": "default_patterns"
            }
        
        # Analyze hourly productivity
        hourly_productivity = defaultdict(list)
        daily_productivity = defaultdict(list)
        
        for entry in productivity_data:
            if entry.get('start_time'):
                hour = entry['start_time'].hour
                weekday = entry['date'].weekday()
                weekday_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weekday]
                
                productivity_score = entry.get('productivity_score', 5)
                energy_level = entry.get('energy_level', 5)
                focus_quality = entry.get('focus_quality', 5)
                
                combined_score = (productivity_score + energy_level + focus_quality) / 3
                
                hourly_productivity[hour].append(combined_score)
                daily_productivity[weekday_name].append(combined_score)
        
        # Find peak hours
        peak_hours = []
        for hour, scores in hourly_productivity.items():
            if scores and statistics.mean(scores) >= 7:
                peak_hours.append(hour)
        
        # Group consecutive peak hours
        peak_periods = self._group_consecutive_hours(peak_hours)
        
        # Find low energy hours
        low_energy_hours = []
        for hour, scores in hourly_productivity.items():
            if scores and statistics.mean(scores) <= 4:
                low_energy_hours.append(hour)
        
        low_energy_periods = self._group_consecutive_hours(low_energy_hours)
        
        # Find best days
        day_averages = {day: statistics.mean(scores) for day, scores in daily_productivity.items() if scores}
        best_days = sorted(day_averages.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "peak_hours": peak_periods if peak_periods else self.default_peak_hours,
            "low_energy_hours": low_energy_periods if low_energy_periods else self.default_low_energy_hours,
            "best_days": [day for day, score in best_days[:3]],
            "hourly_averages": {hour: statistics.mean(scores) for hour, scores in hourly_productivity.items()},
            "daily_averages": day_averages,
            "data_points": len(productivity_data),
            "data_source": "user_patterns"
        }
    
    def _detect_scheduling_conflicts(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect scheduling conflicts and overlaps"""
        conflicts = []
        
        for i, event1 in enumerate(events):
            for j, event2 in enumerate(events[i+1:], i+1):
                # Check for time overlap
                start1, end1 = event1['start_time'], event1['end_time']
                start2, end2 = event2['start_time'], event2['end_time']
                
                if start1 < end2 and start2 < end1:  # Overlap detected
                    overlap_start = max(start1, start2)
                    overlap_end = min(end1, end2)
                    overlap_duration = (overlap_end - overlap_start).total_seconds() / 60
                    
                    conflicts.append({
                        "type": "time_overlap",
                        "event1": {
                            "id": event1['id'],
                            "title": event1['title'],
                            "start": start1.isoformat(),
                            "end": end1.isoformat()
                        },
                        "event2": {
                            "id": event2['id'],
                            "title": event2['title'],
                            "start": start2.isoformat(),
                            "end": end2.isoformat()
                        },
                        "overlap_duration_minutes": overlap_duration,
                        "severity": "high" if overlap_duration > 30 else "medium"
                    })
        
        # Detect other conflict types
        conflicts.extend(self._detect_travel_conflicts(events))
        conflicts.extend(self._detect_energy_conflicts(events))
        
        return conflicts
    
    def _detect_travel_conflicts(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect potential travel time conflicts"""
        travel_conflicts = []
        
        for i in range(len(events) - 1):
            current_event = events[i]
            next_event = events[i + 1]
            
            # Check if events have different locations
            current_location = current_event.get('location', '').strip()
            next_location = next_event.get('location', '').strip()
            
            if current_location and next_location and current_location != next_location:
                # Calculate time between events
                time_gap = (next_event['start_time'] - current_event['end_time']).total_seconds() / 60
                
                # Assume minimum 15 minutes travel time for different locations
                if time_gap < 15:
                    travel_conflicts.append({
                        "type": "travel_time",
                        "event1": {
                            "title": current_event['title'],
                            "location": current_location,
                            "end": current_event['end_time'].isoformat()
                        },
                        "event2": {
                            "title": next_event['title'],
                            "location": next_location,
                            "start": next_event['start_time'].isoformat()
                        },
                        "time_gap_minutes": time_gap,
                        "severity": "medium"
                    })
        
        return travel_conflicts
    
    def _detect_energy_conflicts(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect energy-draining scheduling patterns"""
        energy_conflicts = []
        
        # Check for back-to-back high-energy events
        high_energy_types = ['meeting', 'presentation', 'interview']
        
        for i in range(len(events) - 1):
            current_event = events[i]
            next_event = events[i + 1]
            
            if (current_event.get('event_type') in high_energy_types and
                next_event.get('event_type') in high_energy_types):
                
                time_gap = (next_event['start_time'] - current_event['end_time']).total_seconds() / 60
                
                if time_gap < 30:  # Less than 30 minutes break
                    energy_conflicts.append({
                        "type": "energy_drain",
                        "description": "Back-to-back high-energy events without adequate break",
                        "events": [current_event['title'], next_event['title']],
                        "time_gap_minutes": time_gap,
                        "severity": "medium",
                        "recommendation": "Add 30-minute buffer between high-energy events"
                    })
        
        return energy_conflicts
    
    def _analyze_schedule_efficiency(self, events: List[Dict[str, Any]], 
                                   productivity_patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze overall schedule efficiency"""
        if not events:
            return {"score": 50, "status": "no_events"}
        
        total_scheduled_time = 0
        productive_time = 0
        peak_utilization = 0
        
        peak_hours = productivity_patterns.get('peak_hours', self.default_peak_hours)
        
        for event in events:
            duration = (event['end_time'] - event['start_time']).total_seconds() / 3600  # hours
            total_scheduled_time += duration
            
            # Check if event overlaps with peak hours
            event_start_hour = event['start_time'].hour
            event_end_hour = event['end_time'].hour
            
            for peak_start, peak_end in peak_hours:
                overlap = max(0, min(event_end_hour, peak_end) - max(event_start_hour, peak_start))
                if overlap > 0:
                    peak_utilization += overlap
            
            # Count productive event types
            if event.get('productivity_category') in ['deep_work', 'collaboration']:
                productive_time += duration
        
        # Calculate efficiency metrics
        productivity_ratio = productive_time / total_scheduled_time if total_scheduled_time else 0
        peak_utilization_ratio = peak_utilization / sum(end - start for start, end in peak_hours)
        
        # Calculate overall efficiency score
        efficiency_score = (productivity_ratio * 0.6 + peak_utilization_ratio * 0.4) * 100
        
        return {
            "score": int(efficiency_score),
            "total_scheduled_hours": total_scheduled_time,
            "productive_hours": productive_time,
            "productivity_ratio": productivity_ratio,
            "peak_utilization_ratio": peak_utilization_ratio,
            "status": self._get_efficiency_status(efficiency_score)
        }
    
    def _generate_optimization_suggestions(self, events: List[Dict[str, Any]], 
                                         productivity_patterns: Dict[str, Any],
                                         conflicts: List[Dict[str, Any]],
                                         preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate specific optimization suggestions"""
        suggestions = []
        
        # Conflict resolution suggestions
        for conflict in conflicts:
            if conflict['type'] == 'time_overlap':
                suggestions.append({
                    "priority": "high",
                    "category": "conflict_resolution",
                    "title": "Resolve Schedule Conflict",
                    "description": f"Overlap between '{conflict['event1']['title']}' and '{conflict['event2']['title']}'",
                    "action": "Reschedule one event or shorten duration",
                    "impact": "Eliminates double-booking and stress"
                })
        
        # Peak hour optimization
        peak_hours = productivity_patterns.get('peak_hours', self.default_peak_hours)
        low_productivity_events = []
        
        for event in events:
            event_hour = event['start_time'].hour
            is_in_peak = any(start <= event_hour < end for start, end in peak_hours)
            
            if not is_in_peak and event.get('productivity_category') == 'deep_work':
                low_productivity_events.append(event)
        
        if low_productivity_events:
            suggestions.append({
                "priority": "medium",
                "category": "peak_optimization",
                "title": "Optimize Peak Hour Usage",
                "description": f"{len(low_productivity_events)} deep work sessions outside peak hours",
                "action": "Move focused work to peak productivity times",
                "impact": "Increase work quality and efficiency"
            })
        
        # Break suggestions
        consecutive_meetings = self._find_consecutive_meetings(events)
        if consecutive_meetings:
            suggestions.append({
                "priority": "medium",
                "category": "energy_management",
                "title": "Add Strategic Breaks",
                "description": f"Found {len(consecutive_meetings)} periods of consecutive meetings",
                "action": "Add 15-30 minute breaks between meeting blocks",
                "impact": "Maintain energy and focus throughout the day"
            })
        
        # Focus time suggestions
        available_focus_blocks = self._find_available_focus_blocks(events, date.today())
        if len(available_focus_blocks) < 2:
            suggestions.append({
                "priority": "high",
                "category": "focus_time",
                "title": "Protect Focus Time",
                "description": "Limited uninterrupted time blocks available",
                "action": "Block 90-120 minute periods for deep work",
                "impact": "Enable high-quality, concentrated work"
            })
        
        return suggestions[:6]  # Top 6 suggestions
    
    def _identify_productivity_improvements(self, events: List[Dict[str, Any]],
                                          productivity_patterns: Dict[str, Any],
                                          efficiency_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify specific productivity improvements"""
        improvements = []
        
        # Meeting optimization
        meetings = [e for e in events if e.get('event_type') == 'meeting']
        if len(meetings) > 4:
            avg_meeting_duration = statistics.mean([
                (e['end_time'] - e['start_time']).total_seconds() / 3600 
                for e in meetings
            ])
            
            if avg_meeting_duration > 1.0:  # More than 1 hour average
                improvements.append({
                    "type": "meeting_efficiency",
                    "title": "Optimize Meeting Duration",
                    "current_state": f"Average meeting: {avg_meeting_duration:.1f} hours",
                    "improvement": "Reduce average meeting time by 25%",
                    "method": "Set default 45-minute meetings, use agendas",
                    "estimated_savings": f"{len(meetings) * avg_meeting_duration * 0.25:.1f} hours/day"
                })
        
        # Time blocking improvements
        unscheduled_hours = self._calculate_unscheduled_time(events, date.today())
        if unscheduled_hours > 3:
            improvements.append({
                "type": "time_blocking",
                "title": "Implement Time Blocking",
                "current_state": f"{unscheduled_hours:.1f} hours unstructured time",
                "improvement": "Block time for specific activities",
                "method": "Schedule admin tasks, email, and planning time",
                "estimated_benefits": "25% increase in focused productivity"
            })
        
        # Peak hour utilization
        peak_utilization = efficiency_analysis.get('peak_utilization_ratio', 0)
        if peak_utilization < 0.7:
            improvements.append({
                "type": "peak_optimization",
                "title": "Maximize Peak Hour Usage",
                "current_state": f"{peak_utilization:.1%} peak hour utilization",
                "improvement": "Increase peak hour usage to 80%+",
                "method": "Move important work to high-energy periods",
                "estimated_benefits": "30% improvement in work quality"
            })
        
        return improvements
    
    def _analyze_time_blocks(self, events: List[Dict[str, Any]], 
                           productivity_patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze time block effectiveness"""
        blocks = []
        
        # Create time blocks from events
        for event in events:
            duration = (event['end_time'] - event['start_time']).total_seconds() / 60  # minutes
            start_hour = event['start_time'].hour
            
            # Determine if in peak time
            peak_hours = productivity_patterns.get('peak_hours', self.default_peak_hours)
            is_peak = any(start <= start_hour < end for start, end in peak_hours)
            
            blocks.append({
                "title": event['title'],
                "duration_minutes": duration,
                "start_hour": start_hour,
                "is_peak_time": is_peak,
                "event_type": event.get('event_type', 'unknown'),
                "productivity_category": event.get('productivity_category')
            })
        
        # Analyze block patterns
        total_blocks = len(blocks)
        peak_blocks = len([b for b in blocks if b['is_peak_time']])
        avg_block_duration = statistics.mean([b['duration_minutes'] for b in blocks]) if blocks else 0
        
        # Find optimal block sizes by category
        deep_work_blocks = [b for b in blocks if b['productivity_category'] == 'deep_work']
        meeting_blocks = [b for b in blocks if b['event_type'] == 'meeting']
        
        return {
            "total_blocks": total_blocks,
            "peak_time_blocks": peak_blocks,
            "peak_utilization": peak_blocks / total_blocks if total_blocks else 0,
            "average_block_duration": avg_block_duration,
            "deep_work_analysis": {
                "count": len(deep_work_blocks),
                "avg_duration": statistics.mean([b['duration_minutes'] for b in deep_work_blocks]) if deep_work_blocks else 0,
                "in_peak_time": len([b for b in deep_work_blocks if b['is_peak_time']])
            },
            "meeting_analysis": {
                "count": len(meeting_blocks),
                "avg_duration": statistics.mean([b['duration_minutes'] for b in meeting_blocks]) if meeting_blocks else 0,
                "in_peak_time": len([b for b in meeting_blocks if b['is_peak_time']])
            }
        }
    
    # Helper methods
    def _group_consecutive_hours(self, hours: List[int]) -> List[Tuple[int, int]]:
        """Group consecutive hours into periods"""
        if not hours:
            return []
        
        hours = sorted(hours)
        periods = []
        start = hours[0]
        end = hours[0]
        
        for hour in hours[1:]:
            if hour == end + 1:
                end = hour
            else:
                periods.append((start, end + 1))
                start = end = hour
        
        periods.append((start, end + 1))
        return periods
    
    def _calculate_schedule_density(self, events: List[Dict[str, Any]]) -> float:
        """Calculate how densely packed the schedule is"""
        if not events:
            return 0.0
        
        # Calculate total event time
        total_event_time = sum([
            (event['end_time'] - event['start_time']).total_seconds() / 3600
            for event in events
        ])
        
        # Calculate day span
        if len(events) == 1:
            day_span = 8  # Assume 8-hour day
        else:
            first_event = min(events, key=lambda x: x['start_time'])
            last_event = max(events, key=lambda x: x['end_time'])
            day_span = (last_event['end_time'] - first_event['start_time']).total_seconds() / 3600
        
        return total_event_time / day_span if day_span > 0 else 0.0
    
    def _calculate_available_focus_time(self, events: List[Dict[str, Any]], target_date: date) -> Dict[str, Any]:
        """Calculate available focus time slots"""
        # Define work day boundaries
        work_start = datetime.combine(target_date, time(8, 0))
        work_end = datetime.combine(target_date, time(18, 0))
        
        # Create list of occupied time slots
        occupied_slots = []
        for event in events:
            occupied_slots.append((event['start_time'], event['end_time']))
        
        # Sort by start time
        occupied_slots.sort(key=lambda x: x[0])
        
        # Find available slots
        available_slots = []
        current_time = work_start
        
        for start, end in occupied_slots:
            if current_time < start:
                slot_duration = (start - current_time).total_seconds() / 60
                if slot_duration >= 30:  # Minimum 30 minutes
                    available_slots.append({
                        "start": current_time,
                        "end": start,
                        "duration_minutes": slot_duration
                    })
            current_time = max(current_time, end)
        
        # Check for time after last event
        if current_time < work_end:
            slot_duration = (work_end - current_time).total_seconds() / 60
            if slot_duration >= 30:
                available_slots.append({
                    "start": current_time,
                    "end": work_end,
                    "duration_minutes": slot_duration
                })
        
        # Calculate focus time metrics
        total_available = sum([slot['duration_minutes'] for slot in available_slots])
        focus_blocks = [slot for slot in available_slots if slot['duration_minutes'] >= 90]
        
        return {
            "total_available_minutes": total_available,
            "available_slots": len(available_slots),
            "focus_blocks_90min": len(focus_blocks),
            "longest_available_block": max([slot['duration_minutes'] for slot in available_slots]) if available_slots else 0,
            "quality": "excellent" if len(focus_blocks) >= 2 else "good" if len(focus_blocks) >= 1 else "limited"
        }
    
    def _find_consecutive_meetings(self, events: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Find consecutive meeting blocks"""
        meetings = [e for e in events if e.get('event_type') == 'meeting']
        meetings.sort(key=lambda x: x['start_time'])
        
        consecutive_blocks = []
        current_block = []
        
        for meeting in meetings:
            if not current_block:
                current_block = [meeting]
            else:
                # Check if this meeting is consecutive (within 15 minutes of previous end)
                last_meeting = current_block[-1]
                gap = (meeting['start_time'] - last_meeting['end_time']).total_seconds() / 60
                
                if gap <= 15:  # 15 minute gap or less = consecutive
                    current_block.append(meeting)
                else:
                    if len(current_block) >= 2:  # Only care about 2+ consecutive meetings
                        consecutive_blocks.append(current_block)
                    current_block = [meeting]
        
        # Don't forget the last block
        if len(current_block) >= 2:
            consecutive_blocks.append(current_block)
        
        return consecutive_blocks
    
    def _find_available_focus_blocks(self, events: List[Dict[str, Any]], target_date: date) -> List[Dict[str, Any]]:
        """Find available blocks suitable for focused work"""
        available_focus = self._calculate_available_focus_time(events, target_date)
        return [slot for slot in available_focus.get('available_slots', []) if slot.get('duration_minutes', 0) >= 90]
    
    def _calculate_unscheduled_time(self, events: List[Dict[str, Any]], target_date: date) -> float:
        """Calculate total unscheduled time in work day"""
        work_hours = 10  # 8 AM to 6 PM
        
        scheduled_time = sum([
            (event['end_time'] - event['start_time']).total_seconds() / 3600
            for event in events
        ])
        
        return max(0, work_hours - scheduled_time)
    
    def _get_efficiency_status(self, efficiency_score: float) -> str:
        """Get efficiency status label"""
        if efficiency_score >= 80:
            return "excellent"
        elif efficiency_score >= 65:
            return "good"
        elif efficiency_score >= 50:
            return "fair"
        else:
            return "needs_improvement"
    
    def _analyze_daily_patterns(self, events: List[Dict[str, Any]], 
                              productivity_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze daily scheduling patterns"""
        # Group events by day
        daily_events = defaultdict(list)
        for event in events:
            day = event['start_time'].date()
            daily_events[day].append(event)
        
        # Analyze each day
        daily_analysis = {}
        for day, day_events in daily_events.items():
            daily_analysis[day.isoformat()] = {
                "event_count": len(day_events),
                "total_scheduled_hours": sum([
                    (e['end_time'] - e['start_time']).total_seconds() / 3600 
                    for e in day_events
                ]),
                "meeting_count": len([e for e in day_events if e.get('event_type') == 'meeting']),
                "focus_time_scheduled": len([e for e in day_events if e.get('productivity_category') == 'deep_work']),
                "schedule_density": self._calculate_schedule_density(day_events)
            }
        
        return daily_analysis
    
    def _analyze_workload_distribution(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze workload distribution across the week"""
        daily_workload = defaultdict(float)
        
        for event in events:
            day = event['start_time'].strftime('%A')
            duration = (event['end_time'] - event['start_time']).total_seconds() / 3600
            daily_workload[day] += duration
        
        if not daily_workload:
            return {"distribution": "no_data"}
        
        avg_daily_workload = statistics.mean(daily_workload.values())
        workload_variance = statistics.variance(daily_workload.values()) if len(daily_workload) > 1 else 0
        
        # Find heaviest and lightest days
        heaviest_day = max(daily_workload.items(), key=lambda x: x[1])
        lightest_day = min(daily_workload.items(), key=lambda x: x[1])
        
        return {
            "daily_workload": dict(daily_workload),
            "average_daily_hours": avg_daily_workload,
            "workload_variance": workload_variance,
            "heaviest_day": {"day": heaviest_day[0], "hours": heaviest_day[1]},
            "lightest_day": {"day": lightest_day[0], "hours": lightest_day[1]},
            "distribution_quality": "balanced" if workload_variance < 2 else "unbalanced"
        }
    
    def _analyze_energy_alignment(self, events: List[Dict[str, Any]], 
                                productivity_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze alignment between scheduled events and energy levels"""
        if not productivity_data:
            return {"alignment": "no_data"}
        
        # Map productivity data by date and event
        productivity_map = {}
        for entry in productivity_data:
            if entry.get('event_id'):
                productivity_map[entry['event_id']] = entry
        
        # Analyze alignment
        aligned_events = 0
        misaligned_events = 0
        
        for event in events:
            event_id = event.get('id')
            if event_id in productivity_map:
                productivity_entry = productivity_map[event_id]
                energy_level = productivity_entry.get('energy_level', 5)
                
                # Check if high-energy event during high-energy time
                if event.get('productivity_category') == 'deep_work':
                    if energy_level >= 7:
                        aligned_events += 1
                    else:
                        misaligned_events += 1
        
        total_analyzed = aligned_events + misaligned_events
        alignment_rate = aligned_events / total_analyzed if total_analyzed > 0 else 0
        
        return {
            "alignment_rate": alignment_rate,
            "aligned_events": aligned_events,
            "misaligned_events": misaligned_events,
            "total_analyzed": total_analyzed,
            "quality": "excellent" if alignment_rate >= 0.8 else "good" if alignment_rate >= 0.6 else "needs_improvement"
        }
    
    def _generate_weekly_recommendations(self, daily_patterns: Dict, 
                                       workload_distribution: Dict, 
                                       energy_alignment: Dict) -> List[Dict[str, Any]]:
        """Generate weekly optimization recommendations"""
        recommendations = []
        
        # Workload balancing
        if workload_distribution.get('distribution_quality') == 'unbalanced':
            heaviest = workload_distribution['heaviest_day']
            lightest = workload_distribution['lightest_day']
            
            recommendations.append({
                "type": "workload_balancing",
                "priority": "medium",
                "title": "Balance Weekly Workload",
                "description": f"{heaviest['day']} is overloaded ({heaviest['hours']:.1f}h), {lightest['day']} is light ({lightest['hours']:.1f}h)",
                "action": f"Move some tasks from {heaviest['day']} to {lightest['day']}"
            })
        
        # Energy alignment improvement
        if energy_alignment.get('alignment_rate', 0) < 0.6:
            recommendations.append({
                "type": "energy_alignment",
                "priority": "high",
                "title": "Improve Energy-Task Alignment",
                "description": f"Only {energy_alignment.get('alignment_rate', 0):.1%} of tasks aligned with energy levels",
                "action": "Schedule demanding work during high-energy periods"
            })
        
        return recommendations


# Global service instance
calendar_optimizer_service = CalendarOptimizerService()