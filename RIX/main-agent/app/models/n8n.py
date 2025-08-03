"""
N8N integration models for RIX Main Agent
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
from app.models.chat import WorkflowType, MessageType


class ExecutionStatus(str, Enum):
    """N8N execution status"""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"
    CANCELLED = "cancelled"


class N8NWorkflowRequest(BaseModel):
    """Request model for N8N workflow execution"""
    workflow_type: WorkflowType = Field(..., description="Type of workflow to execute")
    user_id: str = Field(..., description="User ID")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    input_data: Dict[str, Any] = Field(..., description="Input data for workflow")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class N8NWorkflowResponse(BaseModel):
    """Response model from N8N workflow"""
    conversation_id: str = Field(..., description="Conversation ID")
    user_id: str = Field(..., description="User ID")
    response: str = Field(..., description="Workflow response")
    message_type: MessageType = Field(default=MessageType.TEXT, description="Response message type")
    workflow_type: WorkflowType = Field(..., description="Workflow type that processed the request")
    execution_id: Optional[str] = Field(None, description="N8N execution ID")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Response metadata")


class N8NExecutionInfo(BaseModel):
    """N8N execution information"""
    id: str = Field(..., description="Execution ID")
    workflow_id: str = Field(..., description="Workflow ID")
    workflow_name: str = Field(..., description="Workflow name")
    status: ExecutionStatus = Field(..., description="Execution status")
    started_at: datetime = Field(..., description="Execution start time")
    finished_at: Optional[datetime] = Field(None, description="Execution finish time")
    duration: Optional[float] = Field(None, description="Execution duration in seconds")
    success: bool = Field(..., description="Whether execution was successful")
    error: Optional[str] = Field(None, description="Error message if failed")
    input_data: Optional[Dict[str, Any]] = Field(None, description="Input data")
    output_data: Optional[Dict[str, Any]] = Field(None, description="Output data")


class N8NWorkflowInfo(BaseModel):
    """N8N workflow information"""
    id: str = Field(..., description="Workflow ID")
    name: str = Field(..., description="Workflow name")
    active: bool = Field(..., description="Whether workflow is active")
    tags: List[str] = Field(default_factory=list, description="Workflow tags")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    version: str = Field(..., description="Workflow version")


class N8NWebhookData(BaseModel):
    """Data received from N8N webhook"""
    workflow_type: WorkflowType = Field(..., description="Workflow type")
    execution_id: str = Field(..., description="Execution ID")
    user_id: str = Field(..., description="User ID")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    status: ExecutionStatus = Field(..., description="Execution status")
    result: Optional[Dict[str, Any]] = Field(None, description="Execution result")
    error: Optional[str] = Field(None, description="Error message if failed")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class N8NStatusResponse(BaseModel):
    """N8N service status response"""
    available: bool = Field(..., description="Whether N8N service is available")
    response_time: Optional[float] = Field(None, description="Response time in seconds")
    active_workflows: int = Field(default=0, description="Number of active workflows")
    recent_executions: int = Field(default=0, description="Number of recent executions")
    last_check: datetime = Field(default_factory=datetime.utcnow, description="Last status check timestamp")
    workflows: List[N8NWorkflowInfo] = Field(default_factory=list, description="Available workflows")


class WebhookValidationRequest(BaseModel):
    """Webhook validation request"""
    signature: Optional[str] = Field(None, description="Webhook signature")
    timestamp: Optional[str] = Field(None, description="Request timestamp")
    payload: Dict[str, Any] = Field(..., description="Webhook payload")


class WorkflowTriggerRequest(BaseModel):
    """Manual workflow trigger request"""
    workflow_type: WorkflowType = Field(..., description="Workflow to trigger")
    input_data: Dict[str, Any] = Field(..., description="Input data")
    user_id: str = Field(..., description="User ID")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    async_execution: bool = Field(default=True, description="Whether to execute asynchronously")


class WorkflowTriggerResponse(BaseModel):
    """Workflow trigger response"""
    execution_id: str = Field(..., description="Execution ID")
    status: ExecutionStatus = Field(..., description="Initial execution status")
    message: str = Field(..., description="Response message")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")


class WorkflowDiscoveryRequest(BaseModel):
    """Request for workflow discovery"""
    category: Optional[str] = Field(None, description="Filter by category")
    active_only: bool = Field(default=True, description="Include only active workflows")
    include_metrics: bool = Field(default=False, description="Include performance metrics")


class WorkflowActivationRequest(BaseModel):
    """Request to activate/deactivate workflow"""
    workflow_id: str = Field(..., description="Workflow ID to activate/deactivate")
    active: bool = Field(..., description="Target activation status")
    reason: Optional[str] = Field(None, description="Reason for status change")


class WorkflowActivationResponse(BaseModel):
    """Response to workflow activation request"""
    workflow_id: str = Field(..., description="Workflow ID")
    previous_status: bool = Field(..., description="Previous activation status")
    new_status: bool = Field(..., description="New activation status")
    success: bool = Field(..., description="Whether activation was successful")
    message: str = Field(..., description="Status message")


class AITriggeredExecutionRequest(BaseModel):
    """Request for AI-triggered workflow execution"""
    workflow_type: WorkflowType = Field(..., description="Workflow type to execute")
    user_id: str = Field(..., description="User ID")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    intelligence_context: Dict[str, Any] = Field(..., description="AI intelligence context")
    trigger_confidence: float = Field(default=0.8, description="AI confidence in trigger decision")
    priority: str = Field(default="normal", description="Execution priority")


class WorkflowCategoryInfo(BaseModel):
    """Information about workflow categories"""
    category: str = Field(..., description="Category name")
    workflow_count: int = Field(..., description="Number of workflows in category")
    active_count: int = Field(..., description="Number of active workflows")
    total_executions: int = Field(default=0, description="Total executions in category")
    avg_success_rate: float = Field(default=0.0, description="Average success rate")


class WorkflowPerformanceMetrics(BaseModel):
    """Workflow performance metrics"""
    workflow_id: str = Field(..., description="Workflow ID")
    execution_count: int = Field(default=0, description="Total executions")
    ai_triggered_count: int = Field(default=0, description="AI-triggered executions")
    success_rate: float = Field(default=0.0, description="Success rate (0-1)")
    average_execution_time: float = Field(default=0.0, description="Average execution time in seconds")
    last_execution_at: Optional[datetime] = Field(None, description="Last execution timestamp")
    error_rate: float = Field(default=0.0, description="Error rate (0-1)")


class WorkflowAnalyticsResponse(BaseModel):
    """Workflow analytics response"""
    summary: Dict[str, Any] = Field(..., description="Overall analytics summary")
    categories: List[WorkflowCategoryInfo] = Field(default_factory=list, description="Category breakdown")
    top_performers: List[WorkflowPerformanceMetrics] = Field(default_factory=list, description="Top performing workflows")
    recent_executions: List[Dict[str, Any]] = Field(default_factory=list, description="Recent execution history")
    ai_triggered_stats: Dict[str, Any] = Field(default_factory=dict, description="AI-triggered execution statistics")
    period_days: int = Field(default=7, description="Analytics period in days")


class WorkflowSyncRequest(BaseModel):
    """Request to sync workflows from N8N instance"""
    force_refresh: bool = Field(default=False, description="Force refresh from N8N API")
    update_metadata: bool = Field(default=True, description="Update workflow metadata")
    categorize_workflows: bool = Field(default=True, description="Auto-categorize workflows")


class WorkflowSyncResponse(BaseModel):
    """Response from workflow sync operation"""
    synced_count: int = Field(..., description="Number of workflows synced")
    updated_count: int = Field(..., description="Number of workflows updated")
    new_count: int = Field(..., description="Number of new workflows discovered")
    categories: List[str] = Field(default_factory=list, description="Categories found")
    success: bool = Field(..., description="Whether sync was successful")
    message: str = Field(..., description="Sync result message")
    sync_timestamp: datetime = Field(default_factory=datetime.utcnow, description="Sync completion time")