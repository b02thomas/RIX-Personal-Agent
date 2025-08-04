# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/api/endpoints/tasks.py
# Task & project management APIs for Task Intelligence Hub
# Direct API endpoints with future MCP compatibility
# RELEVANT FILES: services/core_apis.py, services/intelligence/project_health.py, models/schemas.py

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
import uuid
import logging

from app.models.schemas import (
    # Project models
    Project, ProjectCreate, ProjectUpdate, 
    # Task models  
    Task, TaskCreate, TaskUpdate,
    # Response models
    PaginatedResponse, PaginationParams, APIResponse, ProjectHealthResponse
)
from app.services.core_apis import core_api_service
from app.services.intelligence.project_health import project_health_service
from app.middleware.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== PROJECT ENDPOINTS ====================

@router.post("/projects", response_model=Project)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new project for Task Intelligence Hub"""
    try:
        project = await core_api_service.create_project(
            user_id=current_user["user_id"],
            project_data=project_data
        )
        return project
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects", response_model=PaginatedResponse)
async def get_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    order_by: Optional[str] = Query("created_at DESC"),
    current_user: dict = Depends(get_current_user)
):
    """Get paginated list of user projects"""
    try:
        pagination = PaginationParams(page=page, page_size=page_size, order_by=order_by)
        
        # Apply status filter if provided
        if status:
            # This would need to be implemented in core_apis.py
            pass
            
        projects = await core_api_service.get_projects(
            user_id=current_user["user_id"],
            pagination=pagination
        )
        return projects
    except Exception as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}", response_model=Project)
async def get_project(
    project_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get specific project by ID"""
    try:
        project = await core_api_service.database.execute(
            "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
            uuid.UUID(project_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        return Project(**project)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    except Exception as e:
        logger.error(f"Error fetching project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str = Path(...),
    update_data: ProjectUpdate = ...,
    current_user: dict = Depends(get_current_user)
):
    """Update project"""
    try:
        project = await core_api_service.update_project(
            user_id=current_user["user_id"],
            project_id=project_id,
            update_data=update_data
        )
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        return project
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}", response_model=APIResponse)
async def delete_project(
    project_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Delete project"""
    try:
        success = await core_api_service.delete_project(
            user_id=current_user["user_id"],
            project_id=project_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
            
        return APIResponse(
            success=True,
            message="Project deleted successfully"
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/health", response_model=ProjectHealthResponse)
async def get_project_health(
    project_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get project health assessment from intelligence service"""
    try:
        health_assessment = await project_health_service.assess_project_health(
            user_id=current_user["user_id"],
            project_id=project_id
        )
        return health_assessment
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    except Exception as e:
        logger.error(f"Error assessing project health: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TASK ENDPOINTS ====================

@router.post("/tasks", response_model=Task)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new task"""
    try:
        task = await core_api_service.create_task(
            user_id=current_user["user_id"],
            task_data=task_data
        )
        return task
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks", response_model=PaginatedResponse)
async def get_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority_min: Optional[int] = Query(None, ge=1, le=10),
    priority_max: Optional[int] = Query(None, ge=1, le=10),
    due_before: Optional[str] = Query(None),
    order_by: Optional[str] = Query("created_at DESC"),
    current_user: dict = Depends(get_current_user)
):
    """Get paginated list of user tasks with filters"""
    try:
        pagination = PaginationParams(page=page, page_size=page_size, order_by=order_by)
        
        tasks = await core_api_service.get_tasks(
            user_id=current_user["user_id"],
            pagination=pagination,
            project_id=project_id,
            status=status
        )
        return tasks
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(
    task_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get specific task by ID"""
    try:
        task = await core_api_service.database.execute(
            "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
            uuid.UUID(task_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        return Task(**task)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except Exception as e:
        logger.error(f"Error fetching task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str = Path(...),
    update_data: TaskUpdate = ...,
    current_user: dict = Depends(get_current_user)
):
    """Update task"""
    try:
        # Build dynamic UPDATE query
        updates = []
        params = []
        param_count = 1
        
        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                updates.append(f"{field} = ${param_count}")
                params.append(value)
                param_count += 1
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add timestamp and conditions
        updates.append(f"updated_at = NOW()")
        params.extend([uuid.UUID(current_user["user_id"]), uuid.UUID(task_id)])
        
        query = f"""
            UPDATE tasks 
            SET {', '.join(updates)}
            WHERE user_id = ${param_count} AND id = ${param_count + 1}
            RETURNING *
        """
        
        result = await core_api_service.database.execute(
            query, *params, fetch_one=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Task not found")
            
        return Task(**result)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tasks/{task_id}", response_model=APIResponse)
async def delete_task(
    task_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Delete task"""
    try:
        result = await core_api_service.database.execute(
            "DELETE FROM tasks WHERE user_id = $1 AND id = $2",
            uuid.UUID(current_user["user_id"]), uuid.UUID(task_id)
        )
        
        if "DELETE 0" in str(result):
            raise HTTPException(status_code=404, detail="Task not found")
            
        return APIResponse(
            success=True,
            message="Task deleted successfully"
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/complete", response_model=Task)
async def complete_task(
    task_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Mark task as completed"""
    try:
        from datetime import datetime
        
        result = await core_api_service.database.execute(
            """
            UPDATE tasks 
            SET status = 'completed', completion_date = $1, updated_at = NOW()
            WHERE user_id = $2 AND id = $3
            RETURNING *
            """,
            datetime.now(), uuid.UUID(current_user["user_id"]), uuid.UUID(task_id),
            fetch_one=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Task not found")
            
        return Task(**result)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except Exception as e:
        logger.error(f"Error completing task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BULK OPERATIONS ====================

@router.post("/tasks/bulk-update", response_model=APIResponse)
async def bulk_update_tasks(
    task_ids: List[str],
    update_data: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Bulk update multiple tasks"""
    try:
        updated_count = 0
        
        for task_id in task_ids:
            try:
                task = await core_api_service.update_task(
                    user_id=current_user["user_id"],
                    task_id=task_id,
                    update_data=update_data
                )
                if task:
                    updated_count += 1
            except Exception as e:
                logger.warning(f"Failed to update task {task_id}: {e}")
                continue
        
        return APIResponse(
            success=True,
            message=f"Updated {updated_count} out of {len(task_ids)} tasks",
            data={"updated_count": updated_count, "total_requested": len(task_ids)}
        )
    except Exception as e:
        logger.error(f"Error in bulk update: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/tasks", response_model=PaginatedResponse)
async def get_project_tasks(
    project_id: str = Path(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    order_by: Optional[str] = Query("priority DESC, created_at ASC"),
    current_user: dict = Depends(get_current_user)
):
    """Get all tasks for a specific project"""
    try:
        pagination = PaginationParams(page=page, page_size=page_size, order_by=order_by)
        
        tasks = await core_api_service.get_tasks(
            user_id=current_user["user_id"],
            pagination=pagination,
            project_id=project_id,
            status=status
        )
        return tasks
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    except Exception as e:
        logger.error(f"Error fetching project tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ANALYTICS ENDPOINTS ====================

@router.get("/tasks/analytics/summary")
async def get_task_analytics_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get task completion analytics summary"""
    try:
        from datetime import date, timedelta
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get task statistics
        stats = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
                COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue_tasks,
                AVG(CASE WHEN status = 'completed' THEN priority ELSE NULL END) as avg_completed_priority,
                AVG(CASE WHEN status = 'completed' AND actual_duration IS NOT NULL 
                         THEN actual_duration ELSE NULL END) as avg_completion_time_minutes
            FROM tasks 
            WHERE user_id = $1 AND created_at::date BETWEEN $2 AND $3
            """,
            uuid.UUID(current_user["user_id"]), start_date, end_date,
            fetch_one=True
        )
        
        # Calculate completion rate
        completion_rate = 0.0
        if stats['total_tasks'] > 0:
            completion_rate = stats['completed_tasks'] / stats['total_tasks']
        
        # Get project health scores
        project_health = await core_api_service.database.execute(
            """
            SELECT AVG(ai_health_score) as avg_health_score
            FROM projects 
            WHERE user_id = $1 AND status = 'active'
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_val=True
        )
        
        return {
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            "summary": {
                "total_tasks": stats['total_tasks'],
                "completed_tasks": stats['completed_tasks'],
                "in_progress_tasks": stats['in_progress_tasks'],
                "overdue_tasks": stats['overdue_tasks'],
                "completion_rate": completion_rate,
                "avg_completed_priority": float(stats['avg_completed_priority']) if stats['avg_completed_priority'] else 0,
                "avg_completion_time_hours": float(stats['avg_completion_time_minutes']) / 60 if stats['avg_completion_time_minutes'] else 0,
                "avg_project_health": float(project_health) if project_health else 50
            }
        }
    except Exception as e:
        logger.error(f"Error generating task analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/analytics/health-trends")
async def get_project_health_trends(
    days: int = Query(30, ge=7, le=90),
    current_user: dict = Depends(get_current_user)
):
    """Get project health trends over time"""
    try:
        health_history = await core_api_service.database.execute(
            """
            SELECT 
                phm.calculated_at::date as date,
                AVG(phm.health_score) as avg_health_score,
                COUNT(*) as projects_assessed
            FROM project_health_metrics phm
            JOIN projects p ON phm.project_id = p.id
            WHERE p.user_id = $1 
            AND phm.calculated_at >= NOW() - INTERVAL '%s days'
            GROUP BY phm.calculated_at::date
            ORDER BY date DESC
            """ % days,
            uuid.UUID(current_user["user_id"]),
            fetch=True
        )
        
        return {
            "period_days": days,
            "health_trends": [
                {
                    "date": entry['date'].isoformat(),
                    "avg_health_score": float(entry['avg_health_score']),
                    "projects_assessed": entry['projects_assessed']
                }
                for entry in health_history
            ]
        }
    except Exception as e:
        logger.error(f"Error generating health trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))