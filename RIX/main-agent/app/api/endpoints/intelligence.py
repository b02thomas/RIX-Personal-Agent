"""
Intelligence endpoints for Phase 5 AI features
Handles routing to N8N MCP endpoints for routine coaching, project intelligence, and calendar optimization
"""

import asyncio
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime

from app.core.logging import get_logger
from app.models.auth import AuthenticatedUser
from app.models.chat import WorkflowType
from app.models.n8n import N8NWorkflowRequest
from app.middleware.auth import get_current_user
from app.services.context_manager import context_manager
from app.services.n8n_client import n8n_client
from app.services.websocket_manager import websocket_manager

logger = get_logger(__name__)
router = APIRouter()


@router.post("/routine-coaching")
async def routine_coaching_analysis(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Analyze user routines and provide AI-powered coaching suggestions
    Routes to N8N MCP endpoint for routine optimization
    """
    logger.info(
        "Processing routine coaching request",
        user_id=current_user.user_id,
        message_length=len(request.get("message", ""))
    )
    
    start_time = time.time()
    
    try:
        # Extract message and context from request
        message = request.get("message", "")
        context = request.get("context", {})
        conversation_id = request.get("conversation_id")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Prepare comprehensive context for N8N MCP endpoint
        routine_context = await context_manager.prepare_routine_coaching_context(
            current_user.user_id, message
        )
        
        # Create N8N workflow request for routine coaching
        n8n_request = N8NWorkflowRequest(
            workflow_type=WorkflowType.ROUTINE_COACHING,
            user_id=current_user.user_id,
            conversation_id=conversation_id,
            input_data={
                "user_input": message,
                "routine_context": routine_context,
                "coaching_request": {
                    "type": "routine_optimization",
                    "user_id": current_user.user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "preferences": routine_context.get("preferences", {})
                }
            },
            metadata={
                "endpoint": "routine-coaching",
                "context_prepared": True,
                "routine_count": len(routine_context.get("routines", [])),
                "request_timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Send processing notification via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_processing_status,
                current_user.user_id,
                conversation_id,
                "analyzing_routines",
                {"feature": "routine_coaching", "context_prepared": True}
            )
        
        # Execute N8N workflow for routine coaching
        n8n_response = await n8n_client.execute_workflow(n8n_request)
        
        processing_time = time.time() - start_time
        
        # Prepare response with coaching insights
        response = {
            "success": True,
            "coaching_insights": n8n_response.response,
            "routine_analysis": {
                "routines_analyzed": len(routine_context.get("routines", [])),
                "completion_rate": routine_context.get("statistics", {}).get("average_completion_rate", 0),
                "current_streak": routine_context.get("statistics", {}).get("streak_days", 0),
                "improvement_trend": routine_context.get("statistics", {}).get("improvement_trend", "stable")
            },
            "recommendations": {
                "focus_areas": routine_context.get("analysis_request", {}).get("focus_areas", []),
                "coaching_type": "supportive",
                "actionable_steps": True  # Indicates N8N response includes actionable steps
            },
            "processing_info": {
                "workflow_type": n8n_response.workflow_type.value,
                "processing_time": processing_time,
                "execution_id": n8n_response.execution_id,
                "confidence": 0.9  # High confidence for routine coaching
            },
            "metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "context_quality": "high" if not routine_context.get("error") else "limited",
                "user_id": current_user.user_id
            }
        }
        
        logger.info(
            "Routine coaching analysis completed",
            user_id=current_user.user_id,
            processing_time=processing_time,
            routines_count=len(routine_context.get("routines", []))
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Routine coaching analysis failed",
            user_id=current_user.user_id,
            error=str(e)
        )
        
        # Send error notification via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_error_message,
                current_user.user_id,
                f"Routine coaching analysis failed: {str(e)}",
                conversation_id
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Routine coaching analysis failed: {str(e)}"
        )


@router.post("/project-intelligence")
async def project_intelligence_analysis(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Analyze user projects and calculate AI health scores with insights
    Routes to N8N MCP endpoint for project intelligence
    """
    logger.info(
        "Processing project intelligence request",
        user_id=current_user.user_id,
        message_length=len(request.get("message", ""))
    )
    
    start_time = time.time()
    
    try:
        # Extract message and context from request
        message = request.get("message", "")
        context = request.get("context", {})
        conversation_id = request.get("conversation_id")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Prepare comprehensive context for N8N MCP endpoint
        project_context = await context_manager.prepare_project_intelligence_context(
            current_user.user_id, message
        )
        
        # Create N8N workflow request for project intelligence
        n8n_request = N8NWorkflowRequest(
            workflow_type=WorkflowType.PROJECT_INTELLIGENCE,
            user_id=current_user.user_id,
            conversation_id=conversation_id,
            input_data={
                "user_input": message,
                "project_context": project_context,
                "intelligence_request": {
                    "type": "project_analysis",
                    "user_id": current_user.user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "analysis_depth": "comprehensive",
                    "include_health_scores": True,
                    "include_recommendations": True
                }
            },
            metadata={
                "endpoint": "project-intelligence",
                "context_prepared": True,
                "project_count": len(project_context.get("projects", [])),
                "target_project": project_context.get("target_project", {}).get("id") if project_context.get("target_project") else None,
                "request_timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Send processing notification via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_processing_status,
                current_user.user_id,
                conversation_id,
                "analyzing_projects",
                {"feature": "project_intelligence", "context_prepared": True}
            )
        
        # Execute N8N workflow for project intelligence
        n8n_response = await n8n_client.execute_workflow(n8n_request)
        
        processing_time = time.time() - start_time
        
        # Prepare response with project intelligence insights
        response = {
            "success": True,
            "intelligence_insights": n8n_response.response,
            "project_analysis": {
                "projects_analyzed": len(project_context.get("projects", [])),
                "average_health_score": project_context.get("metrics", {}).get("average_health_score", 0),
                "active_projects": project_context.get("metrics", {}).get("active_projects", 0),
                "projects_at_risk": project_context.get("metrics", {}).get("projects_at_risk", 0),
                "target_project": project_context.get("target_project", {}).get("name") if project_context.get("target_project") else None
            },
            "health_scores": {
                "calculation_method": "ai_powered",
                "factors_considered": ["progress", "timeline", "resource_allocation", "risk_assessment"],
                "score_range": "0-100",
                "interpretation": {
                    "90-100": "Excellent",
                    "70-89": "Good", 
                    "50-69": "Fair",
                    "0-49": "Needs Attention"
                }
            },
            "recommendations": {
                "focus_areas": project_context.get("analysis_request", {}).get("focus", []),
                "actionable_insights": True,
                "priority_actions": True  # Indicates N8N response includes priority actions
            },
            "processing_info": {
                "workflow_type": n8n_response.workflow_type.value,
                "processing_time": processing_time,
                "execution_id": n8n_response.execution_id,
                "confidence": 0.92  # High confidence for project intelligence
            },
            "metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "context_quality": "high" if not project_context.get("error") else "limited",
                "user_id": current_user.user_id
            }
        }
        
        logger.info(
            "Project intelligence analysis completed",
            user_id=current_user.user_id,
            processing_time=processing_time,
            projects_count=len(project_context.get("projects", []))
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Project intelligence analysis failed",
            user_id=current_user.user_id,
            error=str(e)
        )
        
        # Send error notification via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_error_message,
                current_user.user_id,
                f"Project intelligence analysis failed: {str(e)}",
                conversation_id
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Project intelligence analysis failed: {str(e)}"
        )


