# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/api/endpoints/analytics.py
# Behavioral analytics & insights APIs for Behavioral Analytics Engine
# Direct API endpoints with future MCP compatibility
# RELEVANT FILES: services/intelligence/behavioral_analytics.py, models/schemas.py, core/database.py

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import date, datetime
import uuid
import logging

from app.models.schemas import (
    # Analytics models
    BehavioralAnalytics, BehavioralAnalyticsCreate,
    # Response models
    APIResponse, IntelligenceResponse
)
from app.services.intelligence.behavioral_analytics import behavioral_analytics_service
from app.services.core_apis import core_api_service
from app.middleware.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== BEHAVIORAL ANALYTICS ENDPOINTS ====================

@router.post("/generate")
async def generate_behavioral_analysis(
    analysis_period: str = Query("monthly", regex="^(weekly|monthly|quarterly)$"),
    current_user: dict = Depends(get_current_user)
):
    """Generate comprehensive behavioral analysis across all systems"""
    try:
        analysis = await behavioral_analytics_service.generate_comprehensive_analysis(
            user_id=current_user["user_id"],
            analysis_period=analysis_period
        )
        return analysis
    except Exception as e:
        logger.error(f"Error generating behavioral analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/behavioral-analytics")
async def get_behavioral_analytics(
    analysis_type: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get historical behavioral analytics"""
    try:
        analytics = await core_api_service.get_behavioral_analytics(
            user_id=current_user["user_id"],
            analysis_type=analysis_type,
            period=period
        )
        
        # Limit results
        limited_analytics = analytics[:limit]
        
        return {
            "total_analyses": len(analytics),
            "returned_count": len(limited_analytics),
            "analyses": [
                {
                    **analysis.dict(),
                    "created_at": analysis.created_at.isoformat() if analysis.created_at else None
                }
                for analysis in limited_analytics
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching behavioral analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/behavioral-analytics/{analysis_id}")
async def get_behavioral_analysis(
    analysis_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get specific behavioral analysis by ID"""
    try:
        analysis = await core_api_service.database.execute(
            "SELECT * FROM behavioral_analytics WHERE id = $1 AND user_id = $2",
            uuid.UUID(analysis_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Behavioral analysis not found")
            
        return {
            **dict(analysis),
            "created_at": analysis['created_at'].isoformat()
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")
    except Exception as e:
        logger.error(f"Error fetching behavioral analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PRODUCTIVITY CORRELATIONS ====================

@router.get("/productivity-correlations")
async def analyze_productivity_correlations(
    days: int = Query(30, ge=7, le=90),
    current_user: dict = Depends(get_current_user)
):
    """Analyze productivity correlations across different systems"""
    try:
        correlations = await behavioral_analytics_service.analyze_productivity_correlations(
            user_id=current_user["user_id"],
            days=days
        )
        return correlations
    except Exception as e:
        logger.error(f"Error analyzing productivity correlations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CROSS-SYSTEM INSIGHTS ====================

@router.get("/dashboard-insights")
async def get_dashboard_insights(
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive dashboard insights combining all systems"""
    try:
        from datetime import timedelta
        
        # Get dashboard summary from database utility
        dashboard_summary = await core_api_service.database.get_user_dashboard_summary(
            current_user["user_id"]
        )
        
        if not dashboard_summary:
            raise HTTPException(status_code=404, detail="User dashboard data not found")
        
        # Get recent behavioral analytics
        recent_analytics = await core_api_service.database.execute(
            """
            SELECT * FROM behavioral_analytics 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT 1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Get recent activity summary
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        recent_activity = await core_api_service.database.execute(
            """
            SELECT 
                (SELECT COUNT(*) FROM tasks 
                 WHERE user_id = $1 AND completion_date::date BETWEEN $2 AND $3) as tasks_completed,
                (SELECT COUNT(*) FROM daily_routine_completions 
                 WHERE user_id = $1 AND completion_date BETWEEN $2 AND $3) as routines_completed,
                (SELECT COUNT(*) FROM goal_progress_entries 
                 WHERE user_id = $1 AND DATE(recorded_at) BETWEEN $2 AND $3) as goal_updates,
                (SELECT COUNT(*) FROM calendar_events 
                 WHERE user_id = $1 AND DATE(start_time) BETWEEN $2 AND $3) as events_scheduled
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch_one=True
        )
        
        # Calculate engagement score
        total_possible_activities = 7 * 4  # 7 days * 4 activity types
        actual_activities = sum([
            recent_activity['tasks_completed'],
            recent_activity['routines_completed'], 
            recent_activity['goal_updates'],
            min(7, recent_activity['events_scheduled'])  # Cap events at 1 per day
        ])
        engagement_score = min(100, (actual_activities / total_possible_activities) * 100)
        
        # Generate insights
        insights = []
        
        # Task completion insights
        if dashboard_summary['overdue_tasks'] > 0:
            insights.append({
                "type": "attention_needed",
                "category": "tasks",
                "message": f"You have {dashboard_summary['overdue_tasks']} overdue tasks that need attention",
                "action": "Review and prioritize overdue tasks"
            })
        elif dashboard_summary['completed_tasks'] > dashboard_summary['total_tasks'] * 0.8:
            insights.append({
                "type": "positive",
                "category": "tasks", 
                "message": f"Excellent task completion rate: {dashboard_summary['completed_tasks']}/{dashboard_summary['total_tasks']}",
                "action": "Keep up the great work!"
            })
        
        # Project health insights
        if dashboard_summary['avg_project_health'] < 60:
            insights.append({
                "type": "warning",
                "category": "projects",
                "message": f"Average project health is low ({dashboard_summary['avg_project_health']}/100)",
                "action": "Review project timelines and resource allocation"
            })
        
        # Routine consistency insights
        if dashboard_summary['avg_routine_completion'] > 80:
            insights.append({
                "type": "positive",
                "category": "routines",
                "message": f"Strong routine consistency at {dashboard_summary['avg_routine_completion']:.0f}%",
                "action": "Consider adding new habits to leverage this momentum"
            })
        elif dashboard_summary['avg_routine_completion'] < 50:
            insights.append({
                "type": "improvement",
                "category": "routines",
                "message": f"Routine completion could be improved ({dashboard_summary['avg_routine_completion']:.0f}%)",
                "action": "Focus on 1-2 core habits to rebuild consistency"
            })
        
        return {
            "user_id": current_user["user_id"],
            "generated_at": datetime.now().isoformat(),
            "dashboard_summary": dashboard_summary,
            "recent_activity_7d": recent_activity,
            "engagement_score": engagement_score,
            "insights": insights,
            "recent_analysis": {
                "id": str(recent_analytics['id']) if recent_analytics else None,
                "analysis_type": recent_analytics['analysis_type'] if recent_analytics else None,
                "created_at": recent_analytics['created_at'].isoformat() if recent_analytics else None,
                "confidence_score": recent_analytics['confidence_score'] if recent_analytics else None
            } if recent_analytics else None
        }
    except Exception as e:
        logger.error(f"Error generating dashboard insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system-health")
async def get_system_health_overview(
    current_user: dict = Depends(get_current_user)
):
    """Get health overview across all RIX systems"""
    try:
        # Get data from each system
        
        # Task system health
        task_health = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
                COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue_tasks,
                AVG(priority) as avg_priority
            FROM tasks 
            WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Project system health
        project_health = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_projects,
                COUNT(*) FILTER (WHERE status = 'active') as active_projects,
                AVG(ai_health_score) as avg_health_score,
                AVG(completion_percentage) as avg_completion
            FROM projects 
            WHERE user_id = $1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Routine system health
        routine_health = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(DISTINCT ur.id) as total_routines,
                COUNT(DISTINCT drc.routine_id) as active_routines,
                AVG(drc.completion_percentage) as avg_completion_rate
            FROM user_routines ur
            LEFT JOIN daily_routine_completions drc ON ur.id = drc.routine_id 
                AND drc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
            WHERE ur.user_id = $1 AND ur.is_active = true
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Goal system health
        goal_health = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_goals,
                COUNT(*) FILTER (WHERE status = 'active') as active_goals,
                AVG(CASE WHEN target_value > 0 THEN current_value / target_value ELSE 0 END) as avg_progress_ratio
            FROM user_goals 
            WHERE user_id = $1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Knowledge system health
        knowledge_health = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_entries,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_entries,
                AVG(importance_score) as avg_importance
            FROM knowledge_entries 
            WHERE user_id = $1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Calculate system health scores (0-100)
        def calculate_health_score(metrics):
            # This is a simplified scoring algorithm
            # In production, this would be more sophisticated
            base_score = 50
            
            if metrics.get('completion_rate'):
                base_score += metrics['completion_rate'] * 30
            if metrics.get('activity_level'):
                base_score += metrics['activity_level'] * 20
                
            return min(100, max(0, base_score))
        
        # Task system score
        task_completion_rate = task_health['completed_tasks'] / max(1, task_health['total_tasks'])
        task_score = calculate_health_score({
            'completion_rate': task_completion_rate,
            'activity_level': min(1.0, task_health['total_tasks'] / 20)  # Normalize to expected ~20 tasks/month
        })
        
        # Project system score  
        project_score = project_health['avg_health_score'] or 50
        
        # Routine system score
        routine_completion_rate = (routine_health['avg_completion_rate'] or 0) / 100
        routine_score = calculate_health_score({
            'completion_rate': routine_completion_rate,
            'activity_level': min(1.0, routine_health['active_routines'] / max(1, routine_health['total_routines']))
        })
        
        # Goal system score
        goal_progress_rate = goal_health['avg_progress_ratio'] or 0
        goal_score = calculate_health_score({
            'completion_rate': goal_progress_rate,
            'activity_level': goal_health['active_goals'] / max(1, goal_health['total_goals'])
        })
        
        # Knowledge system score
        knowledge_activity = knowledge_health['recent_entries'] / max(1, knowledge_health['total_entries'])
        knowledge_score = calculate_health_score({
            'completion_rate': min(1.0, knowledge_health['total_entries'] / 50),  # Target ~50 entries
            'activity_level': knowledge_activity
        })
        
        # Overall system health
        overall_score = (task_score + project_score + routine_score + goal_score + knowledge_score) / 5
        
        return {
            "overall_health_score": int(overall_score),
            "overall_status": "excellent" if overall_score >= 80 else "good" if overall_score >= 60 else "needs_attention",
            "systems": {
                "tasks": {
                    "health_score": int(task_score),
                    "status": "healthy" if task_score >= 70 else "attention_needed",
                    "metrics": {
                        "total_tasks": task_health['total_tasks'],
                        "completion_rate": task_completion_rate,
                        "overdue_tasks": task_health['overdue_tasks']
                    }
                },
                "projects": {
                    "health_score": int(project_score),
                    "status": "healthy" if project_score >= 70 else "attention_needed", 
                    "metrics": {
                        "total_projects": project_health['total_projects'],
                        "active_projects": project_health['active_projects'],
                        "avg_health_score": float(project_health['avg_health_score']) if project_health['avg_health_score'] else 0
                    }
                },
                "routines": {
                    "health_score": int(routine_score),
                    "status": "healthy" if routine_score >= 70 else "attention_needed",
                    "metrics": {
                        "total_routines": routine_health['total_routines'],
                        "active_routines": routine_health['active_routines'],
                        "avg_completion_rate": float(routine_health['avg_completion_rate']) if routine_health['avg_completion_rate'] else 0
                    }
                },
                "goals": {
                    "health_score": int(goal_score),
                    "status": "healthy" if goal_score >= 70 else "attention_needed",
                    "metrics": {
                        "total_goals": goal_health['total_goals'],
                        "active_goals": goal_health['active_goals'],
                        "avg_progress_ratio": float(goal_health['avg_progress_ratio']) if goal_health['avg_progress_ratio'] else 0
                    }
                },
                "knowledge": {
                    "health_score": int(knowledge_score),
                    "status": "healthy" if knowledge_score >= 70 else "attention_needed",
                    "metrics": {
                        "total_entries": knowledge_health['total_entries'],
                        "recent_entries": knowledge_health['recent_entries'],
                        "avg_importance": float(knowledge_health['avg_importance']) if knowledge_health['avg_importance'] else 0
                    }
                }
            },
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error generating system health overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TREND ANALYSIS ====================

@router.get("/trends/productivity")
async def get_productivity_trends(
    days: int = Query(30, ge=7, le=90),
    current_user: dict = Depends(get_current_user)
):
    """Analyze productivity trends across all systems"""
    try:
        from datetime import timedelta
        from collections import defaultdict
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get daily productivity data
        daily_data = defaultdict(lambda: {
            'tasks_completed': 0,
            'routine_completions': 0,
            'goal_updates': 0,
            'calendar_events': 0,
            'productivity_score': 0,
            'energy_level': 0
        })
        
        # Tasks completed by day
        task_completions = await core_api_service.database.execute(
            """
            SELECT DATE(completion_date) as date, COUNT(*) as count
            FROM tasks 
            WHERE user_id = $1 AND completion_date::date BETWEEN $2 AND $3 AND status = 'completed'
            GROUP BY DATE(completion_date)
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch=True
        )
        
        for completion in task_completions:
            daily_data[completion['date']]['tasks_completed'] = completion['count']
        
        # Routine completions by day
        routine_completions = await core_api_service.database.execute(
            """
            SELECT completion_date, COUNT(*) as count, AVG(completion_percentage) as avg_completion
            FROM daily_routine_completions 
            WHERE user_id = $1 AND completion_date BETWEEN $2 AND $3
            GROUP BY completion_date
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch=True
        )
        
        for completion in routine_completions:
            daily_data[completion['completion_date']]['routine_completions'] = completion['count']
            daily_data[completion['completion_date']]['routine_completion_rate'] = completion['avg_completion']
        
        # Goal updates by day
        goal_updates = await core_api_service.database.execute(
            """
            SELECT DATE(recorded_at) as date, COUNT(*) as count, AVG(confidence_level) as avg_confidence
            FROM goal_progress_entries 
            WHERE user_id = $1 AND DATE(recorded_at) BETWEEN $2 AND $3
            GROUP BY DATE(recorded_at)
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch=True
        )
        
        for update in goal_updates:
            daily_data[update['date']]['goal_updates'] = update['count']
            daily_data[update['date']]['goal_confidence'] = update['avg_confidence']
        
        # Productivity tracking data
        productivity_data = await core_api_service.database.execute(
            """
            SELECT date, AVG(productivity_score) as avg_productivity, AVG(energy_level) as avg_energy
            FROM calendar_productivity_tracking 
            WHERE user_id = $1 AND date BETWEEN $2 AND $3
            GROUP BY date
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch=True
        )
        
        for prod_data in productivity_data:
            daily_data[prod_data['date']]['productivity_score'] = prod_data['avg_productivity']
            daily_data[prod_data['date']]['energy_level'] = prod_data['avg_energy']
        
        # Calculate daily productivity index (composite score)
        for date_key, data in daily_data.items():
            # Normalize and weight different factors
            task_factor = min(10, data['tasks_completed']) / 10 * 25  # Max 25 points
            routine_factor = (data.get('routine_completion_rate', 0) / 100) * 25  # Max 25 points
            goal_factor = min(5, data['goal_updates']) / 5 * 20  # Max 20 points
            productivity_factor = (data['productivity_score'] / 10) * 30 if data['productivity_score'] else 15  # Max 30 points
            
            daily_data[date_key]['productivity_index'] = task_factor + routine_factor + goal_factor + productivity_factor
        
        # Sort data by date
        sorted_data = [
            {
                "date": date_key.isoformat(),
                **data,
                "productivity_score": float(data['productivity_score']) if data['productivity_score'] else 0,
                "energy_level": float(data['energy_level']) if data['energy_level'] else 0
            }
            for date_key, data in sorted(daily_data.items())
        ]
        
        # Calculate trend
        if len(sorted_data) >= 7:
            first_week_avg = sum(d['productivity_index'] for d in sorted_data[:7]) / 7
            last_week_avg = sum(d['productivity_index'] for d in sorted_data[-7:]) / 7
            trend = "improving" if last_week_avg > first_week_avg + 5 else "declining" if last_week_avg < first_week_avg - 5 else "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "trend_direction": trend,
            "average_productivity_index": sum(d['productivity_index'] for d in sorted_data) / len(sorted_data) if sorted_data else 0,
            "daily_data": sorted_data
        }
    except Exception as e:
        logger.error(f"Error analyzing productivity trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PERSONALIZED RECOMMENDATIONS ====================

@router.get("/recommendations")
async def get_personalized_recommendations(
    current_user: dict = Depends(get_current_user)
):
    """Get personalized recommendations based on behavioral patterns"""
    try:
        # This would typically use the behavioral analytics service
        # For now, providing a structured response format
        
        recommendations = []
        
        # Get recent analytics to base recommendations on
        recent_analysis = await core_api_service.database.execute(
            """
            SELECT * FROM behavioral_analytics 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT 1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if recent_analysis and recent_analysis.get('recommendations'):
            # Use recommendations from behavioral analysis
            import json
            stored_recommendations = json.loads(recent_analysis['recommendations'])
            
            for rec in stored_recommendations:
                recommendations.append({
                    "category": rec.get('category', 'general'),
                    "priority": rec.get('priority', 'medium'),
                    "title": rec.get('title', 'Optimization Opportunity'),
                    "description": rec.get('insight', ''),
                    "action": rec.get('action', ''),
                    "expected_impact": rec.get('expected_impact', 'Positive improvement expected'),
                    "confidence": recent_analysis.get('confidence_score', 0.7)
                })
        
        # Add system-specific recommendations if no behavioral analysis available
        if not recommendations:
            # Get basic system health to generate recommendations
            dashboard_summary = await core_api_service.database.get_user_dashboard_summary(
                current_user["user_id"]
            )
            
            if dashboard_summary:
                if dashboard_summary['overdue_tasks'] > 0:
                    recommendations.append({
                        "category": "task_management",
                        "priority": "high",
                        "title": "Address Overdue Tasks",
                        "description": f"You have {dashboard_summary['overdue_tasks']} overdue tasks",
                        "action": "Review and reschedule or complete overdue tasks",
                        "expected_impact": "Reduced stress and improved productivity",
                        "confidence": 0.9
                    })
                
                if dashboard_summary['avg_project_health'] < 70:
                    recommendations.append({
                        "category": "project_management", 
                        "priority": "medium",
                        "title": "Improve Project Health",
                        "description": f"Average project health is {dashboard_summary['avg_project_health']}/100",
                        "action": "Review project timelines and resource allocation",
                        "expected_impact": "Better project outcomes and reduced risk",
                        "confidence": 0.8
                    })
        
        return {
            "total_recommendations": len(recommendations),
            "generated_at": datetime.now().isoformat(),
            "recommendations": recommendations,
            "based_on_analysis": recent_analysis['id'] if recent_analysis else None
        }
    except Exception as e:
        logger.error(f"Error generating personalized recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))