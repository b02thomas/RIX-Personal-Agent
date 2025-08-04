# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/core_apis.py
# Direct API service implementations for RIX Personal Agent
# Provides core functionality for all 7 future Sub-Agent workflows
# RELEVANT FILES: core/database.py, models/schemas.py, api/endpoints/*

import logging
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date, timedelta
import json

from app.core.database import database, log_mcp_interaction
from app.models.schemas import (
    # Project & Task Models
    ProjectCreate, ProjectUpdate, Project,
    TaskCreate, TaskUpdate, Task,
    # Calendar Models
    CalendarEventCreate, CalendarEventUpdate, CalendarEvent,
    ProductivityTrackingCreate, ProductivityTracking,
    # Routine Models
    RoutineCreate, RoutineUpdate, Routine,
    RoutineCompletionCreate, RoutineCompletion,
    # Knowledge Models
    KnowledgeEntryCreate, KnowledgeEntryUpdate, KnowledgeEntry,
    KnowledgeSearchRequest,
    # Goal Models
    GoalCreate, GoalUpdate, Goal,
    GoalProgressCreate, GoalProgress,
    # Analytics Models
    BehavioralAnalyticsCreate, BehavioralAnalytics,
    # Pagination
    PaginationParams, PaginatedResponse
)

logger = logging.getLogger(__name__)