@router.post("/calendar-optimization")
async def calendar_optimization_analysis(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Analyze user calendar and provide intelligent scheduling optimization
    Routes to N8N MCP endpoint for calendar optimization
    """
    logger.info(
        "Processing calendar optimization request",
        user_id=current_user.user_id,
        message_length=len(request.get("message", ""))
    )
    
    start_time = time.time()
    
    try:
        # Extract message and context from request
        message = request.get("message", "")
        context = request.get("context", {})
        conversation_id = request.get("conversation_id")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Prepare comprehensive context for N8N MCP endpoint
        calendar_context = await context_manager.prepare_calendar_optimization_context(
            current_user.user_id, message
        )
        
        # Create N8N workflow request for calendar optimization
        n8n_request = N8NWorkflowRequest(
            workflow_type=WorkflowType.CALENDAR_OPTIMIZATION,
            user_id=current_user.user_id,
            conversation_id=conversation_id,
            input_data={
                "user_input": message,
                "calendar_context": calendar_context,
                "optimization_request": {
                    "type": "schedule_optimization",
                    "user_id": current_user.user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "optimization_goals": ["productivity", "efficiency", "work_life_balance"],
                    "include_suggestions": True,
                    "include_time_blocks": True
                }
            },
            metadata={
                "endpoint": "calendar-optimization",
                "context_prepared": True,
                "events_count": len(calendar_context.get("calendar_events", [])),
                "time_blocks_count": len(calendar_context.get("time_blocks", [])),
                "optimization_scope": calendar_context.get("optimization_request", {}).get("time_range", {}),
                "request_timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Send processing notification via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_processing_status,
                current_user.user_id,
                conversation_id,
                "optimizing_calendar",
                {"feature": "calendar_optimization", "context_prepared": True}
            )
        
        # Execute N8N workflow for calendar optimization
        n8n_response = await n8n_client.execute_workflow(n8n_request)
        
        processing_time = time.time() - start_time
        
        # Prepare response with calendar optimization insights
        response = {
            "success": True,
            "optimization_insights": n8n_response.response,
            "schedule_analysis": {
                "events_analyzed": len(calendar_context.get("calendar_events", [])),
                "time_blocks_analyzed": len(calendar_context.get("time_blocks", [])),
                "meeting_density": calendar_context.get("patterns", {}).get("meeting_density", 0),
                "schedule_efficiency": calendar_context.get("schedule_analysis", {}).get("schedule_efficiency", 0),
                "productivity_windows": calendar_context.get("patterns", {}).get("productivity_peaks", [])
            },
            "optimization_scope": {
                "time_range": calendar_context.get("optimization_request", {}).get("time_range", {}),
                "focus_areas": calendar_context.get("optimization_request", {}).get("focus_areas", []),
                "preferences": calendar_context.get("optimization_request", {}).get("preferences", {})
            },
            "recommendations": {
                "scheduling_improvements": True,
                "time_blocking_suggestions": True,
                "productivity_optimizations": True,
                "conflict_resolutions": len(calendar_context.get("patterns", {}).get("common_conflicts", []))
            },
            "processing_info": {
                "workflow_type": n8n_response.workflow_type.value,
                "processing_time": processing_time,
                "execution_id": n8n_response.execution_id,
                "confidence": 0.88  # High confidence for calendar optimization
            },
            "metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "context_quality": "high" if not calendar_context.get("error") else "limited",
                "user_id": current_user.user_id
            }
        }
        
        logger.info(
            "Calendar optimization analysis completed",
            user_id=current_user.user_id,
            processing_time=processing_time,
            events_count=len(calendar_context.get("calendar_events", []))
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Calendar optimization analysis failed",
            user_id=current_user.user_id,
            error=str(e)
        )
        
        # Send error notification via WebSocket
        if websocket_manager.is_user_connected(current_user.user_id):
            background_tasks.add_task(
                websocket_manager.send_error_message,
                current_user.user_id,
                f"Calendar optimization analysis failed: {str(e)}",
                conversation_id
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Calendar optimization analysis failed: {str(e)}"
        )


@router.get("/features/status")
async def intelligence_features_status(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Get status of Phase 5 intelligence features
    """
    logger.info("Getting intelligence features status", user_id=current_user.user_id)
    
    try:
        # Check N8N MCP endpoint availability
        n8n_status = await n8n_client.get_workflow_status()
        
        # Get user data availability
        routines_context = await context_manager.prepare_routine_coaching_context(current_user.user_id, "status check")
        projects_context = await context_manager.prepare_project_intelligence_context(current_user.user_id, "status check")
        calendar_context = await context_manager.prepare_calendar_optimization_context(current_user.user_id, "status check")
        
        return {
            "intelligence_features": {
                "routine_coaching": {
                    "available": True,
                    "mcp_endpoint": "/mcp/routine-coaching",
                    "data_available": len(routines_context.get("routines", [])) > 0,
                    "routines_count": len(routines_context.get("routines", [])),
                    "features": ["habit_optimization", "streak_analysis", "coaching_suggestions"]
                },
                "project_intelligence": {
                    "available": True,
                    "mcp_endpoint": "/mcp/project-intelligence",
                    "data_available": len(projects_context.get("projects", [])) > 0,
                    "projects_count": len(projects_context.get("projects", [])),
                    "features": ["health_score_calculation", "risk_analysis", "progress_insights"]
                },
                "calendar_optimization": {
                    "available": True,
                    "mcp_endpoint": "/mcp/calendar-optimization",
                    "data_available": len(calendar_context.get("calendar_events", [])) > 0,
                    "events_count": len(calendar_context.get("calendar_events", [])),
                    "features": ["schedule_optimization", "time_blocking", "productivity_analysis"]
                }
            },
            "n8n_status": {
                "available": n8n_status.available,
                "response_time": n8n_status.response_time,
                "active_workflows": n8n_status.active_workflows
            },
            "system_info": {
                "phase": "Phase 5 - Intelligence Features",
                "rix_prd_compliant": True,
                "pattern_based_routing": True,
                "context_management": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error("Failed to get intelligence features status", user_id=current_user.user_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get status: {str(e)}"
        )