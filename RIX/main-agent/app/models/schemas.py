# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/models/schemas.py
# Complete Pydantic database models for RIX Personal Agent
# Supports all 7 future Sub-Agent workflows with comprehensive validation
# RELEVANT FILES: core/database.py, api/endpoints/*, database/schema.sql

import uuid
from datetime import date, datetime, time
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, EmailStr, Field, validator


# Base Classes
class TimestampedModel(BaseModel):
    """Base model with timestamp fields"""

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class RIXBaseModel(BaseModel):
    """Base model for RIX entities with common fields"""

    id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat(), date: lambda v: v.isoformat(), uuid.UUID: lambda v: str(v)}


# Enums
class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventType(str, Enum):
    MEETING = "meeting"
    TASK = "task"
    PERSONAL = "personal"
    BREAK = "break"
    FOCUS = "focus"


class ProductivityCategory(str, Enum):
    DEEP_WORK = "deep_work"
    COLLABORATION = "collaboration"
    ADMINISTRATIVE = "administrative"
    PERSONAL = "personal"


class RoutineType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class KnowledgeEntryType(str, Enum):
    NOTE = "note"
    ARTICLE = "article"
    IDEA = "idea"
    REFERENCE = "reference"
    INSIGHT = "insight"


class GoalType(str, Enum):
    PERSONAL = "personal"
    PROFESSIONAL = "professional"
    HEALTH = "health"
    LEARNING = "learning"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class AnalysisPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# User Management Models
class UserBase(BaseModel):
    """Base user model"""

    email: EmailStr
    full_name: str
    timezone: str = "UTC"


class UserCreate(UserBase):
    """User creation model"""

    password: str

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserUpdate(BaseModel):
    """User update model"""

    full_name: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None


class User(RIXBaseModel, UserBase, TimestampedModel):
    """Complete user model"""

    is_active: bool = True
    is_verified: bool = False
    avatar_url: Optional[str] = None
    last_active_at: Optional[datetime] = None


class UserPreferences(RIXBaseModel, TimestampedModel):
    """User preferences model"""

    user_id: uuid.UUID
    theme: str = "dark"
    language: str = "en"
    timezone: str = "UTC"
    notification_settings: Dict[str, Any] = {}
    ai_preferences: Dict[str, Any] = {}
    privacy_settings: Dict[str, Any] = {}


# Chat & Conversation Models
class ConversationBase(BaseModel):
    """Base conversation model"""

    title: Optional[str] = None
    conversation_type: str = "general"
    context_metadata: Dict[str, Any] = {}


class ConversationCreate(ConversationBase):
    """Conversation creation model"""

    pass


class Conversation(RIXBaseModel, ConversationBase, TimestampedModel):
    """Complete conversation model"""

    user_id: uuid.UUID
    is_active: bool = True


class MessageBase(BaseModel):
    """Base message model"""

    content: str
    message_type: str = "text"
    role: MessageRole
    metadata: Dict[str, Any] = {}


class MessageCreate(MessageBase):
    """Message creation model"""

    conversation_id: uuid.UUID


class Message(RIXBaseModel, MessageBase, TimestampedModel):
    """Complete message model"""

    conversation_id: uuid.UUID
    user_id: uuid.UUID
    embedding: Optional[List[float]] = None
    processing_status: str = "completed"


# Project & Task Management Models
class ProjectBase(BaseModel):
    """Base project model"""

    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    priority: int = Field(default=5, ge=1, le=10)
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completion_percentage: int = Field(default=0, ge=0, le=100)
    tags: List[str] = []
    metadata: Dict[str, Any] = {}


class ProjectCreate(ProjectBase):
    """Project creation model"""

    pass


class ProjectUpdate(BaseModel):
    """Project update model"""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class Project(RIXBaseModel, ProjectBase, TimestampedModel):
    """Complete project model"""

    user_id: uuid.UUID
    ai_health_score: int = Field(default=50, ge=0, le=100)


class TaskBase(BaseModel):
    """Base task model"""

    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: int = Field(default=5, ge=1, le=10)
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None  # minutes
    tags: List[str] = []
    metadata: Dict[str, Any] = {}


class TaskCreate(TaskBase):
    """Task creation model"""

    project_id: Optional[uuid.UUID] = None


class TaskUpdate(BaseModel):
    """Task update model"""

    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    actual_duration: Optional[int] = None
    completion_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class Task(RIXBaseModel, TaskBase, TimestampedModel):
    """Complete task model"""

    user_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    actual_duration: Optional[int] = None
    completion_date: Optional[datetime] = None


