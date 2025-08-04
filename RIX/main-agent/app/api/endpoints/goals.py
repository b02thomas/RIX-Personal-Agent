# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/api/endpoints/goals.py
# Goal tracking & progress APIs for Goal Intelligence Hub
# Direct API endpoints with future MCP compatibility
# RELEVANT FILES: services/core_apis.py, models/schemas.py, core/database.py

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import date, datetime
import uuid
import logging
import json

from app.models.schemas import (
    # Goal models
    Goal, GoalCreate, GoalUpdate,
    GoalProgress, GoalProgressCreate,
    # Response models
    APIResponse, PaginatedResponse, PaginationParams
)
from app.services.core_apis import core_api_service
from app.middleware.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== GOAL ENDPOINTS ====================

@router.post("/goals", response_model=Goal)
async def create_goal(
    goal_data: GoalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new goal for Goal Intelligence Hub"""
    try:
        goal = await core_api_service.create_goal(
            user_id=current_user["user_id"],
            goal_data=goal_data
        )
        return goal
    except Exception as e:
        logger.error(f"Error creating goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals", response_model=List[Goal])
async def get_goals(
    status: Optional[str] = Query(None),
    goal_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get user goals with optional filters"""
    try:
        goals = await core_api_service.get_goals(
            user_id=current_user["user_id"],
            status=status
        )
        
        # Apply additional filters
        if goal_type:
            goals = [g for g in goals if g.goal_type == goal_type]
            
        if category:
            goals = [g for g in goals if g.category == category]
        
        return goals
    except Exception as e:
        logger.error(f"Error fetching goals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals/{goal_id}", response_model=Goal)
async def get_goal(
    goal_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get specific goal by ID"""
    try:
        goal = await core_api_service.database.execute(
            "SELECT * FROM user_goals WHERE id = $1 AND user_id = $2",
            uuid.UUID(goal_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        return Goal(**goal)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error fetching goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/goals/{goal_id}", response_model=Goal)
async def update_goal(
    goal_id: str = Path(...),
    update_data: GoalUpdate = ...,
    current_user: dict = Depends(get_current_user)
):
    """Update goal"""
    try:
        # Build dynamic UPDATE query
        updates = []
        params = []
        param_count = 1
        
        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                if field == 'ai_insights':
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
        params.extend([uuid.UUID(current_user["user_id"]), uuid.UUID(goal_id)])
        
        query = f"""
            UPDATE user_goals 
            SET {', '.join(updates)}
            WHERE user_id = ${param_count} AND id = ${param_count + 1}
            RETURNING *
        """
        
        result = await core_api_service.database.execute(
            query, *params, fetch_one=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        return Goal(**result)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error updating goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/goals/{goal_id}", response_model=APIResponse)
async def delete_goal(
    goal_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Delete goal"""
    try:
        result = await core_api_service.database.execute(
            "DELETE FROM user_goals WHERE user_id = $1 AND id = $2",
            uuid.UUID(current_user["user_id"]), uuid.UUID(goal_id)
        )
        
        if "DELETE 0" in str(result):
            raise HTTPException(status_code=404, detail="Goal not found")
            
        return APIResponse(
            success=True,
            message="Goal deleted successfully"
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error deleting goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GOAL PROGRESS ENDPOINTS ====================

@router.post("/goals/{goal_id}/progress", response_model=GoalProgress)
async def record_goal_progress(
    progress_data: GoalProgressCreate,
    goal_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Record progress for a goal"""
    try:
        # Verify goal exists and belongs to user
        goal = await core_api_service.database.execute(
            "SELECT * FROM user_goals WHERE id = $1 AND user_id = $2",
            uuid.UUID(goal_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Set the goal_id from path parameter
        progress_data.goal_id = uuid.UUID(goal_id)
        
        progress = await core_api_service.record_goal_progress(
            user_id=current_user["user_id"],
            progress_data=progress_data
        )
        return progress
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error recording goal progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals/{goal_id}/progress")
async def get_goal_progress(
    goal_id: str = Path(...),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """Get progress history for a goal"""
    try:
        # Verify goal exists
        goal = await core_api_service.database.execute(
            "SELECT * FROM user_goals WHERE id = $1 AND user_id = $2",
            uuid.UUID(goal_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Build query with optional date filters
        query = """
            SELECT * FROM goal_progress_entries 
            WHERE user_id = $1 AND goal_id = $2
        """
        params = [uuid.UUID(current_user["user_id"]), uuid.UUID(goal_id)]
        param_count = 3
        
        if start_date:
            query += f" AND DATE(recorded_at) >= ${param_count}"
            params.append(start_date)
            param_count += 1
            
        if end_date:
            query += f" AND DATE(recorded_at) <= ${param_count}"
            params.append(end_date)
            param_count += 1
        
        query += f" ORDER BY recorded_at DESC LIMIT {limit}"
        
        progress_entries = await core_api_service.database.execute(
            query, *params, fetch=True
        )
        
        # Calculate progress statistics
        if progress_entries:
            latest_progress = progress_entries[0]['progress_value']
            total_entries = len(progress_entries)
            avg_confidence = sum(p.get('confidence_level', 0) for p in progress_entries if p.get('confidence_level')) / total_entries
            
            # Calculate progress velocity (change over time)
            if len(progress_entries) >= 2:
                first_entry = progress_entries[-1]
                last_entry = progress_entries[0]
                time_diff = (last_entry['recorded_at'] - first_entry['recorded_at']).days
                progress_diff = last_entry['progress_value'] - first_entry['progress_value']
                velocity = progress_diff / max(1, time_diff)  # progress per day
            else:
                velocity = 0
        else:
            latest_progress = goal['current_value']
            total_entries = 0
            avg_confidence = 0
            velocity = 0
        
        return {
            "goal_id": goal_id,
            "goal_title": goal['title'],
            "target_value": goal.get('target_value'),
            "current_value": goal['current_value'],
            "latest_progress": latest_progress,
            "total_entries": total_entries,
            "avg_confidence": avg_confidence,
            "progress_velocity_per_day": velocity,
            "progress_entries": [
                {
                    **dict(entry),
                    "recorded_at": entry['recorded_at'].isoformat()
                }
                for entry in progress_entries
            ]
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error fetching goal progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals/{goal_id}/milestones")
async def get_goal_milestones(
    goal_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get milestones for a goal"""
    try:
        # Verify goal exists
        goal = await core_api_service.database.execute(
            "SELECT * FROM user_goals WHERE id = $1 AND user_id = $2",
            uuid.UUID(goal_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        milestones = await core_api_service.database.execute(
            """
            SELECT * FROM goal_milestones 
            WHERE goal_id = $1
            ORDER BY target_value ASC
            """,
            uuid.UUID(goal_id),
            fetch=True
        )
        
        return {
            "goal_id": goal_id,
            "goal_title": goal['title'],
            "current_value": goal['current_value'],
            "target_value": goal.get('target_value'),
            "total_milestones": len(milestones),
            "completed_milestones": len([m for m in milestones if m['is_completed']]),
            "milestones": [
                {
                    **dict(milestone),
                    "is_reached": goal['current_value'] >= milestone['target_value'],
                    "completed_at": milestone['completed_at'].isoformat() if milestone['completed_at'] else None
                }
                for milestone in milestones
            ]
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error fetching goal milestones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/goals/{goal_id}/milestones")
async def create_goal_milestone(
    milestone_data: dict,
    goal_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a milestone for a goal"""
    try:
        # Verify goal exists
        goal = await core_api_service.database.execute(
            "SELECT * FROM user_goals WHERE id = $1 AND user_id = $2",
            uuid.UUID(goal_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        milestone = await core_api_service.database.execute(
            """
            INSERT INTO goal_milestones 
            (id, goal_id, title, description, target_value, target_date, reward)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            """,
            uuid.uuid4(), uuid.UUID(goal_id),
            milestone_data.get('title'), milestone_data.get('description'),
            milestone_data.get('target_value'), milestone_data.get('target_date'),
            milestone_data.get('reward'),
            fetch_one=True
        )
        
        return {
            **dict(milestone),
            "created_at": milestone['created_at'].isoformat()
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error creating goal milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GOAL ANALYTICS ====================

@router.get("/analytics/summary")
async def get_goal_analytics_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get goal tracking analytics summary"""
    try:
        # Get goal statistics
        goal_stats = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_goals,
                COUNT(*) FILTER (WHERE status = 'active') as active_goals,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
                COUNT(*) FILTER (WHERE status = 'paused') as paused_goals,
                AVG(CASE WHEN target_value > 0 THEN current_value / target_value ELSE 0 END) as avg_completion_ratio,
                COUNT(*) FILTER (WHERE target_date < CURRENT_DATE AND status != 'completed') as overdue_goals
            FROM user_goals 
            WHERE user_id = $1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Get goal type breakdown
        type_breakdown = await core_api_service.database.execute(
            """
            SELECT 
                goal_type,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                AVG(CASE WHEN target_value > 0 THEN current_value / target_value ELSE 0 END) as avg_progress
            FROM user_goals 
            WHERE user_id = $1
            GROUP BY goal_type
            ORDER BY count DESC
            """,
            uuid.UUID(current_user["user_id"]),
            fetch=True
        )
        
        # Get recent progress activity
        recent_progress = await core_api_service.database.execute(
            """
            SELECT COUNT(*) as entries_last_30d
            FROM goal_progress_entries 
            WHERE user_id = $1 AND recorded_at >= NOW() - INTERVAL '30 days'
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_val=True
        )
        
        # Get milestone statistics
        milestone_stats = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(gm.*) as total_milestones,
                COUNT(gm.*) FILTER (WHERE gm.is_completed = true) as completed_milestones
            FROM goal_milestones gm
            JOIN user_goals ug ON gm.goal_id = ug.id
            WHERE ug.user_id = $1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        return {
            "summary": {
                "total_goals": goal_stats['total_goals'],
                "active_goals": goal_stats['active_goals'],
                "completed_goals": goal_stats['completed_goals'],
                "paused_goals": goal_stats['paused_goals'],
                "overdue_goals": goal_stats['overdue_goals'],
                "avg_completion_ratio": float(goal_stats['avg_completion_ratio']) if goal_stats['avg_completion_ratio'] else 0,
                "completion_rate": goal_stats['completed_goals'] / max(1, goal_stats['total_goals']),
                "recent_progress_entries": recent_progress or 0,
                "total_milestones": milestone_stats['total_milestones'] or 0,
                "completed_milestones": milestone_stats['completed_milestones'] or 0
            },
            "type_breakdown": [
                {
                    "goal_type": type_data['goal_type'],
                    "count": type_data['count'],
                    "completed": type_data['completed'],
                    "completion_rate": type_data['completed'] / type_data['count'],
                    "avg_progress": float(type_data['avg_progress']) if type_data['avg_progress'] else 0
                }
                for type_data in type_breakdown
            ]
        }
    except Exception as e:
        logger.error(f"Error generating goal analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/progress-trends")
async def get_goal_progress_trends(
    days: int = Query(90, ge=7, le=365),
    goal_type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Analyze goal progress trends over time"""
    try:
        from datetime import timedelta
        from collections import defaultdict
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Build query with optional goal type filter
        query = """
            SELECT 
                gpe.*,
                ug.title as goal_title,
                ug.goal_type,
                ug.target_value
            FROM goal_progress_entries gpe
            JOIN user_goals ug ON gpe.goal_id = ug.id
            WHERE gpe.user_id = $1 AND DATE(gpe.recorded_at) BETWEEN $2 AND $3
        """
        params = [uuid.UUID(current_user["user_id"]), start_date, end_date]
        
        if goal_type:
            query += " AND ug.goal_type = $4"
            params.append(goal_type)
        
        query += " ORDER BY gpe.recorded_at"
        
        progress_data = await core_api_service.database.execute(
            query, *params, fetch=True
        )
        
        # Analyze trends
        daily_progress = defaultdict(list)
        goal_velocity = defaultdict(list)
        confidence_trends = defaultdict(list)
        
        for entry in progress_data:
            entry_date = entry['recorded_at'].date()
            daily_progress[entry_date].append(entry['progress_value'])
            
            if entry.get('confidence_level'):
                confidence_trends[entry_date].append(entry['confidence_level'])
        
        # Calculate daily averages
        daily_averages = {
            date_key: sum(values) / len(values)
            for date_key, values in daily_progress.items()
        }
        
        confidence_averages = {
            date_key: sum(values) / len(values)
            for date_key, values in confidence_trends.items()
        }
        
        # Calculate overall trend
        if len(daily_averages) >= 2:
            dates = sorted(daily_averages.keys())
            first_week_avg = sum(daily_averages[d] for d in dates[:7]) / min(7, len(dates))
            last_week_avg = sum(daily_averages[d] for d in dates[-7:]) / min(7, len(dates))
            trend_direction = "improving" if last_week_avg > first_week_avg else "declining" if last_week_avg < first_week_avg else "stable"
        else:
            trend_direction = "insufficient_data"
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "goal_type_filter": goal_type,
            "data_points": len(progress_data),
            "trend_analysis": {
                "overall_trend": trend_direction,
                "avg_daily_progress": sum(daily_averages.values()) / len(daily_averages) if daily_averages else 0,
                "avg_confidence": sum(confidence_averages.values()) / len(confidence_averages) if confidence_averages else 0,
                "most_active_day": max(daily_progress.items(), key=lambda x: len(x[1]))[0].isoformat() if daily_progress else None
            },
            "daily_trends": [
                {
                    "date": date_key.isoformat(),
                    "avg_progress": daily_averages.get(date_key, 0),
                    "avg_confidence": confidence_averages.get(date_key, 0),
                    "entries_count": len(daily_progress[date_key])
                }
                for date_key in sorted(daily_progress.keys())
            ]
        }
    except Exception as e:
        logger.error(f"Error analyzing goal progress trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goals/{goal_id}/analytics")
async def get_goal_specific_analytics(
    goal_id: str = Path(...),
    days: int = Query(60, ge=7, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed analytics for a specific goal"""
    try:
        from datetime import timedelta
        
        # Get goal details
        goal = await core_api_service.database.execute(
            "SELECT * FROM user_goals WHERE id = $1 AND user_id = $2",
            uuid.UUID(goal_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get progress history
        progress_history = await core_api_service.database.execute(
            """
            SELECT * FROM goal_progress_entries 
            WHERE user_id = $1 AND goal_id = $2 
            AND DATE(recorded_at) BETWEEN $3 AND $4
            ORDER BY recorded_at
            """,
            uuid.UUID(current_user["user_id"]), uuid.UUID(goal_id), start_date, end_date,
            fetch=True
        )
        
        # Calculate analytics
        total_entries = len(progress_history)
        if total_entries == 0:
            return {
                "goal": {
                    "id": goal_id,
                    "title": goal['title'],
                    "current_value": goal['current_value'],
                    "target_value": goal.get('target_value')
                },
                "analytics": {
                    "total_entries": 0,
                    "message": "No progress entries found for the specified period"
                }
            }
        
        # Progress calculations
        first_entry = progress_history[0]
        last_entry = progress_history[-1]
        total_progress_change = last_entry['progress_value'] - first_entry['progress_value']
        
        # Time calculations
        time_span = (last_entry['recorded_at'] - first_entry['recorded_at']).days
        velocity = total_progress_change / max(1, time_span)  # progress per day
        
        # Confidence and energy analysis
        avg_confidence = sum(e.get('confidence_level', 0) for e in progress_history if e.get('confidence_level')) / total_entries
        avg_energy = sum(e.get('energy_level', 0) for e in progress_history if e.get('energy_level')) / total_entries
        
        # Milestone analysis
        milestones = await core_api_service.database.execute(
            "SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY target_value",
            uuid.UUID(goal_id),
            fetch=True
        )
        
        next_milestone = None
        for milestone in milestones:
            if not milestone['is_completed'] and goal['current_value'] < milestone['target_value']:
                next_milestone = milestone
                break
        
        # Projection to completion
        completion_projection = None
        if goal.get('target_value') and velocity > 0:
            remaining_progress = goal['target_value'] - goal['current_value']
            days_to_completion = remaining_progress / velocity
            projected_completion_date = end_date + timedelta(days=days_to_completion)
            completion_projection = {
                "projected_date": projected_completion_date.isoformat(),
                "days_remaining": int(days_to_completion),
                "confidence": "high" if avg_confidence >= 7 else "medium" if avg_confidence >= 5 else "low"
            }
        
        return {
            "goal": {
                "id": goal_id,
                "title": goal['title'],
                "goal_type": goal['goal_type'],
                "current_value": goal['current_value'],
                "target_value": goal.get('target_value'),
                "status": goal['status'],
                "target_date": goal.get('target_date').isoformat() if goal.get('target_date') else None
            },
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "analytics": {
                "total_entries": total_entries,
                "total_progress_change": total_progress_change,
                "avg_confidence": avg_confidence,
                "avg_energy": avg_energy,
                "velocity_per_day": velocity,
                "completion_percentage": (goal['current_value'] / goal['target_value'] * 100) if goal.get('target_value') else 0
            },
            "milestones": {
                "total": len(milestones),
                "completed": len([m for m in milestones if m['is_completed']]),
                "next_milestone": {
                    "title": next_milestone['title'],
                    "target_value": next_milestone['target_value'],
                    "progress_needed": next_milestone['target_value'] - goal['current_value']
                } if next_milestone else None
            },
            "completion_projection": completion_projection,
            "recent_progress": [
                {
                    "date": entry['recorded_at'].date().isoformat(),
                    "progress_value": entry['progress_value'],
                    "confidence_level": entry.get('confidence_level'),
                    "notes": entry.get('notes')
                }
                for entry in progress_history[-10:]  # Last 10 entries
            ]
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid goal ID format")
    except Exception as e:
        logger.error(f"Error generating goal analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))