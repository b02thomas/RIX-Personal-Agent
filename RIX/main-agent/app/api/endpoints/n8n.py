"""
N8N management endpoints for RIX Main Agent
"""

from typing import List, Optional

from app.core.logging import get_logger
from app.middleware.auth import get_current_user
from app.models.auth import AuthenticatedUser
from app.models.n8n import (
    AITriggeredExecutionRequest,
    ExecutionStatus,
    N8NExecutionInfo,
    N8NStatusResponse,
    N8NWorkflowInfo,
    WorkflowActivationRequest,
    WorkflowActivationResponse,
    WorkflowAnalyticsResponse,
    WorkflowDiscoveryRequest,
    WorkflowPerformanceMetrics,
    WorkflowSyncRequest,
    WorkflowSyncResponse,
    WorkflowTriggerRequest,
    WorkflowTriggerResponse,
)
from app.services.database import database
from app.services.n8n_client import n8n_client
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

logger = get_logger(__name__)
router = APIRouter()


@router.get("/status", response_model=N8NStatusResponse)
async def get_n8n_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get N8N service status"""
    logger.info("N8N status requested", user_id=current_user.user_id)

    try:
        status = await n8n_client.get_workflow_status()

        logger.info(
            "N8N status retrieved",
            available=status.available,
            active_workflows=status.active_workflows,
            response_time=status.response_time,
        )

        return status

    except Exception as e:
        logger.error("Failed to get N8N status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get N8N status: {str(e)}")


@router.get("/workflows", response_model=List[N8NWorkflowInfo])
async def get_workflows(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get available N8N workflows"""
    logger.info("Workflows list requested", user_id=current_user.user_id)

    try:
        status = await n8n_client.get_workflow_status()
        return status.workflows

    except Exception as e:
        logger.error("Failed to get workflows", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get workflows: {str(e)}")


@router.post("/trigger", response_model=dict)
async def trigger_workflow(
    request: WorkflowTriggerRequest,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Manually trigger N8N workflow"""
    logger.info(
        "Manual workflow trigger requested",
        user_id=current_user.user_id,
        workflow_type=request.workflow_type.value,
        async_execution=request.async_execution,
    )

    try:
        from app.models.n8n import N8NWorkflowRequest

        # Create N8N workflow request
        n8n_request = N8NWorkflowRequest(
            workflow_type=request.workflow_type,
            user_id=current_user.user_id,
            conversation_id=request.conversation_id,
            input_data=request.input_data,
            metadata={
                "manual_trigger": True,
                "triggered_by": current_user.user_id,
                "async_execution": request.async_execution,
            },
        )

        if request.async_execution:
            # Execute workflow in background
            background_tasks.add_task(_execute_workflow_background, n8n_request, current_user.user_id)

            return {
                "status": "accepted",
                "message": f"Workflow {request.workflow_type.value} queued for execution",
                "async": True,
                "workflow_type": request.workflow_type.value,
            }
        else:
            # Execute workflow synchronously
            response = await n8n_client.execute_workflow(n8n_request)

            # Store execution if ID is available
            if response.execution_id:
                background_tasks.add_task(
                    database.store_n8n_execution,
                    response.execution_id,
                    current_user.user_id,
                    response.workflow_type.value,
                    request.conversation_id,
                    "completed",
                    n8n_request.input_data,
                    {"response": response.response, "metadata": response.metadata},
                )

            return {
                "status": "completed",
                "message": "Workflow executed successfully",
                "async": False,
                "workflow_type": response.workflow_type.value,
                "execution_id": response.execution_id,
                "response": response.response,
                "processing_time": response.processing_time,
                "metadata": response.metadata,
            }

    except Exception as e:
        logger.error(
            "Workflow trigger failed", user_id=current_user.user_id, workflow_type=request.workflow_type.value, error=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Workflow trigger failed: {str(e)}")


@router.get("/executions/{execution_id}", response_model=dict)
async def get_execution(execution_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get N8N execution information"""
    logger.info("Execution info requested", user_id=current_user.user_id, execution_id=execution_id)

    try:
        # Try to get from N8N first
        n8n_execution = await n8n_client.get_execution_info(execution_id)

        if n8n_execution:
            return {"source": "n8n", "execution": n8n_execution.dict()}

        # Fallback to local database
        db_execution = await database.get_n8n_execution(execution_id)

        if db_execution:
            return {"source": "database", "execution": db_execution}

        raise HTTPException(status_code=404, detail="Execution not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get execution info", execution_id=execution_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get execution info: {str(e)}")


@router.get("/executions", response_model=List[dict])
async def get_user_executions(
    limit: int = 10, workflow_type: Optional[str] = None, current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get user's N8N executions"""
    logger.info("User executions requested", user_id=current_user.user_id, limit=limit, workflow_type=workflow_type)

    try:
        # This would require extending the database service to filter by user
        # For now, return a placeholder response
        return []

    except Exception as e:
        logger.error("Failed to get user executions", user_id=current_user.user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get executions: {str(e)}")


@router.post("/discover", response_model=dict)
async def discover_workflows(request: WorkflowDiscoveryRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Discover and categorize available N8N workflows"""
    logger.info(
        "Workflow discovery requested",
        user_id=current_user.user_id,
        category=request.category,
        active_only=request.active_only,
    )

    try:
        # Discover workflows from N8N
        workflows = await n8n_client.discover_workflows()

        # Store/update workflow metadata in database
        stored_workflows = []
        for workflow in workflows:
            # Determine category based on workflow name/tags
            category = "general"
            if "task" in workflow.name.lower():
                category = "productivity"
            elif "calendar" in workflow.name.lower():
                category = "productivity"
            elif "news" in workflow.name.lower() or "brief" in workflow.name.lower():
                category = "intelligence"
            elif "chat" in workflow.name.lower() or "conversation" in workflow.name.lower():
                category = "communication"
            elif "notification" in workflow.name.lower():
                category = "automation"
            elif "analytics" in workflow.name.lower():
                category = "analytics"

            # Store workflow metadata
            stored_workflow = await database.store_workflow_metadata(
                workflow_id=workflow.id,
                name=workflow.name,
                active=workflow.active,
                description=f"N8N workflow: {workflow.name}",
                category=category,
                workflow_type=workflow.name.lower().replace(" ", "-"),
                tags=workflow.tags,
                version=workflow.version,
            )
            stored_workflows.append(stored_workflow)

        # Filter by category if requested
        if request.category:
            workflows = [w for w in workflows if request.category in [tag.lower() for tag in w.tags]]

        # Filter by active status if requested
        if request.active_only:
            workflows = [w for w in workflows if w.active]

        # Categorize workflows
        categorized = await n8n_client.categorize_workflows(workflows)

        # Get performance metrics if requested
        metrics = {}
        if request.include_metrics:
            for workflow in workflows:
                metrics[workflow.id] = await n8n_client.get_workflow_performance_metrics(workflow.id)

        return {
            "workflows": [workflow.dict() for workflow in workflows],
            "categories": categorized,
            "metrics": metrics,
            "total_count": len(workflows),
            "active_count": len([w for w in workflows if w.active]),
            "stored_count": len(stored_workflows),
        }

    except Exception as e:
        logger.error("Workflow discovery failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Workflow discovery failed: {str(e)}")


@router.post("/activate", response_model=WorkflowActivationResponse)
async def activate_workflow(request: WorkflowActivationRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Activate or deactivate N8N workflow"""
    logger.info(
        "Workflow activation requested",
        user_id=current_user.user_id,
        workflow_id=request.workflow_id,
        target_status=request.active,
    )

    try:
        # Get current workflow status from database
        workflows = await database.get_workflows_by_category(active_only=False)
        current_workflow = next((w for w in workflows if w["id"] == request.workflow_id), None)
        previous_status = current_workflow["active"] if current_workflow else False

        # Activate/deactivate workflow in N8N
        success = await n8n_client.activate_workflow(request.workflow_id, request.active)

        if success:
            # Update database status
            await database.update_workflow_status(request.workflow_id, request.active)

            message = f"Workflow {'activated' if request.active else 'deactivated'} successfully"
            logger.info(message, workflow_id=request.workflow_id)
        else:
            message = f"Failed to {'activate' if request.active else 'deactivate'} workflow"
            logger.error(message, workflow_id=request.workflow_id)

        return WorkflowActivationResponse(
            workflow_id=request.workflow_id,
            previous_status=previous_status,
            new_status=request.active if success else previous_status,
            success=success,
            message=message,
        )

    except Exception as e:
        logger.error("Workflow activation failed", workflow_id=request.workflow_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Workflow activation failed: {str(e)}")


@router.post("/ai-trigger", response_model=dict)
async def trigger_ai_workflow(
    request: AITriggeredExecutionRequest,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Execute workflow triggered by AI intelligence"""
    logger.info(
        "AI-triggered workflow execution requested",
        user_id=current_user.user_id,
        workflow_type=request.workflow_type.value,
        confidence=request.trigger_confidence,
    )

    try:
        # Execute AI-triggered workflow
        response = await n8n_client.execute_ai_triggered_workflow(
            workflow_type=request.workflow_type,
            context=request.intelligence_context,
            user_id=current_user.user_id,
            conversation_id=request.conversation_id,
        )

        # Track AI-triggered execution in background
        if response.execution_id:
            background_tasks.add_task(
                _track_ai_triggered_execution,
                request.workflow_type.value,
                response.processing_time,
                response.execution_id is not None,
                current_user.user_id,
            )

        return {
            "status": "completed",
            "message": "AI-triggered workflow executed successfully",
            "workflow_type": response.workflow_type.value,
            "execution_id": response.execution_id,
            "response": response.response,
            "processing_time": response.processing_time,
            "ai_triggered": True,
            "confidence": request.trigger_confidence,
            "metadata": response.metadata,
        }

    except Exception as e:
        logger.error("AI-triggered workflow execution failed", workflow_type=request.workflow_type.value, error=str(e))
        raise HTTPException(status_code=500, detail=f"AI-triggered workflow execution failed: {str(e)}")


@router.get("/analytics", response_model=WorkflowAnalyticsResponse)
async def get_workflow_analytics(days: int = 7, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get workflow analytics and performance metrics"""
    logger.info("Workflow analytics requested", user_id=current_user.user_id, days=days)

    try:
        # Get analytics from database
        analytics = await database.get_workflow_analytics(days)

        # Format categories
        categories = []
        for cat_data in analytics.get("categories", []):
            categories.append(
                {
                    "category": cat_data["category"],
                    "workflow_count": cat_data["workflow_count"],
                    "active_count": cat_data["workflow_count"],  # Assume all are active for now
                    "total_executions": cat_data.get("execution_count", 0),
                    "avg_success_rate": cat_data.get("avg_success_rate", 0.0),
                }
            )

        # Calculate AI-triggered statistics
        summary = analytics.get("summary", {})
        ai_triggered_stats = {
            "total_ai_triggered": summary.get("total_ai_triggered", 0),
            "ai_triggered_percentage": (
                (summary.get("total_ai_triggered", 0) / max(summary.get("total_executions", 1), 1)) * 100
            ),
            "avg_confidence": 0.85,  # Mock average confidence
        }

        return WorkflowAnalyticsResponse(
            summary=summary,
            categories=categories,
            top_performers=[],  # Would be calculated from workflow metrics
            recent_executions=analytics.get("recent_executions", []),
            ai_triggered_stats=ai_triggered_stats,
            period_days=days,
        )

    except Exception as e:
        logger.error("Failed to get workflow analytics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get workflow analytics: {str(e)}")


@router.post("/sync", response_model=WorkflowSyncResponse)
async def sync_workflows(request: WorkflowSyncRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Sync workflows from N8N instance"""
    logger.info("Workflow sync requested", user_id=current_user.user_id, force_refresh=request.force_refresh)

    try:
        # Get current workflows from database
        existing_workflows = await database.get_workflows_by_category(active_only=False)
        existing_ids = {w["id"] for w in existing_workflows}

        # Discover workflows from N8N
        discovered_workflows = await n8n_client.discover_workflows()

        synced_count = 0
        updated_count = 0
        new_count = 0
        categories = set()

        for workflow in discovered_workflows:
            # Determine category
            category = "general"
            if "task" in workflow.name.lower():
                category = "productivity"
            elif "calendar" in workflow.name.lower():
                category = "productivity"
            elif "news" in workflow.name.lower() or "brief" in workflow.name.lower():
                category = "intelligence"
            elif "chat" in workflow.name.lower():
                category = "communication"
            elif "notification" in workflow.name.lower():
                category = "automation"
            elif "analytics" in workflow.name.lower():
                category = "analytics"

            categories.add(category)

            # Store/update workflow
            await database.store_workflow_metadata(
                workflow_id=workflow.id,
                name=workflow.name,
                active=workflow.active,
                description=f"N8N workflow: {workflow.name}",
                category=category,
                workflow_type=workflow.name.lower().replace(" ", "-"),
                tags=workflow.tags,
                version=workflow.version,
            )

            if workflow.id in existing_ids:
                updated_count += 1
            else:
                new_count += 1

            synced_count += 1

        return WorkflowSyncResponse(
            synced_count=synced_count,
            updated_count=updated_count,
            new_count=new_count,
            categories=list(categories),
            success=True,
            message=f"Successfully synced {synced_count} workflows ({new_count} new, {updated_count} updated)",
        )

    except Exception as e:
        logger.error("Workflow sync failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Workflow sync failed: {str(e)}")


async def _track_ai_triggered_execution(workflow_type: str, execution_time: float, success: bool, user_id: str):
    """Track AI-triggered execution metrics"""
    try:
        # Get workflow ID from type mapping
        workflows = await database.get_workflows_by_category(active_only=False)
        workflow = next((w for w in workflows if w["workflow_type"] == workflow_type), None)

        if workflow:
            await database.track_workflow_execution(
                workflow_id=workflow["id"], execution_time=execution_time, success=success, ai_triggered=True
            )

            logger.info(
                "AI-triggered execution tracked", workflow_id=workflow["id"], workflow_type=workflow_type, success=success
            )

    except Exception as e:
        logger.error("Failed to track AI-triggered execution", workflow_type=workflow_type, error=str(e))


async def _execute_workflow_background(n8n_request, user_id: str):
    """Execute workflow in background task"""
    try:
        logger.info("Executing workflow in background", user_id=user_id, workflow_type=n8n_request.workflow_type.value)

        response = await n8n_client.execute_workflow(n8n_request)

        # Store execution result
        if response.execution_id:
            await database.store_n8n_execution(
                response.execution_id,
                user_id,
                response.workflow_type.value,
                n8n_request.conversation_id,
                "completed",
                n8n_request.input_data,
                {"response": response.response, "metadata": response.metadata},
            )

            # Track execution metrics
            await _track_ai_triggered_execution(response.workflow_type.value, response.processing_time, True, user_id)

        logger.info(
            "Background workflow execution completed",
            user_id=user_id,
            workflow_type=response.workflow_type.value,
            execution_id=response.execution_id,
        )

    except Exception as e:
        logger.error(
            "Background workflow execution failed",
            user_id=user_id,
            workflow_type=n8n_request.workflow_type.value,
            error=str(e),
        )

        # Store failed execution
        if hasattr(n8n_request, "execution_id") and n8n_request.execution_id:
            await database.store_n8n_execution(
                n8n_request.execution_id,
                user_id,
                n8n_request.workflow_type.value,
                n8n_request.conversation_id,
                "failed",
                n8n_request.input_data,
                None,
                str(e),
            )

            # Track failed execution
            await _track_ai_triggered_execution(n8n_request.workflow_type.value, 0.0, False, user_id)