# Calendar & Scheduling Models
class CalendarEventBase(BaseModel):
    """Base calendar event model"""

    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    event_type: EventType = EventType.MEETING
    location: Optional[str] = None
    attendees: Dict[str, Any] = {}
    is_all_day: bool = False
    is_recurring: bool = False
    recurrence_rule: Optional[Dict[str, Any]] = None
    priority: int = Field(default=5, ge=1, le=10)
    productivity_category: Optional[ProductivityCategory] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}


class CalendarEventCreate(CalendarEventBase):
    """Calendar event creation model"""

    pass


class CalendarEventUpdate(BaseModel):
    """Calendar event update model"""

    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_type: Optional[EventType] = None
    location: Optional[str] = None
    attendees: Optional[Dict[str, Any]] = None
    is_all_day: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[Dict[str, Any]] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    productivity_category: Optional[ProductivityCategory] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class CalendarEvent(RIXBaseModel, CalendarEventBase, TimestampedModel):
    """Complete calendar event model"""

    user_id: uuid.UUID


class ProductivityTrackingBase(BaseModel):
    """Base productivity tracking model"""

    date: date
    productivity_score: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    focus_quality: Optional[int] = Field(None, ge=1, le=10)
    completion_status: Optional[str] = None
    notes: Optional[str] = None
    time_block_effectiveness: Optional[int] = Field(None, ge=1, le=10)


class ProductivityTrackingCreate(ProductivityTrackingBase):
    """Productivity tracking creation model"""

    event_id: Optional[uuid.UUID] = None


class ProductivityTracking(RIXBaseModel, ProductivityTrackingBase):
    """Complete productivity tracking model"""

    user_id: uuid.UUID
    event_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None


# Routine Management Models
class RoutineBase(BaseModel):
    """Base routine model"""

    name: str
    description: Optional[str] = None
    routine_type: RoutineType = RoutineType.DAILY
    habits: List[Dict[str, Any]] = []
    frequency: Dict[str, Any] = {}
    time_slots: Dict[str, Any] = {}
    difficulty_level: int = Field(default=5, ge=1, le=10)


class RoutineCreate(RoutineBase):
    """Routine creation model"""

    pass


class RoutineUpdate(BaseModel):
    """Routine update model"""

    name: Optional[str] = None
    description: Optional[str] = None
    routine_type: Optional[RoutineType] = None
    habits: Optional[List[Dict[str, Any]]] = None
    frequency: Optional[Dict[str, Any]] = None
    time_slots: Optional[Dict[str, Any]] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=10)
    is_active: Optional[bool] = None


class Routine(RIXBaseModel, RoutineBase, TimestampedModel):
    """Complete routine model"""

    user_id: uuid.UUID
    is_active: bool = True


class RoutineCompletionBase(BaseModel):
    """Base routine completion model"""

    completion_date: date
    habits_completed: List[str] = []
    completion_percentage: int = Field(default=0, ge=0, le=100)
    quality_rating: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    mood_before: Optional[int] = Field(None, ge=1, le=10)
    mood_after: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)


class RoutineCompletionCreate(RoutineCompletionBase):
    """Routine completion creation model"""

    routine_id: uuid.UUID


class RoutineCompletion(RIXBaseModel, RoutineCompletionBase):
    """Complete routine completion model"""

    user_id: uuid.UUID
    routine_id: uuid.UUID
    created_at: Optional[datetime] = None


# Knowledge Management Models
class KnowledgeEntryBase(BaseModel):
    """Base knowledge entry model"""

    title: str
    content: str
    entry_type: KnowledgeEntryType = KnowledgeEntryType.NOTE
    category: Optional[str] = None
    tags: List[str] = []
    source_url: Optional[str] = None
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    importance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    related_entries: List[uuid.UUID] = []
    metadata: Dict[str, Any] = {}


class KnowledgeEntryCreate(KnowledgeEntryBase):
    """Knowledge entry creation model"""

    pass


class KnowledgeEntryUpdate(BaseModel):
    """Knowledge entry update model"""

    title: Optional[str] = None
    content: Optional[str] = None
    entry_type: Optional[KnowledgeEntryType] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    source_url: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    importance_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    related_entries: Optional[List[uuid.UUID]] = None
    metadata: Optional[Dict[str, Any]] = None


class KnowledgeEntry(RIXBaseModel, KnowledgeEntryBase, TimestampedModel):
    """Complete knowledge entry model"""

    user_id: uuid.UUID
    embedding: Optional[List[float]] = None


class KnowledgeSearchRequest(BaseModel):
    """Knowledge search request model"""

    query: str
    limit: int = Field(default=10, ge=1, le=50)
    category: Optional[str] = None
    entry_type: Optional[KnowledgeEntryType] = None
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class KnowledgeSearchResult(BaseModel):
    """Knowledge search result model"""

    entry: KnowledgeEntry
    similarity_score: float