class CoreAPIService:
    """
    Core API service providing direct database operations
    Handles CRUD operations for all 7 future Sub-Agent workflows
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def log_interaction(
        self,
        user_id: str,
        sub_agent_type: str,
        action: str,
        request_data: Dict[str, Any],
        response_data: Optional[Dict[str, Any]] = None,
        processing_time_ms: Optional[int] = None,
        error: Optional[str] = None
    ):
        """Log API interaction for future MCP compatibility"""
        await log_mcp_interaction(
            user_id=user_id,
            sub_agent_type=sub_agent_type,
            endpoint=f"/api/{sub_agent_type}/{action}",
            request_payload=request_data,
            response_payload=response_data,
            processing_time_ms=processing_time_ms,
            status_code=500 if error else 200,
            error_message=error,
            context_metadata={"mode": "direct_api"}
        )

    # ==================== PROJECT & TASK MANAGEMENT ====================
    
    async def create_project(self, user_id: str, project_data: ProjectCreate) -> Project:
        """Create a new project for Task Intelligence Hub"""
        start_time = datetime.now()
        
        try:
            # Insert project
            data = project_data.dict()
            data['user_id'] = uuid.UUID(user_id)
            data['id'] = uuid.uuid4()
            
            result = await database.execute(
                """
                INSERT INTO projects (id, user_id, name, description, status, priority, 
                                    start_date, due_date, completion_percentage, tags, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
                """,
                data['id'], data['user_id'], data['name'], data.get('description'),
                data['status'], data['priority'], data.get('start_date'), 
                data.get('due_date'), data['completion_percentage'], 
                data['tags'], json.dumps(data['metadata']),
                fetch_one=True
            )
            
            project = Project(**result)
            
            # Log interaction
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "task", "create_project", 
                project_data.dict(), project.dict(), processing_time
            )
            
            return project
            
        except Exception as e:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "task", "create_project", 
                project_data.dict(), None, processing_time, str(e)
            )
            raise
    
    async def get_projects(self, user_id: str, pagination: PaginationParams) -> PaginatedResponse:
        """Get paginated projects for user"""
        base_query = "SELECT * FROM projects WHERE user_id = $1"
        count_query = "SELECT COUNT(*) FROM projects WHERE user_id = $1"
        
        result = await database.fetch_with_pagination(
            base_query=base_query,
            count_query=count_query,
            params=(uuid.UUID(user_id),),
            page=pagination.page,
            page_size=pagination.page_size,
            order_by=pagination.order_by or "created_at DESC"
        )
        
        # Convert items to Project models
        result['items'] = [Project(**item) for item in result['items']]
        
        return PaginatedResponse(**result)
    
    async def update_project(self, user_id: str, project_id: str, update_data: ProjectUpdate) -> Optional[Project]:
        """Update project"""
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
            return None
        
        # Add timestamp and conditions
        updates.append(f"updated_at = ${param_count}")
        params.append(datetime.now())
        param_count += 1
        
        params.extend([uuid.UUID(user_id), uuid.UUID(project_id)])
        
        query = f"""
            UPDATE projects 
            SET {', '.join(updates)}
            WHERE user_id = ${param_count-1} AND id = ${param_count}
            RETURNING *
        """
        
        result = await database.execute(query, *params, fetch_one=True)
        return Project(**result) if result else None
    
    async def delete_project(self, user_id: str, project_id: str) -> bool:
        """Delete project"""
        result = await database.execute(
            "DELETE FROM projects WHERE user_id = $1 AND id = $2",
            uuid.UUID(user_id), uuid.UUID(project_id)
        )
        return "DELETE 1" in str(result)
    
    async def create_task(self, user_id: str, task_data: TaskCreate) -> Task:
        """Create a new task"""
        start_time = datetime.now()
        
        try:
            data = task_data.dict()
            data['user_id'] = uuid.UUID(user_id)
            data['id'] = uuid.uuid4()
            
            result = await database.execute(
                """
                INSERT INTO tasks (id, user_id, project_id, title, description, status, 
                                 priority, due_date, estimated_duration, tags, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
                """,
                data['id'], data['user_id'], data.get('project_id'),
                data['title'], data.get('description'), data['status'],
                data['priority'], data.get('due_date'), data.get('estimated_duration'),
                data['tags'], json.dumps(data['metadata']),
                fetch_one=True
            )
            
            task = Task(**result)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "task", "create_task", 
                task_data.dict(), task.dict(), processing_time
            )
            
            return task
            
        except Exception as e:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "task", "create_task", 
                task_data.dict(), None, processing_time, str(e)
            )
            raise
    
    async def get_tasks(self, user_id: str, pagination: PaginationParams, 
                       project_id: Optional[str] = None, status: Optional[str] = None) -> PaginatedResponse:
        """Get paginated tasks for user with optional filters"""
        where_conditions = ["user_id = $1"]
        params = [uuid.UUID(user_id)]
        param_count = 2
        
        if project_id:
            where_conditions.append(f"project_id = ${param_count}")
            params.append(uuid.UUID(project_id))
            param_count += 1
            
        if status:
            where_conditions.append(f"status = ${param_count}")
            params.append(status)
            param_count += 1
        
        where_clause = " AND ".join(where_conditions)
        base_query = f"SELECT * FROM tasks WHERE {where_clause}"
        count_query = f"SELECT COUNT(*) FROM tasks WHERE {where_clause}"
        
        result = await database.fetch_with_pagination(
            base_query=base_query,
            count_query=count_query,
            params=tuple(params),
            page=pagination.page,
            page_size=pagination.page_size,
            order_by=pagination.order_by or "created_at DESC"
        )
        
        result['items'] = [Task(**item) for item in result['items']]
        return PaginatedResponse(**result)
    
    # ==================== CALENDAR & SCHEDULING ====================
    
    async def create_calendar_event(self, user_id: str, event_data: CalendarEventCreate) -> CalendarEvent:
        """Create calendar event for Calendar Intelligence Hub"""
        start_time = datetime.now()
        
        try:
            data = event_data.dict()
            data['user_id'] = uuid.UUID(user_id)
            data['id'] = uuid.uuid4()
            
            result = await database.execute(
                """
                INSERT INTO calendar_events (id, user_id, title, description, start_time, end_time,
                                           event_type, location, attendees, is_all_day, is_recurring,
                                           recurrence_rule, priority, productivity_category, tags, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
                """,
                data['id'], data['user_id'], data['title'], data.get('description'),
                data['start_time'], data['end_time'], data['event_type'], data.get('location'),
                json.dumps(data['attendees']), data['is_all_day'], data['is_recurring'],
                json.dumps(data.get('recurrence_rule')), data['priority'], 
                data.get('productivity_category'), data['tags'], json.dumps(data['metadata']),
                fetch_one=True
            )
            
            event = CalendarEvent(**result)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "calendar", "create_event", 
                event_data.dict(), event.dict(), processing_time
            )
            
            return event
            
        except Exception as e:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "calendar", "create_event", 
                event_data.dict(), None, processing_time, str(e)
            )
            raise
    
    async def get_calendar_events(self, user_id: str, start_date: date, end_date: date) -> List[CalendarEvent]:
        """Get calendar events for date range"""
        result = await database.execute(
            """
            SELECT * FROM calendar_events 
            WHERE user_id = $1 AND DATE(start_time) BETWEEN $2 AND $3
            ORDER BY start_time ASC
            """,
            uuid.UUID(user_id), start_date, end_date,
            fetch=True
        )
        
        return [CalendarEvent(**event) for event in result]
    
    async def detect_calendar_conflicts(self, user_id: str, start_time: datetime, end_time: datetime, 
                                      exclude_event_id: Optional[str] = None) -> List[CalendarEvent]:
        """Detect calendar conflicts for Calendar Intelligence Hub"""
        conditions = ["user_id = $1", "start_time < $3", "end_time > $2"]
        params = [uuid.UUID(user_id), start_time, end_time]
        
        if exclude_event_id:
            conditions.append("id != $4")
            params.append(uuid.UUID(exclude_event_id))
        
        where_clause = " AND ".join(conditions)
        
        result = await database.execute(
            f"SELECT * FROM calendar_events WHERE {where_clause} ORDER BY start_time",
            *params, fetch=True
        )
        
        return [CalendarEvent(**event) for event in result]
    
    # ==================== ROUTINE MANAGEMENT ====================
    
    async def create_routine(self, user_id: str, routine_data: RoutineCreate) -> Routine:
        """Create routine for Routine Intelligence Hub"""
        start_time = datetime.now()
        
        try:
            data = routine_data.dict()
            data['user_id'] = uuid.UUID(user_id)
            data['id'] = uuid.uuid4()
            
            result = await database.execute(
                """
                INSERT INTO user_routines (id, user_id, name, description, routine_type,
                                         habits, frequency, time_slots, difficulty_level)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
                """,
                data['id'], data['user_id'], data['name'], data.get('description'),
                data['routine_type'], json.dumps(data['habits']), 
                json.dumps(data['frequency']), json.dumps(data['time_slots']),
                data['difficulty_level'],
                fetch_one=True
            )
            
            routine = Routine(**result)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "routine", "create_routine", 
                routine_data.dict(), routine.dict(), processing_time
            )
            
            return routine
            
        except Exception as e:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "routine", "create_routine", 
                routine_data.dict(), None, processing_time, str(e)
            )
            raise
    
    async def get_routines(self, user_id: str, active_only: bool = True) -> List[Routine]:
        """Get user routines"""
        query = "SELECT * FROM user_routines WHERE user_id = $1"
        params = [uuid.UUID(user_id)]
        
        if active_only:
            query += " AND is_active = true"
        
        query += " ORDER BY created_at DESC"
        
        result = await database.execute(query, *params, fetch=True)
        return [Routine(**routine) for routine in result]
    
    async def record_routine_completion(self, user_id: str, completion_data: RoutineCompletionCreate) -> RoutineCompletion:
        """Record routine completion"""
        data = completion_data.dict()
        data['user_id'] = uuid.UUID(user_id)
        data['id'] = uuid.uuid4()
        
        result = await database.upsert(
            table="daily_routine_completions",
            data=data,
            conflict_columns=["user_id", "routine_id", "completion_date"],
            update_columns=["habits_completed", "completion_percentage", "quality_rating", 
                          "notes", "mood_before", "mood_after", "energy_level", "created_at"]
        )
        
        return RoutineCompletion(**result)
    
    async def get_routine_streak(self, user_id: str, routine_id: str) -> Dict[str, Any]:
        """Calculate routine streak using database function"""
        current_streak = await database.execute(
            "SELECT calculate_routine_streak($1, $2) as streak",
            uuid.UUID(user_id), uuid.UUID(routine_id),
            fetch_val=True
        )
        
        # Get longest streak from analytics
        longest_streak = await database.execute(
            """
            SELECT COALESCE(MAX(longest_streak), 0) as longest
            FROM routine_analytics 
            WHERE user_id = $1 AND routine_id = $2
            """,
            uuid.UUID(user_id), uuid.UUID(routine_id),
            fetch_val=True
        )
        
        return {
            "current_streak": current_streak or 0,
            "longest_streak": longest_streak or 0
        }
    
    # ==================== KNOWLEDGE MANAGEMENT ====================
    
    async def create_knowledge_entry(self, user_id: str, entry_data: KnowledgeEntryCreate) -> KnowledgeEntry:
        """Create knowledge entry for Knowledge Intelligence Hub"""
        start_time = datetime.now()
        
        try:
            data = entry_data.dict()
            data['user_id'] = uuid.UUID(user_id)
            data['id'] = uuid.uuid4()
            
            # TODO: Generate embedding using future Sub-Agent
            # For now, store without embedding - will be updated by Sub-Agent
            
            result = await database.execute(
                """
                INSERT INTO knowledge_entries (id, user_id, title, content, entry_type, category,
                                             tags, source_url, confidence_score, importance_score,
                                             related_entries, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
                """,
                data['id'], data['user_id'], data['title'], data['content'],
                data['entry_type'], data.get('category'), data['tags'], 
                data.get('source_url'), data['confidence_score'], data['importance_score'],
                data['related_entries'], json.dumps(data['metadata']),
                fetch_one=True
            )
            
            entry = KnowledgeEntry(**result)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "knowledge", "create_entry", 
                entry_data.dict(), entry.dict(), processing_time
            )
            
            return entry
            
        except Exception as e:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "knowledge", "create_entry", 
                entry_data.dict(), None, processing_time, str(e)
            )
            raise
    
    async def search_knowledge_entries(self, user_id: str, search_request: KnowledgeSearchRequest) -> List[Dict[str, Any]]:
        """Search knowledge entries (text-based for now, vector search with future Sub-Agent)"""
        # For now, do text-based search
        # TODO: Vector search will be implemented with future Sub-Agent embeddings
        
        query = """
            SELECT *, 
                   ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $2)) as relevance_score
            FROM knowledge_entries 
            WHERE user_id = $1 
            AND (title ILIKE $3 OR content ILIKE $3)
        """
        
        params = [uuid.UUID(user_id), search_request.query, f"%{search_request.query}%"]
        
        if search_request.category:
            query += " AND category = $4"
            params.append(search_request.category)
            
        if search_request.entry_type:
            param_num = len(params) + 1
            query += f" AND entry_type = ${param_num}"
            params.append(search_request.entry_type)
        
        query += f" ORDER BY relevance_score DESC LIMIT {search_request.limit}"
        
        result = await database.execute(query, *params, fetch=True)
        
        return [
            {
                "entry": KnowledgeEntry(**row),
                "similarity_score": float(row.get('relevance_score', 0))
            }
            for row in result
        ]
    
    # ==================== GOAL MANAGEMENT ====================
    
    async def create_goal(self, user_id: str, goal_data: GoalCreate) -> Goal:
        """Create goal for Goal Intelligence Hub"""
        start_time = datetime.now()
        
        try:
            data = goal_data.dict()
            data['user_id'] = uuid.UUID(user_id)
            data['id'] = uuid.uuid4()
            
            result = await database.execute(
                """
                INSERT INTO user_goals (id, user_id, title, description, goal_type, category,
                                      target_value, current_value, unit, priority, start_date,
                                      target_date, tracking_frequency, ai_insights)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
                """,
                data['id'], data['user_id'], data['title'], data.get('description'),
                data['goal_type'], data.get('category'), data.get('target_value'),
                data['current_value'], data.get('unit'), data['priority'],
                data.get('start_date'), data.get('target_date'), 
                data['tracking_frequency'], json.dumps(data['ai_insights']),
                fetch_one=True
            )
            
            goal = Goal(**result)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "goal", "create_goal", 
                goal_data.dict(), goal.dict(), processing_time
            )
            
            return goal
            
        except Exception as e:
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            await self.log_interaction(
                user_id, "goal", "create_goal", 
                goal_data.dict(), None, processing_time, str(e)
            )
            raise
    
    async def get_goals(self, user_id: str, status: Optional[str] = None) -> List[Goal]:
        """Get user goals"""
        query = "SELECT * FROM user_goals WHERE user_id = $1"
        params = [uuid.UUID(user_id)]
        
        if status:
            query += " AND status = $2"
            params.append(status)
        
        query += " ORDER BY priority DESC, created_at DESC"
        
        result = await database.execute(query, *params, fetch=True)
        return [Goal(**goal) for goal in result]
    
    async def record_goal_progress(self, user_id: str, progress_data: GoalProgressCreate) -> GoalProgress:
        """Record goal progress"""
        data = progress_data.dict()
        data['user_id'] = uuid.UUID(user_id)
        data['id'] = uuid.uuid4()
        
        # Insert progress entry
        result = await database.execute(
            """
            INSERT INTO goal_progress_entries (id, goal_id, user_id, progress_value, notes,
                                             milestone_reached, confidence_level, energy_level, recorded_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            """,
            data['id'], data['goal_id'], data['user_id'], data['progress_value'],
            data.get('notes'), data['milestone_reached'], data.get('confidence_level'),
            data.get('energy_level'), data.get('recorded_at') or datetime.now(),
            fetch_one=True
        )
        
        # Update goal's current value
        await database.execute(
            "UPDATE user_goals SET current_value = $1, updated_at = NOW() WHERE id = $2",
            data['progress_value'], data['goal_id']
        )
        
        return GoalProgress(**result)
    
    # ==================== BEHAVIORAL ANALYTICS ====================
    
    async def create_behavioral_analysis(self, user_id: str, analysis_data: BehavioralAnalyticsCreate) -> BehavioralAnalytics:
        """Create behavioral analysis for Behavioral Analytics Engine"""
        data = analysis_data.dict()
        data['user_id'] = uuid.UUID(user_id)
        data['id'] = uuid.uuid4()
        
        result = await database.execute(
            """
            INSERT INTO behavioral_analytics (id, user_id, analysis_type, analysis_period,
                                            period_start, period_end, insights, correlations,
                                            recommendations, confidence_score, metrics)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            """,
            data['id'], data['user_id'], data['analysis_type'], data['analysis_period'],
            data['period_start'], data['period_end'], json.dumps(data['insights']),
            json.dumps(data['correlations']), json.dumps(data['recommendations']),
            data['confidence_score'], json.dumps(data['metrics']),
            fetch_one=True
        )
        
        return BehavioralAnalytics(**result)
    
    async def get_behavioral_analytics(self, user_id: str, analysis_type: Optional[str] = None, 
                                     period: Optional[str] = None) -> List[BehavioralAnalytics]:
        """Get behavioral analytics"""
        query = "SELECT * FROM behavioral_analytics WHERE user_id = $1"
        params = [uuid.UUID(user_id)]
        
        if analysis_type:
            query += " AND analysis_type = $2"
            params.append(analysis_type)
            
        if period:
            param_num = len(params) + 1
            query += f" AND analysis_period = ${param_num}"
            params.append(period)
        
        query += " ORDER BY created_at DESC"
        
        result = await database.execute(query, *params, fetch=True)
        return [BehavioralAnalytics(**analysis) for analysis in result]


# Global service instance
core_api_service = CoreAPIService()