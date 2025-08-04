# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/api/endpoints/routines.py
# Routine & habit tracking APIs for Routine Intelligence Hub
# Direct API endpoints with future MCP compatibility
# RELEVANT FILES: services/core_apis.py, services/intelligence/routine_coach.py, models/schemas.py

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import date, datetime
import uuid
import logging
import json

from app.models.schemas import (
    # Routine models
    Routine, RoutineCreate, RoutineUpdate,
    RoutineCompletion, RoutineCompletionCreate,
    # Response models
    APIResponse, RoutineCoachingResponse
)
from app.services.core_apis import core_api_service
from app.services.intelligence.routine_coach import routine_coaching_service
from app.middleware.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== ROUTINE ENDPOINTS ====================

@router.post("/routines", response_model=Routine)
async def create_routine(
    routine_data: RoutineCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new routine for Routine Intelligence Hub"""
    try:
        routine = await core_api_service.create_routine(
            user_id=current_user["user_id"],
            routine_data=routine_data
        )
        return routine
    except Exception as e:
        logger.error(f"Error creating routine: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines", response_model=List[Routine])
async def get_routines(
    active_only: bool = Query(True),
    routine_type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get user routines"""
    try:
        routines = await core_api_service.get_routines(
            user_id=current_user["user_id"],
            active_only=active_only
        )
        
        # Apply type filter
        if routine_type:
            routines = [r for r in routines if r.routine_type == routine_type]
        
        return routines
    except Exception as e:
        logger.error(f"Error fetching routines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines/{routine_id}", response_model=Routine)
async def get_routine(
    routine_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get specific routine by ID"""
    try:
        routine = await core_api_service.database.execute(
            "SELECT * FROM user_routines WHERE id = $1 AND user_id = $2",
            uuid.UUID(routine_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
            
        return Routine(**routine)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error fetching routine: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/routines/{routine_id}", response_model=Routine)
async def update_routine(
    routine_id: str = Path(...),
    update_data: RoutineUpdate = ...,
    current_user: dict = Depends(get_current_user)
):
    """Update routine"""
    try:
        # Build dynamic UPDATE query
        updates = []
        params = []
        param_count = 1
        
        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                if field in ['habits', 'frequency', 'time_slots']:
                    # JSON fields need special handling
                    updates.append(f"{field} = ${param_count}")
                    params.append(json.dumps(value))
                else:
                    updates.append(f"{field} = ${param_count}")
                    params.append(value)
                param_count += 1
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add timestamp and conditions
        updates.append(f"updated_at = NOW()")
        params.extend([uuid.UUID(current_user["user_id"]), uuid.UUID(routine_id)])
        
        query = f"""
            UPDATE user_routines 
            SET {', '.join(updates)}
            WHERE user_id = ${param_count} AND id = ${param_count + 1}
            RETURNING *
        """
        
        result = await core_api_service.database.execute(
            query, *params, fetch_one=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Routine not found")
            
        return Routine(**result)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error updating routine: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/routines/{routine_id}", response_model=APIResponse)
async def delete_routine(
    routine_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Delete routine (soft delete by setting is_active = false)"""
    try:
        result = await core_api_service.database.execute(
            "UPDATE user_routines SET is_active = false, updated_at = NOW() WHERE user_id = $1 AND id = $2",
            uuid.UUID(current_user["user_id"]), uuid.UUID(routine_id)
        )
        
        if "UPDATE 0" in str(result):
            raise HTTPException(status_code=404, detail="Routine not found")
            
        return APIResponse(
            success=True,
            message="Routine deactivated successfully"
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error deleting routine: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROUTINE COMPLETION ENDPOINTS ====================

@router.post("/routines/{routine_id}/completions", response_model=RoutineCompletion)
async def record_routine_completion(
    completion_data: RoutineCompletionCreate,
    routine_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Record routine completion"""
    try:
        # Verify routine exists and belongs to user
        routine = await core_api_service.database.execute(
            "SELECT * FROM user_routines WHERE id = $1 AND user_id = $2 AND is_active = true",
            uuid.UUID(routine_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found or inactive")
        
        # Set the routine_id from path parameter
        completion_data.routine_id = uuid.UUID(routine_id)
        
        completion = await core_api_service.record_routine_completion(
            user_id=current_user["user_id"],
            completion_data=completion_data
        )
        return completion
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error recording routine completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines/{routine_id}/completions")
async def get_routine_completions(
    routine_id: str = Path(...),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get routine completion history"""
    try:
        # Build query with optional date filters
        query = """
            SELECT * FROM daily_routine_completions 
            WHERE user_id = $1 AND routine_id = $2
        """
        params = [uuid.UUID(current_user["user_id"]), uuid.UUID(routine_id)]
        param_count = 3
        
        if start_date:
            query += f" AND completion_date >= ${param_count}"
            params.append(start_date)
            param_count += 1
            
        if end_date:
            query += f" AND completion_date <= ${param_count}"
            params.append(end_date)
            param_count += 1
        
        query += f" ORDER BY completion_date DESC LIMIT {limit}"
        
        completions = await core_api_service.database.execute(
            query, *params, fetch=True
        )
        
        return {
            "routine_id": routine_id,
            "total_completions": len(completions),
            "completions": [
                {
                    **dict(completion),
                    "habits_completed": completion.get('habits_completed', [])
                }
                for completion in completions
            ]
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error fetching routine completions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines/{routine_id}/streak")
async def get_routine_streak(
    routine_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get current streak for routine"""
    try:
        streak_info = await core_api_service.get_routine_streak(
            user_id=current_user["user_id"],
            routine_id=routine_id
        )
        
        # Get additional streak statistics
        streak_history = await core_api_service.database.execute(
            """
            SELECT 
                completion_date,
                completion_percentage,
                quality_rating
            FROM daily_routine_completions 
            WHERE user_id = $1 AND routine_id = $2 
            AND completion_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY completion_date DESC
            """,
            uuid.UUID(current_user["user_id"]), uuid.UUID(routine_id),
            fetch=True
        )
        
        # Calculate streak quality
        recent_quality = [c['quality_rating'] for c in streak_history if c.get('quality_rating')]
        avg_quality = sum(recent_quality) / len(recent_quality) if recent_quality else 0
        
        return {
            "routine_id": routine_id,
            "current_streak": streak_info["current_streak"],
            "longest_streak": streak_info["longest_streak"],
            "recent_completions": len(streak_history),
            "avg_quality_30d": avg_quality,
            "streak_quality": "excellent" if streak_info["current_streak"] >= 21 else "good" if streak_info["current_streak"] >= 7 else "building"
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error fetching routine streak: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROUTINE INTELLIGENCE & COACHING ====================

@router.get("/routines/{routine_id}/coaching", response_model=RoutineCoachingResponse)
async def get_routine_coaching(
    routine_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get AI coaching insights for routine from intelligence service"""
    try:
        coaching_insights = await routine_coaching_service.get_coaching_insights(
            user_id=current_user["user_id"],
            routine_id=routine_id
        )
        return coaching_insights
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error getting routine coaching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/routines/{routine_id}/coaching/completion", response_model=RoutineCoachingResponse)
async def get_completion_coaching(
    completion_data: dict,
    routine_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get immediate coaching feedback after routine completion"""
    try:
        coaching_insights = await routine_coaching_service.get_coaching_insights(
            user_id=current_user["user_id"],
            routine_id=routine_id,
            recent_completion=completion_data
        )
        return coaching_insights
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error getting completion coaching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ROUTINE ANALYTICS ====================

@router.get("/routines/analytics/summary")
async def get_routine_analytics_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get routine completion analytics summary"""
    try:
        from datetime import timedelta
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get routine statistics
        routine_stats = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(DISTINCT ur.id) as total_routines,
                COUNT(DISTINCT ur.id) FILTER (WHERE ur.is_active = true) as active_routines,
                COUNT(drc.id) as total_completions,
                AVG(drc.completion_percentage) as avg_completion_percentage,
                AVG(drc.quality_rating) as avg_quality_rating,
                COUNT(DISTINCT drc.completion_date) as active_days
            FROM user_routines ur
            LEFT JOIN daily_routine_completions drc ON ur.id = drc.routine_id 
                AND drc.completion_date BETWEEN $2 AND $3
            WHERE ur.user_id = $1
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch_one=True
        )
        
        # Get streak information for active routines
        active_routines = await core_api_service.database.execute(
            "SELECT id FROM user_routines WHERE user_id = $1 AND is_active = true",
            uuid.UUID(current_user["user_id"]),
            fetch=True
        )
        
        total_current_streak = 0
        routines_with_streaks = 0
        
        for routine in active_routines:
            streak = await core_api_service.database.execute(
                "SELECT calculate_routine_streak($1, $2) as streak",
                uuid.UUID(current_user["user_id"]), routine['id'],
                fetch_val=True
            )
            if streak and streak > 0:
                total_current_streak += streak
                routines_with_streaks += 1
        
        avg_streak = total_current_streak / max(1, routines_with_streaks)
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "summary": {
                "total_routines": routine_stats['total_routines'],
                "active_routines": routine_stats['active_routines'],
                "total_completions": routine_stats['total_completions'],
                "active_days": routine_stats['active_days'],
                "avg_completion_percentage": float(routine_stats['avg_completion_percentage']) if routine_stats['avg_completion_percentage'] else 0,
                "avg_quality_rating": float(routine_stats['avg_quality_rating']) if routine_stats['avg_quality_rating'] else 0,
                "avg_current_streak": avg_streak,
                "consistency_score": routine_stats['active_days'] / days if routine_stats['active_days'] else 0
            }
        }
    except Exception as e:
        logger.error(f"Error generating routine analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines/analytics/patterns")
async def get_routine_patterns(
    days: int = Query(60, ge=14, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Analyze routine completion patterns"""
    try:
        from datetime import timedelta
        from collections import defaultdict
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get completion data with routine context
        completion_data = await core_api_service.database.execute(
            """
            SELECT 
                drc.*,
                ur.name as routine_name,
                ur.routine_type
            FROM daily_routine_completions drc
            JOIN user_routines ur ON drc.routine_id = ur.id
            WHERE drc.user_id = $1 AND drc.completion_date BETWEEN $2 AND $3
            ORDER BY drc.completion_date
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch=True
        )
        
        # Analyze patterns
        daily_patterns = defaultdict(list)
        routine_performance = defaultdict(list)
        mood_patterns = []
        
        for entry in completion_data:
            # Daily patterns
            weekday = entry['completion_date'].strftime('%A')
            daily_patterns[weekday].append(entry['completion_percentage'])
            
            # Routine performance
            routine_performance[entry['routine_name']].append(entry['completion_percentage'])
            
            # Mood patterns
            if entry.get('mood_before') and entry.get('mood_after'):
                mood_patterns.append({
                    'mood_improvement': entry['mood_after'] - entry['mood_before'],
                    'completion_percentage': entry['completion_percentage']
                })
        
        # Calculate averages and insights
        daily_averages = {day: sum(scores)/len(scores) for day, scores in daily_patterns.items() if scores}
        routine_averages = {routine: sum(scores)/len(scores) for routine, scores in routine_performance.items() if scores}
        
        # Mood impact analysis
        avg_mood_improvement = sum(p['mood_improvement'] for p in mood_patterns) / len(mood_patterns) if mood_patterns else 0
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "data_points": len(completion_data),
            "patterns": {
                "daily_completion_rates": daily_averages,
                "routine_performance": routine_averages,
                "best_day": max(daily_averages.items(), key=lambda x: x[1]) if daily_averages else None,
                "best_routine": max(routine_averages.items(), key=lambda x: x[1]) if routine_averages else None,
                "avg_mood_improvement": avg_mood_improvement,
                "mood_correlation": "positive" if avg_mood_improvement > 0.5 else "neutral"
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing routine patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines/{routine_id}/analytics")
async def get_routine_specific_analytics(
    routine_id: str = Path(...),
    days: int = Query(30, ge=7, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed analytics for a specific routine"""
    try:
        from datetime import timedelta
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get routine details
        routine = await core_api_service.database.execute(
            "SELECT * FROM user_routines WHERE id = $1 AND user_id = $2",
            uuid.UUID(routine_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
        
        # Get completion history
        completions = await core_api_service.database.execute(
            """
            SELECT * FROM daily_routine_completions 
            WHERE user_id = $1 AND routine_id = $2 
            AND completion_date BETWEEN $3 AND $4
            ORDER BY completion_date DESC
            """,
            uuid.UUID(current_user["user_id"]), uuid.UUID(routine_id), start_date, end_date,
            fetch=True
        )
        
        # Calculate analytics
        total_days = (end_date - start_date).days + 1
        completion_days = len(completions)
        consistency_rate = completion_days / total_days
        
        avg_completion = sum(c['completion_percentage'] for c in completions) / len(completions) if completions else 0
        avg_quality = sum(c.get('quality_rating', 0) for c in completions if c.get('quality_rating')) / len([c for c in completions if c.get('quality_rating')]) if completions else 0
        
        # Get current streak
        streak_info = await core_api_service.get_routine_streak(
            user_id=current_user["user_id"],
            routine_id=routine_id
        )
        
        # Habit analysis
        all_habits = routine.get('habits', [])
        habit_completion_rates = {}
        
        for habit in all_habits:
            habit_id = habit.get('id', habit.get('name', ''))
            completed_count = sum(
                1 for c in completions 
                if habit_id in c.get('habits_completed', [])
            )
            habit_completion_rates[habit.get('name', habit_id)] = completed_count / len(completions) if completions else 0
        
        return {
            "routine": {
                "id": routine_id,
                "name": routine['name'],
                "type": routine['routine_type'],
                "difficulty_level": routine.get('difficulty_level', 5)
            },
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "analytics": {
                "total_possible_days": total_days,
                "completion_days": completion_days,
                "consistency_rate": consistency_rate,
                "avg_completion_percentage": avg_completion,
                "avg_quality_rating": avg_quality,
                "current_streak": streak_info["current_streak"],
                "longest_streak": streak_info["longest_streak"]
            },
            "habit_performance": habit_completion_rates,
            "recent_completions": [
                {
                    "date": c['completion_date'].isoformat(),
                    "completion_percentage": c['completion_percentage'],
                    "quality_rating": c.get('quality_rating'),
                    "habits_completed": c.get('habits_completed', [])
                }
                for c in completions[:7]  # Last 7 completions
            ]
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid routine ID format")
    except Exception as e:
        logger.error(f"Error generating routine analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BULK OPERATIONS ====================

@router.post("/routines/bulk-update-completion")
async def bulk_update_routine_completion(
    date_to_update: date,
    routine_completions: List[dict],
    current_user: dict = Depends(get_current_user)
):
    """Bulk update routine completions for a specific date"""
    try:
        updated_count = 0
        
        for completion_update in routine_completions:
            routine_id = completion_update.get('routine_id')
            if not routine_id:
                continue
                
            try:
                # Create completion data
                completion_data = RoutineCompletionCreate(
                    routine_id=uuid.UUID(routine_id),
                    completion_date=date_to_update,
                    habits_completed=completion_update.get('habits_completed', []),
                    completion_percentage=completion_update.get('completion_percentage', 0),
                    quality_rating=completion_update.get('quality_rating'),
                    notes=completion_update.get('notes'),
                    mood_before=completion_update.get('mood_before'),
                    mood_after=completion_update.get('mood_after'),
                    energy_level=completion_update.get('energy_level')
                )
                
                await core_api_service.record_routine_completion(
                    user_id=current_user["user_id"],
                    completion_data=completion_data
                )
                updated_count += 1
                
            except Exception as e:
                logger.warning(f"Failed to update routine {routine_id}: {e}")
                continue
        
        return APIResponse(
            success=True,
            message=f"Updated {updated_count} out of {len(routine_completions)} routine completions",
            data={
                "updated_count": updated_count,
                "total_requested": len(routine_completions),
                "date": date_to_update.isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Error in bulk routine update: {e}")
        raise HTTPException(status_code=500, detail=str(e))