# Goal Management Models
class GoalBase(BaseModel):
    """Base goal model"""

    title: str
    description: Optional[str] = None
    goal_type: GoalType = GoalType.PERSONAL
    category: Optional[str] = None
    target_value: Optional[float] = None
    current_value: float = 0.0
    unit: Optional[str] = None
    priority: int = Field(default=5, ge=1, le=10)
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    tracking_frequency: str = "daily"
    ai_insights: Dict[str, Any] = {}


class GoalCreate(GoalBase):
    """Goal creation model"""

    pass


class GoalUpdate(BaseModel):
    """Goal update model"""

    title: Optional[str] = None
    description: Optional[str] = None
    goal_type: Optional[GoalType] = None
    category: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    status: Optional[GoalStatus] = None
    tracking_frequency: Optional[str] = None
    ai_insights: Optional[Dict[str, Any]] = None


class Goal(RIXBaseModel, GoalBase, TimestampedModel):
    """Complete goal model"""

    user_id: uuid.UUID
    status: GoalStatus = GoalStatus.ACTIVE


class GoalProgressBase(BaseModel):
    """Base goal progress model"""

    progress_value: float
    notes: Optional[str] = None
    milestone_reached: bool = False
    confidence_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    recorded_at: Optional[datetime] = None


class GoalProgressCreate(GoalProgressBase):
    """Goal progress creation model"""

    goal_id: uuid.UUID


class GoalProgress(RIXBaseModel, GoalProgressBase):
    """Complete goal progress model"""

    goal_id: uuid.UUID
    user_id: uuid.UUID
    created_at: Optional[datetime] = None


# Analytics Models
class BehavioralAnalyticsBase(BaseModel):
    """Base behavioral analytics model"""

    analysis_type: str
    analysis_period: AnalysisPeriod
    period_start: date
    period_end: date
    insights: Dict[str, Any] = {}
    correlations: Dict[str, Any] = {}
    recommendations: Dict[str, Any] = {}
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    metrics: Dict[str, Any] = {}


class BehavioralAnalyticsCreate(BehavioralAnalyticsBase):
    """Behavioral analytics creation model"""

    pass


class BehavioralAnalytics(RIXBaseModel, BehavioralAnalyticsBase):
    """Complete behavioral analytics model"""

    user_id: uuid.UUID
    created_at: Optional[datetime] = None


# Dashboard & Summary Models
class DashboardSummary(BaseModel):
    """User dashboard summary model"""

    user_id: uuid.UUID
    full_name: str
    total_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    active_projects: int = 0
    avg_project_health: float = 50.0
    active_goals: int = 0
    completed_goals: int = 0
    active_routines: int = 0
    avg_routine_completion: float = 0.0


# Intelligence Response Models
class IntelligenceResponse(BaseModel):
    """Base intelligence response model"""

    success: bool
    data: Dict[str, Any]
    insights: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    confidence_score: Optional[float] = None
    processing_time_ms: Optional[int] = None


class RoutineCoachingResponse(IntelligenceResponse):
    """Routine coaching response model"""

    streak_info: Optional[Dict[str, Any]] = None
    coaching_message: Optional[str] = None
    motivation_score: Optional[float] = None


class ProjectHealthResponse(IntelligenceResponse):
    """Project health response model"""

    health_score: int
    risk_factors: List[Dict[str, Any]] = []
    success_indicators: List[Dict[str, Any]] = []
    optimization_suggestions: List[Dict[str, Any]] = []
    completion_prediction: Optional[Dict[str, Any]] = None


class CalendarOptimizationResponse(IntelligenceResponse):
    """Calendar optimization response model"""

    suggestions: List[Dict[str, Any]] = []
    conflicts_resolved: int = 0
    productivity_improvements: List[Dict[str, Any]] = []


# MCP Integration Models
class MCPInteractionLog(RIXBaseModel):
    """MCP interaction log model"""

    user_id: uuid.UUID
    sub_agent_type: str
    endpoint_called: str
    request_payload: Optional[Dict[str, Any]] = None
    response_payload: Optional[Dict[str, Any]] = None
    processing_time_ms: Optional[int] = None
    status_code: int = 200
    error_message: Optional[str] = None
    context_metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None


# Pagination Models
class PaginationParams(BaseModel):
    """Pagination parameters"""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    order_by: Optional[str] = "created_at DESC"


class PaginatedResponse(BaseModel):
    """Paginated response model"""

    items: List[Any]
    total_count: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


# API Response Models
class APIResponse(BaseModel):
    """Standard API response model"""

    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    errors: Optional[List[str]] = None


class HealthCheckResponse(BaseModel):
    """Health check response model"""

    status: str
    timestamp: datetime
    services: Dict[str, Any] = {}
    performance: Dict[str, Any] = {}
