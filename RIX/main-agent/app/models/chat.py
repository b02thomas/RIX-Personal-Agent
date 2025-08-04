"""
Chat models for RIX Main Agent
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MessageType(str, Enum):
    """Message types"""

    TEXT = "text"
    VOICE = "voice"
    IMAGE = "image"
    FILE = "file"
    STRUCTURED = "structured"


class WorkflowType(str, Enum):
    """N8N workflow types"""

    MASTER_BRAIN = "master-brain"
    VOICE_PROCESSING = "voice-processing"
    NEWS_INTELLIGENCE = "news-intelligence"
    CALENDAR_INTELLIGENCE = "calendar-intelligence"
    TASK_MANAGEMENT = "task-management"
    PROJECT_CHATBOT = "project-chatbot"
    MORNING_BRIEF = "morning-brief"
    NOTIFICATION_MANAGEMENT = "notification-management"
    ANALYTICS_LEARNING = "analytics-learning"
    # Phase 5 Intelligence Features
    ROUTINE_COACHING = "routine-coaching"
    PROJECT_INTELLIGENCE = "project-intelligence"
    CALENDAR_OPTIMIZATION = "calendar-optimization"


class MessageRequest(BaseModel):
    """Request model for sending a message"""

    conversation_id: str = Field(..., description="Conversation ID")
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")
    message_type: MessageType = Field(default=MessageType.TEXT, description="Message type")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class MessageResponse(BaseModel):
    """Response model for a message"""

    id: str = Field(..., description="Message ID")
    conversation_id: str = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="User ID")
    content: str = Field(..., description="Message content")
    message_type: MessageType = Field(..., description="Message type")
    is_from_ai: bool = Field(..., description="Whether message is from AI")
    created_at: datetime = Field(..., description="Message creation timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class ConversationResponse(BaseModel):
    """Response model for conversation with messages"""

    id: str = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="User ID")
    title: str = Field(..., description="Conversation title")
    created_at: datetime = Field(..., description="Conversation creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    messages: List[MessageResponse] = Field(default_factory=list, description="Conversation messages")


class AIProcessingRequest(BaseModel):
    """Request model for AI processing"""

    user_id: str = Field(..., description="User ID")
    conversation_id: str = Field(..., description="Conversation ID")
    message: str = Field(..., description="User message")
    context: Optional[Dict[str, Any]] = Field(None, description="Conversation context")
    preferred_workflow: Optional[WorkflowType] = Field(None, description="Preferred workflow for processing")


class AIProcessingResponse(BaseModel):
    """Response model for AI processing"""

    conversation_id: str = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="User ID")
    response: str = Field(..., description="AI response")
    message_type: MessageType = Field(default=MessageType.TEXT, description="Response message type")
    workflow_type: WorkflowType = Field(..., description="Workflow used for processing")
    processing_time: float = Field(..., description="Processing time in seconds")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Response confidence score")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional processing metadata")


class ContentAnalysisResult(BaseModel):
    """Result of content analysis for workflow routing"""

    recommended_workflow: WorkflowType = Field(..., description="Recommended workflow")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in recommendation")
    reasoning: str = Field(..., description="Reasoning for workflow selection")
    keywords: List[str] = Field(default_factory=list, description="Extracted keywords")
    intent: Optional[str] = Field(None, description="Detected user intent")
    entities: List[Dict[str, Any]] = Field(default_factory=list, description="Extracted entities")


class WebSocketMessage(BaseModel):
    """WebSocket message structure"""

    type: str = Field(..., description="Message type")
    data: Dict[str, Any] = Field(..., description="Message data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")


class TypingIndicator(BaseModel):
    """Typing indicator message"""

    user_id: str = Field(..., description="User ID")
    conversation_id: str = Field(..., description="Conversation ID")
    is_typing: bool = Field(..., description="Whether user is typing")
