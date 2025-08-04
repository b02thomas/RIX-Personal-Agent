# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/api/endpoints/intelligence.py
# Intelligence endpoints for RIX Personal Agent
# Provides intelligence services and MCP routing capabilities
# RELEVANT FILES: services/intelligence/*, services/mcp_router.py, models/schemas.py

import logging
import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, Optional

from app.middleware.auth import get_current_user
from app.models.schemas import (  # Intelligence response models; Standard response models
    APIResponse,
    CalendarOptimizationResponse,
    IntelligenceResponse,
    ProjectHealthResponse,
    RoutineCoachingResponse,
)
from app.services.intelligence.behavioral_analytics import behavioral_analytics_service
from app.services.intelligence.calendar_optimizer import calendar_optimizer_service
from app.services.intelligence.project_health import project_health_service
from app.services.intelligence.routine_coach import routine_coaching_service
from app.services.mcp_router import mcp_router
from app.services.context_manager import context_manager
from app.services.n8n_client import n8n_client
from app.services.websocket_manager import websocket_manager
from app.models.chat import WorkflowType
from app.models.n8n import N8NWorkflowRequest
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Query

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== ROUTINE COACHING INTELLIGENCE ====================


@router.post("/routine-coaching")
async def routine_coaching_analysis(
    request: Dict[str, Any], 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze user routines and provide AI-powered coaching suggestions
    Phase 5 Intelligence endpoint with context preparation and N8N routing
    """
    try:
        message = request.get("message")
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        conversation_id = request.get("conversation_id", f"conv-{uuid.uuid4().hex[:8]}")
        
        # Notify connected clients about processing start
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_processing_status(
                current_user["user_id"], 
                "routine_coaching", 
                "started",
                conversation_id
            )

        # Prepare context for N8N workflow
        context = await context_manager.prepare_routine_coaching_context(
            user_id=current_user["user_id"],
            message=message
        )

        # Create N8N workflow request
        n8n_request = N8NWorkflowRequest(
            workflow_type=WorkflowType.ROUTINE_COACHING,
            user_id=current_user["user_id"],
            conversation_id=conversation_id,
            payload=context,
            metadata=request.get("context", {})
        )

        # Execute N8N workflow
        n8n_response = await n8n_client.execute_workflow(n8n_request)
        
        if not n8n_response.success:
            raise HTTPException(status_code=500, detail="Routine coaching analysis failed")

        # Build response
        response = {
            "success": True,
            "coaching_insights": n8n_response.data.get("coaching_insights", []),
            "routine_analysis": {
                "routines_analyzed": len(context.get("routines", [])),
                "completion_rate": context.get("statistics", {}).get("average_completion_rate", 0),
                "current_streak": context.get("statistics", {}).get("streak_days", 0),
                "improvement_trend": context.get("statistics", {}).get("improvement_trend", "unknown")
            },
            "recommendations": n8n_response.data.get("recommendations", []),
            "processing_info": {
                "workflow_type": WorkflowType.ROUTINE_COACHING.value,
                "confidence": n8n_response.confidence or 0.9,
                "execution_id": n8n_response.execution_id,
                "processing_time": n8n_response.processing_time
            },
            "metadata": {
                "context_prepared": True,
                "routines_count": len(context.get("routines", [])),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        }

        # Notify completion
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_processing_status(
                current_user["user_id"], 
                "routine_coaching", 
                "completed",
                conversation_id
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Routine coaching analysis failed: {e}")
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_error_message(
                current_user["user_id"], 
                f"Routine coaching analysis failed: {str(e)}"
            )
        raise HTTPException(status_code=500, detail="Routine coaching analysis failed")


@router.get("/routine-coaching/{routine_id}", response_model=RoutineCoachingResponse)
async def get_routine_coaching(routine_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    """Get coaching insights for a specific routine"""
    try:
        insights = await routine_coaching_service.get_coaching_insights(user_id=current_user["user_id"], routine_id=routine_id)
        return insights
    except Exception as e:
        logger.error(f"Error getting routine coaching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PROJECT INTELLIGENCE ====================


@router.post("/project-intelligence")
async def project_intelligence_analysis(
    request: Dict[str, Any], 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze user projects and calculate AI health scores with insights
    Phase 5 Intelligence endpoint with context preparation and N8N routing
    """
    try:
        message = request.get("message")
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        conversation_id = request.get("conversation_id", f"conv-{uuid.uuid4().hex[:8]}")
        
        # Notify connected clients about processing start
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_processing_status(
                current_user["user_id"], 
                "project_intelligence", 
                "started",
                conversation_id
            )

        # Prepare context for N8N workflow
        context = await context_manager.prepare_project_intelligence_context(
            user_id=current_user["user_id"],
            message=message
        )

        # Create N8N workflow request
        n8n_request = N8NWorkflowRequest(
            workflow_type=WorkflowType.PROJECT_INTELLIGENCE,
            user_id=current_user["user_id"],
            conversation_id=conversation_id,
            payload=context,
            metadata=request.get("context", {})
        )

        # Execute N8N workflow
        n8n_response = await n8n_client.execute_workflow(n8n_request)
        
        if not n8n_response.success:
            raise HTTPException(status_code=500, detail="Project intelligence analysis failed")

        # Build response
        response = {
            "success": True,
            "project_insights": n8n_response.data.get("project_insights", []),
            "health_analysis": {
                "projects_analyzed": len(context.get("projects", [])),
                "average_health_score": context.get("insights", {}).get("average_health_score", 0),
                "at_risk_count": context.get("insights", {}).get("at_risk_count", 0),
                "top_performing": context.get("insights", {}).get("top_performing_project")
            },
            "recommendations": n8n_response.data.get("recommendations", []),
            "processing_info": {
                "workflow_type": WorkflowType.PROJECT_INTELLIGENCE.value,
                "confidence": n8n_response.confidence or 0.85,
                "execution_id": n8n_response.execution_id,
                "processing_time": n8n_response.processing_time
            },
            "metadata": {
                "context_prepared": True,
                "projects_count": len(context.get("projects", [])),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        }

        # Notify completion
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_processing_status(
                current_user["user_id"], 
                "project_intelligence", 
                "completed",
                conversation_id
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project intelligence analysis failed: {e}")
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_error_message(
                current_user["user_id"], 
                f"Project intelligence analysis failed: {str(e)}"
            )
        raise HTTPException(status_code=500, detail="Project intelligence analysis failed")


@router.get("/project-intelligence/{project_id}", response_model=ProjectHealthResponse)
async def get_project_intelligence(project_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    """Get intelligence analysis for a specific project"""
    try:
        assessment = await project_health_service.assess_project_health(user_id=current_user["user_id"], project_id=project_id)
        return assessment
    except Exception as e:
        logger.error(f"Error getting project intelligence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CALENDAR OPTIMIZATION ====================


@router.post("/calendar-optimization")
async def calendar_optimization_analysis(
    request: Dict[str, Any], 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze user calendar and provide intelligent scheduling optimization
    Phase 5 Intelligence endpoint with context preparation and N8N routing
    """
    try:
        message = request.get("message")
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        conversation_id = request.get("conversation_id", f"conv-{uuid.uuid4().hex[:8]}")
        
        # Notify connected clients about processing start
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_processing_status(
                current_user["user_id"], 
                "calendar_optimization", 
                "started",
                conversation_id
            )

        # Prepare context for N8N workflow
        context = await context_manager.prepare_calendar_optimization_context(
            user_id=current_user["user_id"],
            message=message
        )

        # Create N8N workflow request
        n8n_request = N8NWorkflowRequest(
            workflow_type=WorkflowType.CALENDAR_OPTIMIZATION,
            user_id=current_user["user_id"],
            conversation_id=conversation_id,
            payload=context,
            metadata=request.get("context", {})
        )

        # Execute N8N workflow
        n8n_response = await n8n_client.execute_workflow(n8n_request)
        
        if not n8n_response.success:
            raise HTTPException(status_code=500, detail="Calendar optimization analysis failed")

        # Build response
        response = {
            "success": True,
            "optimization_insights": n8n_response.data.get("optimization_insights", []),
            "schedule_analysis": {
                "events_analyzed": len(context.get("calendar_events", [])),
                "meeting_density": context.get("schedule_analysis", {}).get("meeting_density", 0),
                "productivity_windows": context.get("patterns", {}).get("productivity_peaks", []),
                "conflicts_detected": len(context.get("patterns", {}).get("common_conflicts", []))
            },
            "recommendations": n8n_response.data.get("recommendations", []),
            "processing_info": {
                "workflow_type": WorkflowType.CALENDAR_OPTIMIZATION.value,
                "confidence": n8n_response.confidence or 0.8,
                "execution_id": n8n_response.execution_id,
                "processing_time": n8n_response.processing_time
            },
            "metadata": {
                "context_prepared": True,
                "events_count": len(context.get("calendar_events", [])),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        }

        # Notify completion
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_processing_status(
                current_user["user_id"], 
                "calendar_optimization", 
                "completed",
                conversation_id
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Calendar optimization analysis failed: {e}")
        if websocket_manager.is_user_connected(current_user["user_id"]):
            await websocket_manager.send_error_message(
                current_user["user_id"], 
                f"Calendar optimization analysis failed: {str(e)}"
            )
        raise HTTPException(status_code=500, detail="Calendar optimization analysis failed")


@router.get("/calendar-optimization/{target_date}", response_model=CalendarOptimizationResponse)
async def get_calendar_optimization(
    target_date: date,
    preferences: Optional[str] = Query(None, description="JSON string of preferences"),
    current_user: dict = Depends(get_current_user),
):
    """Get calendar optimization for a specific date"""
    try:
        import json

        prefs = json.loads(preferences) if preferences else {}

        optimization = await calendar_optimizer_service.optimize_schedule(
            user_id=current_user["user_id"], target_date=target_date, preferences=prefs
        )
        return optimization
    except Exception as e:
        logger.error(f"Error getting calendar optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BEHAVIORAL ANALYTICS ====================


@router.post("/behavioral-analytics")
async def behavioral_analytics_analysis(request: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """
    Generate comprehensive behavioral analysis across all systems
    Routes via MCP to Sub-Agent or direct intelligence service
    """
    try:
        analysis_period = request.get("analysis_period", "monthly")

        # Route via MCP router
        response = await mcp_router.route_request(
            user_id=current_user["user_id"],
            sub_agent_type="behavioral_analytics",
            action="generate_analysis",
            payload={"analysis_period": analysis_period},
            context=request.get("context", {}),
        )

        if not response.get("success"):
            raise HTTPException(status_code=500, detail=response.get("error", "Behavioral analytics failed"))

        return response["data"]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Behavioral analytics analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/behavioral-analytics/generate")
async def generate_behavioral_analysis(
    analysis_period: str = Query("monthly", regex="^(weekly|monthly|quarterly)$"),
    current_user: dict = Depends(get_current_user),
):
    """Generate comprehensive behavioral analysis"""
    try:
        analysis = await behavioral_analytics_service.generate_comprehensive_analysis(
            user_id=current_user["user_id"], analysis_period=analysis_period
        )
        return analysis
    except Exception as e:
        logger.error(f"Error generating behavioral analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/behavioral-analytics/correlations")
async def get_productivity_correlations(days: int = Query(30, ge=7, le=90), current_user: dict = Depends(get_current_user)):
    """Analyze productivity correlations across different systems"""
    try:
        correlations = await behavioral_analytics_service.analyze_productivity_correlations(
            user_id=current_user["user_id"], days=days
        )
        return correlations
    except Exception as e:
        logger.error(f"Error analyzing productivity correlations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== INTELLIGENCE SYSTEM STATUS ====================


@router.get("/features/status")
async def intelligence_features_status(current_user: dict = Depends(get_current_user)):
    """Get status of intelligence features and MCP routing"""
    try:
        # Get MCP router health
        mcp_health = await mcp_router.health_check()

        # Check data availability for each intelligence service
        from app.core.database import database

        # Check routine data
        routine_count = await database.execute(
            "SELECT COUNT(*) FROM user_routines WHERE user_id = $1 AND is_active = true",
            uuid.UUID(current_user["user_id"]),
            fetch_val=True,
        )

        # Check project data
        project_count = await database.execute(
            "SELECT COUNT(*) FROM projects WHERE user_id = $1 AND status = 'active'",
            uuid.UUID(current_user["user_id"]),
            fetch_val=True,
        )

        # Check calendar data
        calendar_count = await database.execute(
            """
            SELECT COUNT(*) FROM calendar_events 
            WHERE user_id = $1 AND start_time >= NOW() - INTERVAL '30 days'
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_val=True,
        )

        # Check analytics data
        analytics_count = await database.execute(
            "SELECT COUNT(*) FROM behavioral_analytics WHERE user_id = $1", uuid.UUID(current_user["user_id"]), fetch_val=True
        )

        return {
            "intelligence_features": {
                "routine_coaching": {
                    "available": True,
                    "service_type": mcp_health["mode"],
                    "data_available": routine_count > 0,
                    "data_count": routine_count,
                    "features": ["habit_optimization", "streak_analysis", "coaching_suggestions", "pattern_recognition"],
                },
                "project_intelligence": {
                    "available": True,
                    "service_type": mcp_health["mode"],
                    "data_available": project_count > 0,
                    "data_count": project_count,
                    "features": ["health_score_calculation", "risk_analysis", "progress_insights", "completion_prediction"],
                },
                "calendar_optimization": {
                    "available": True,
                    "service_type": mcp_health["mode"],
                    "data_available": calendar_count > 0,
                    "data_count": calendar_count,
                    "features": ["schedule_optimization", "conflict_detection", "productivity_analysis", "time_blocking"],
                },
                "behavioral_analytics": {
                    "available": True,
                    "service_type": mcp_health["mode"],
                    "data_available": analytics_count > 0 or (routine_count > 0 and project_count > 0),
                    "analysis_count": analytics_count,
                    "features": [
                        "cross_system_correlations",
                        "productivity_patterns",
                        "behavioral_insights",
                        "trend_analysis",
                    ],
                },
            },
            "mcp_system": mcp_health,
            "database_integration": {
                "status": "fully_integrated",
                "tables_available": [
                    "tasks",
                    "projects",
                    "calendar_events",
                    "user_routines",
                    "knowledge_entries",
                    "user_goals",
                    "behavioral_analytics",
                ],
                "vector_search": True,
                "intelligence_ready": True,
            },
            "system_info": {
                "version": "2.0.0",
                "architecture": "RIX PRD Compliant",
                "intelligence_mode": mcp_health["mode"],
                "sub_agents_ready": mcp_health["mode"] == "mcp",
                "timestamp": datetime.now().isoformat(),
            },
        }

    except Exception as e:
        logger.error(f"Failed to get intelligence features status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/switch-mode")
async def switch_intelligence_mode(request: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Switch between direct API and MCP Sub-Agent modes"""
    try:
        new_mode = request.get("mode")
        if new_mode not in ["direct", "mcp"]:
            raise HTTPException(status_code=400, detail="Mode must be 'direct' or 'mcp'")

        success = await mcp_router.switch_mode(new_mode)

        return {
            "success": success,
            "previous_mode": "direct" if new_mode == "mcp" else "mcp",
            "current_mode": new_mode,
            "message": f"Intelligence routing switched to {new_mode} mode",
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to switch intelligence mode: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WEEKLY ANALYSIS ENDPOINTS ====================


@router.get("/weekly-analysis")
async def get_weekly_intelligence_analysis(
    start_date: date = Query(..., description="Start date of the week (Monday)"),
    current_user: dict = Depends(get_current_user),
):
    """Get comprehensive weekly intelligence analysis across all systems"""
    try:
        # Get calendar analysis
        calendar_analysis = await calendar_optimizer_service.analyze_week_patterns(
            user_id=current_user["user_id"], start_date=start_date
        )

        # Get behavioral analytics for the week
        behavioral_analysis = await behavioral_analytics_service.generate_comprehensive_analysis(
            user_id=current_user["user_id"], analysis_period="weekly"
        )

        return {
            "week_period": f"{start_date.isoformat()} to {(start_date + timedelta(days=6)).isoformat()}",
            "calendar_intelligence": calendar_analysis,
            "behavioral_intelligence": behavioral_analysis,
            "combined_insights": {
                "productivity_trends": "Generated from combined analysis",
                "optimization_opportunities": "Cross-system recommendations",
                "weekly_score": "Composite performance metric",
            },
            "generated_at": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error generating weekly intelligence analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HEALTH CHECK ====================


@router.get("/health")
async def intelligence_health_check():
    """Health check for intelligence services"""
    try:
        # Check MCP router
        mcp_health = await mcp_router.health_check()

        # Check database connectivity
        from app.core.database import database

        db_health = await database.health_check()

        return {
            "status": "healthy" if mcp_health["status"] == "healthy" and db_health["status"] == "healthy" else "degraded",
            "services": {
                "mcp_router": mcp_health,
                "database": db_health,
                "intelligence_services": {
                    "routine_coaching": "available",
                    "project_intelligence": "available",
                    "calendar_optimization": "available",
                    "behavioral_analytics": "available",
                },
            },
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Intelligence health check failed: {e}")
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now().isoformat()}
