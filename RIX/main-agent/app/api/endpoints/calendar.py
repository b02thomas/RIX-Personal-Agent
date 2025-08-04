# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/api/endpoints/calendar.py
# Calendar & scheduling APIs for Calendar Intelligence Hub
# Direct API endpoints with future MCP compatibility
# RELEVANT FILES: services/core_apis.py, services/intelligence/calendar_optimizer.py, models/schemas.py

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import date, datetime
import uuid
import logging
import json
import statistics

from app.models.schemas import (
    # Calendar models
    CalendarEvent, CalendarEventCreate, CalendarEventUpdate,
    ProductivityTracking, ProductivityTrackingCreate,
    # Response models
    APIResponse, CalendarOptimizationResponse
)
from app.services.core_apis import core_api_service
from app.services.intelligence.calendar_optimizer import calendar_optimizer_service
from app.middleware.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== CALENDAR EVENT ENDPOINTS ====================

@router.post("/events", response_model=CalendarEvent)
async def create_calendar_event(
    event_data: CalendarEventCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new calendar event"""
    try:
        event = await core_api_service.create_calendar_event(
            user_id=current_user["user_id"],
            event_data=event_data
        )
        return event
    except Exception as e:
        logger.error(f"Error creating calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events", response_model=List[CalendarEvent])
async def get_calendar_events(
    start_date: date = Query(..., description="Start date for events (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date for events (YYYY-MM-DD)"),
    event_type: Optional[str] = Query(None),
    productivity_category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get calendar events for date range"""
    try:
        # Validate date range
        if end_date < start_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")
        
        # Check for reasonable date range (max 1 year)
        if (end_date - start_date).days > 365:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 365 days")
        
        events = await core_api_service.get_calendar_events(
            user_id=current_user["user_id"],
            start_date=start_date,
            end_date=end_date
        )
        
        # Apply additional filters
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        
        if productivity_category:
            events = [e for e in events if e.productivity_category == productivity_category]
        
        return events
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        logger.error(f"Error fetching calendar events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}", response_model=CalendarEvent)
async def get_calendar_event(
    event_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get specific calendar event by ID"""
    try:
        event = await core_api_service.database.execute(
            "SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2",
            uuid.UUID(event_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not event:
            raise HTTPException(status_code=404, detail="Calendar event not found")
            
        return CalendarEvent(**event)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")
    except Exception as e:
        logger.error(f"Error fetching calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/events/{event_id}", response_model=CalendarEvent)
async def update_calendar_event(
    event_id: str = Path(...),
    update_data: CalendarEventUpdate = ...,
    current_user: dict = Depends(get_current_user)
):
    """Update calendar event"""
    try:
        # Build dynamic UPDATE query
        updates = []
        params = []
        param_count = 1
        
        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                if field in ['attendees', 'recurrence_rule', 'metadata']:
                    # JSON fields need special handling
                    updates.append(f"{field} = ${param_count}")
                    params.append(json.dumps(value) if value else None)
                else:
                    updates.append(f"{field} = ${param_count}")
                    params.append(value)
                param_count += 1
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add timestamp and conditions
        updates.append(f"updated_at = NOW()")
        params.extend([uuid.UUID(current_user["user_id"]), uuid.UUID(event_id)])
        
        query = f"""
            UPDATE calendar_events 
            SET {', '.join(updates)}
            WHERE user_id = ${param_count} AND id = ${param_count + 1}
            RETURNING *
        """
        
        result = await core_api_service.database.execute(
            query, *params, fetch_one=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Calendar event not found")
            
        return CalendarEvent(**result)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")
    except Exception as e:
        logger.error(f"Error updating calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}", response_model=APIResponse)
async def delete_calendar_event(
    event_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Delete calendar event"""
    try:
        result = await core_api_service.database.execute(
            "DELETE FROM calendar_events WHERE user_id = $1 AND id = $2",
            uuid.UUID(current_user["user_id"]), uuid.UUID(event_id)
        )
        
        if "DELETE 0" in str(result):
            raise HTTPException(status_code=404, detail="Calendar event not found")
            
        return APIResponse(
            success=True,
            message="Calendar event deleted successfully"
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")
    except Exception as e:
        logger.error(f"Error deleting calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CONFLICT DETECTION ====================

@router.get("/conflicts")
async def detect_calendar_conflicts(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Detect scheduling conflicts in date range"""
    try:
        # Get events for the date range
        events = await core_api_service.get_calendar_events(
            user_id=current_user["user_id"],
            start_date=start_date,
            end_date=end_date
        )
        
        conflicts = []
        
        # Check each day for conflicts
        current_date = start_date
        while current_date <= end_date:
            # Get events for this specific day
            day_events = [
                e for e in events 
                if e.start_time.date() == current_date
            ]
            
            # Detect conflicts for this day
            for i, event1 in enumerate(day_events):
                for event2 in day_events[i+1:]:
                    conflict_events = await core_api_service.detect_calendar_conflicts(
                        user_id=current_user["user_id"],
                        start_time=event1.start_time,
                        end_time=event1.end_time
                    )
                    
                    if conflict_events:
                        conflicts.extend([
                            {
                                "date": current_date.isoformat(),
                                "conflict_type": "time_overlap",
                                "event1": {
                                    "id": str(event1.id),
                                    "title": event1.title,
                                    "start_time": event1.start_time.isoformat(),
                                    "end_time": event1.end_time.isoformat()
                                },
                                "event2": {
                                    "id": str(conflict.id),
                                    "title": conflict.title,
                                    "start_time": conflict.start_time.isoformat(),
                                    "end_time": conflict.end_time.isoformat()
                                },
                                "severity": "high"
                            }
                            for conflict in conflict_events
                        ])
            
            current_date = current_date.replace(day=current_date.day + 1) if current_date.day < 28 else current_date.replace(month=current_date.month + 1, day=1) if current_date.month < 12 else current_date.replace(year=current_date.year + 1, month=1, day=1)
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "total_conflicts": len(conflicts),
            "conflicts": conflicts
        }
        
    except Exception as e:
        logger.error(f"Error detecting conflicts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events/{event_id}/check-conflicts")
async def check_event_conflicts(
    event_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Check conflicts for a specific event"""
    try:
        # Get the event
        event = await core_api_service.database.execute(
            "SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2",
            uuid.UUID(event_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not event:
            raise HTTPException(status_code=404, detail="Calendar event not found")
        
        # Check for conflicts
        conflicts = await core_api_service.detect_calendar_conflicts(
            user_id=current_user["user_id"],
            start_time=event['start_time'],
            end_time=event['end_time'],
            exclude_event_id=event_id
        )
        
        return {
            "event_id": event_id,
            "has_conflicts": len(conflicts) > 0,
            "conflict_count": len(conflicts),
            "conflicts": [
                {
                    "id": str(conflict.id),
                    "title": conflict.title,
                    "start_time": conflict.start_time.isoformat(),
                    "end_time": conflict.end_time.isoformat(),
                    "event_type": conflict.event_type
                }
                for conflict in conflicts
            ]
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")
    except Exception as e:
        logger.error(f"Error checking event conflicts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PRODUCTIVITY TRACKING ====================

@router.post("/productivity-tracking", response_model=ProductivityTracking)
async def create_productivity_tracking(
    tracking_data: ProductivityTrackingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Record productivity tracking data"""
    try:
        data = tracking_data.dict()
        data['user_id'] = uuid.UUID(current_user["user_id"])
        data['id'] = uuid.uuid4()
        
        result = await core_api_service.database.execute(
            """
            INSERT INTO calendar_productivity_tracking 
            (id, user_id, event_id, date, productivity_score, energy_level, 
             focus_quality, completion_status, notes, time_block_effectiveness)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            """,
            data['id'], data['user_id'], data.get('event_id'),
            data['date'], data.get('productivity_score'), data.get('energy_level'),
            data.get('focus_quality'), data.get('completion_status'),
            data.get('notes'), data.get('time_block_effectiveness'),
            fetch_one=True
        )
        
        return ProductivityTracking(**result)
    except Exception as e:
        logger.error(f"Error creating productivity tracking: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/productivity-tracking")
async def get_productivity_tracking(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Get productivity tracking data for date range"""
    try:
        tracking_data = await core_api_service.database.execute(
            """
            SELECT pt.*, ce.title as event_title, ce.event_type, ce.productivity_category
            FROM calendar_productivity_tracking pt
            LEFT JOIN calendar_events ce ON pt.event_id = ce.id
            WHERE pt.user_id = $1 AND pt.date BETWEEN $2 AND $3
            ORDER BY pt.date DESC
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch=True
        )
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "entries": [
                {
                    **dict(entry),
                    "event_title": entry.get('event_title'),
                    "event_type": entry.get('event_type'),
                    "productivity_category": entry.get('productivity_category')
                }
                for entry in tracking_data
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching productivity tracking: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CALENDAR OPTIMIZATION ====================

@router.post("/optimize", response_model=CalendarOptimizationResponse)
async def optimize_schedule(
    target_date: date,
    preferences: Optional[dict] = None,
    current_user: dict = Depends(get_current_user)
):
    """Optimize schedule for a specific date using Calendar Intelligence"""
    try:
        optimization = await calendar_optimizer_service.optimize_schedule(
            user_id=current_user["user_id"],
            target_date=target_date,
            preferences=preferences or {}
        )
        return optimization
    except Exception as e:
        logger.error(f"Error optimizing schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weekly-analysis")
async def get_weekly_analysis(
    start_date: date = Query(..., description="Start date of the week (Monday)"),
    current_user: dict = Depends(get_current_user)
):
    """Get weekly scheduling pattern analysis"""
    try:
        analysis = await calendar_optimizer_service.analyze_week_patterns(
            user_id=current_user["user_id"],
            start_date=start_date
        )
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing weekly patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/focus-time")
async def get_available_focus_time(
    target_date: date = Query(...),
    min_duration_minutes: int = Query(90, description="Minimum focus block duration"),
    current_user: dict = Depends(get_current_user)
):
    """Find available focus time blocks for a date"""
    try:
        # Get events for the date
        events = await core_api_service.get_calendar_events(
            user_id=current_user["user_id"],
            start_date=target_date,
            end_date=target_date
        )
        
        # Define work day boundaries
        work_start = datetime.combine(target_date, datetime.min.time().replace(hour=8))
        work_end = datetime.combine(target_date, datetime.min.time().replace(hour=18))
        
        # Find gaps between events
        available_slots = []
        current_time = work_start
        
        # Sort events by start time
        sorted_events = sorted(events, key=lambda x: x.start_time)
        
        for event in sorted_events:
            if current_time < event.start_time:
                gap_duration = (event.start_time - current_time).total_seconds() / 60
                if gap_duration >= min_duration_minutes:
                    available_slots.append({
                        "start_time": current_time.isoformat(),
                        "end_time": event.start_time.isoformat(),
                        "duration_minutes": gap_duration,
                        "type": "available_focus_time"
                    })
            current_time = max(current_time, event.end_time)
        
        # Check time after last event
        if current_time < work_end:
            gap_duration = (work_end - current_time).total_seconds() / 60
            if gap_duration >= min_duration_minutes:
                available_slots.append({
                    "start_time": current_time.isoformat(),
                    "end_time": work_end.isoformat(),
                    "duration_minutes": gap_duration,
                    "type": "available_focus_time"
                })
        
        return {
            "date": target_date.isoformat(),
            "min_duration_minutes": min_duration_minutes,
            "total_available_slots": len(available_slots),
            "total_available_minutes": sum(slot["duration_minutes"] for slot in available_slots),
            "available_slots": available_slots
        }
        
    except Exception as e:
        logger.error(f"Error finding focus time: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CALENDAR ANALYTICS ====================

@router.get("/analytics/summary")
async def get_calendar_analytics_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get calendar and productivity analytics summary"""
    try:
        from datetime import timedelta
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get calendar statistics
        calendar_stats = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_events,
                AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as avg_duration_hours,
                COUNT(*) FILTER (WHERE event_type = 'meeting') as meeting_count,
                COUNT(*) FILTER (WHERE productivity_category = 'deep_work') as focus_sessions,
                COUNT(DISTINCT DATE(start_time)) as active_days
            FROM calendar_events 
            WHERE user_id = $1 AND DATE(start_time) BETWEEN $2 AND $3
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch_one=True
        )
        
        # Get productivity statistics
        productivity_stats = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as tracked_days,
                AVG(productivity_score) as avg_productivity,
                AVG(energy_level) as avg_energy,
                AVG(focus_quality) as avg_focus,
                AVG(time_block_effectiveness) as avg_effectiveness
            FROM calendar_productivity_tracking 
            WHERE user_id = $1 AND date BETWEEN $2 AND $3
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch_one=True
        )
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "calendar_metrics": {
                "total_events": calendar_stats['total_events'],
                "avg_event_duration_hours": float(calendar_stats['avg_duration_hours']) if calendar_stats['avg_duration_hours'] else 0,
                "meeting_count": calendar_stats['meeting_count'],
                "focus_sessions": calendar_stats['focus_sessions'],
                "active_days": calendar_stats['active_days'],
                "events_per_day": calendar_stats['total_events'] / max(1, calendar_stats['active_days'])
            },
            "productivity_metrics": {
                "tracked_days": productivity_stats['tracked_days'],
                "avg_productivity_score": float(productivity_stats['avg_productivity']) if productivity_stats['avg_productivity'] else 0,
                "avg_energy_level": float(productivity_stats['avg_energy']) if productivity_stats['avg_energy'] else 0,
                "avg_focus_quality": float(productivity_stats['avg_focus']) if productivity_stats['avg_focus'] else 0,
                "avg_time_block_effectiveness": float(productivity_stats['avg_effectiveness']) if productivity_stats['avg_effectiveness'] else 0
            }
        }
    except Exception as e:
        logger.error(f"Error generating calendar analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/productivity-patterns")
async def get_productivity_patterns(
    days: int = Query(60, ge=14, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Analyze productivity patterns over time"""
    try:
        from datetime import timedelta
        from collections import defaultdict
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get productivity data with calendar context
        productivity_data = await core_api_service.database.execute(
            """
            SELECT 
                pt.date,
                pt.productivity_score,
                pt.energy_level,
                pt.focus_quality,
                ce.start_time,
                ce.event_type,
                ce.productivity_category
            FROM calendar_productivity_tracking pt
            LEFT JOIN calendar_events ce ON pt.event_id = ce.id
            WHERE pt.user_id = $1 AND pt.date BETWEEN $2 AND $3
            ORDER BY pt.date
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch=True
        )
        
        # Analyze patterns
        daily_patterns = defaultdict(list)
        hourly_patterns = defaultdict(list)
        category_patterns = defaultdict(list)
        
        for entry in productivity_data:
            # Daily patterns
            weekday = entry['date'].strftime('%A')
            if entry['productivity_score']:
                daily_patterns[weekday].append(entry['productivity_score'])
            
            # Hourly patterns
            if entry['start_time'] and entry['productivity_score']:
                hour = entry['start_time'].hour
                hourly_patterns[hour].append(entry['productivity_score'])
            
            # Category patterns
            if entry['productivity_category'] and entry['productivity_score']:
                category_patterns[entry['productivity_category']].append(entry['productivity_score'])
        
        # Calculate averages
        daily_averages = {day: statistics.mean(scores) for day, scores in daily_patterns.items() if scores}
        hourly_averages = {hour: statistics.mean(scores) for hour, scores in hourly_patterns.items() if scores}
        category_averages = {cat: statistics.mean(scores) for cat, scores in category_patterns.items() if scores}
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "data_points": len(productivity_data),
            "patterns": {
                "daily_productivity": daily_averages,
                "hourly_productivity": hourly_averages,
                "category_productivity": category_averages,
                "peak_day": max(daily_averages.items(), key=lambda x: x[1]) if daily_averages else None,
                "peak_hour": max(hourly_averages.items(), key=lambda x: x[1]) if hourly_averages else None,
                "best_category": max(category_averages.items(), key=lambda x: x[1]) if category_averages else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing productivity patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))