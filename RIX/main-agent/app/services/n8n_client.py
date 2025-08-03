"""
N8N integration client for RIX Main Agent
Handles workflow execution and webhook communication
"""

import asyncio
import httpx
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.logging import get_logger
from app.models.chat import WorkflowType, MessageType
from app.models.n8n import (
    N8NWorkflowRequest,
    N8NWorkflowResponse,
    N8NExecutionInfo,
    N8NWorkflowInfo,
    N8NStatusResponse,
    ExecutionStatus
)

logger = get_logger(__name__)


class N8NClient:
    """N8N integration client"""
    
    def __init__(self):
        self.base_url = settings.N8N_BASE_URL
        self.api_key = settings.N8N_API_KEY
        self.jwt_token = settings.N8N_JWT_TOKEN
        self.webhook_secret = settings.N8N_WEBHOOK_SECRET
        
        # MCP endpoint mappings (Model Context Protocol)
        self.mcp_endpoints = {
            WorkflowType.MASTER_BRAIN: settings.MCP_CHAT_ENDPOINT,  # General conversation
            WorkflowType.VOICE_PROCESSING: settings.MCP_VOICE_ENDPOINT,
            WorkflowType.NEWS_INTELLIGENCE: settings.MCP_NEWS_ENDPOINT,
            WorkflowType.CALENDAR_INTELLIGENCE: settings.MCP_CALENDAR_ENDPOINT,
            WorkflowType.TASK_MANAGEMENT: settings.MCP_TASK_ENDPOINT,
            WorkflowType.PROJECT_CHATBOT: settings.MCP_PROJECT_ENDPOINT,
            WorkflowType.MORNING_BRIEF: settings.MCP_BRIEFING_ENDPOINT,
            WorkflowType.NOTIFICATION_MANAGEMENT: settings.MCP_NOTIFICATIONS_ENDPOINT,
            WorkflowType.ANALYTICS_LEARNING: settings.MCP_ANALYTICS_ENDPOINT,
            # Phase 5 Intelligence Features
            WorkflowType.ROUTINE_COACHING: settings.MCP_ROUTINE_COACHING_ENDPOINT,
            WorkflowType.PROJECT_INTELLIGENCE: settings.MCP_PROJECT_INTELLIGENCE_ENDPOINT,
            WorkflowType.CALENDAR_OPTIMIZATION: settings.MCP_CALENDAR_OPTIMIZATION_ENDPOINT,
        }
        
        # Mock execution tracking
        self._mock_executions: Dict[str, N8NExecutionInfo] = {}
        self._use_mock = settings.DEBUG or not self.base_url
    
    async def execute_workflow(self, request: N8NWorkflowRequest) -> N8NWorkflowResponse:
        """Execute N8N workflow"""
        logger.info(
            "Executing N8N workflow",
            workflow_type=request.workflow_type.value,
            user_id=request.user_id,
            conversation_id=request.conversation_id
        )
        
        start_time = time.time()
        
        try:
            if self._use_mock:
                return await self._execute_mock_workflow(request)
            
            # Get MCP endpoint
            endpoint = self.mcp_endpoints.get(request.workflow_type)
            if not endpoint:
                raise ValueError(f"Unknown workflow type: {request.workflow_type}")
            
            # Prepare MCP request data
            mcp_payload = {
                "user_input": request.input_data.get("message", "") if isinstance(request.input_data, dict) else str(request.input_data),
                "context": {
                    "conversation_id": request.conversation_id,
                    "user_id": request.user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "source": "main-agent",
                    **(request.metadata or {})
                },
                "user_id": request.user_id,
                "intent": self._map_workflow_to_intent(request.workflow_type),
                "session_data": {
                    "conversation_id": request.conversation_id,
                    "workflow_type": request.workflow_type.value
                }
            }
            
            # Execute workflow via MCP endpoint
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}{endpoint}",
                    json=mcp_payload,
                    headers=self._get_headers()
                )
                
                response.raise_for_status()
                result_data = response.json()
            
            processing_time = time.time() - start_time
            
            # Parse response
            workflow_response = N8NWorkflowResponse(
                conversation_id=request.conversation_id or "",
                user_id=request.user_id,
                response=result_data.get("response", "Workflow completed successfully"),
                message_type=MessageType(result_data.get("messageType", "text")),
                workflow_type=request.workflow_type,
                execution_id=result_data.get("executionId"),
                processing_time=processing_time,
                metadata=result_data.get("metadata")
            )
            
            logger.info(
                "Workflow execution completed",
                workflow_type=request.workflow_type.value,
                processing_time=processing_time,
                execution_id=workflow_response.execution_id
            )
            
            return workflow_response
            
        except httpx.TimeoutException:
            logger.error("Workflow execution timeout", workflow_type=request.workflow_type.value)
            return await self._create_error_response(
                request, "Workflow execution timed out", time.time() - start_time
            )
        except httpx.HTTPStatusError as e:
            logger.error(
                "Workflow execution HTTP error",
                workflow_type=request.workflow_type.value,
                status_code=e.response.status_code,
                error=str(e)
            )
            return await self._create_error_response(
                request, f"Workflow execution failed: {e.response.status_code}", time.time() - start_time
            )
        except Exception as e:
            logger.error(
                "Workflow execution error",
                workflow_type=request.workflow_type.value,
                error=str(e)
            )
            return await self._create_error_response(
                request, f"Workflow execution failed: {str(e)}", time.time() - start_time
            )
    
    async def _execute_mock_workflow(self, request: N8NWorkflowRequest) -> N8NWorkflowResponse:
        """Execute mock workflow for development/testing"""
        # Simulate processing time
        await asyncio.sleep(0.5)
        
        # Generate mock response based on workflow type
        mock_responses = {
            WorkflowType.MASTER_BRAIN: f"This is a mock AI response to your message. The Master Brain workflow processed your request about: {request.input_data.get('message', 'unknown')}",
            WorkflowType.VOICE_PROCESSING: "Voice processing completed. Audio transcribed and analyzed successfully.",
            WorkflowType.NEWS_INTELLIGENCE: "Here are the latest news updates based on your interests: Technology trends are showing significant growth in AI adoption.",
            WorkflowType.CALENDAR_INTELLIGENCE: "Calendar analysis complete. You have 3 meetings scheduled for today and 2 free time blocks available.",
            WorkflowType.TASK_MANAGEMENT: "Task management update: 5 tasks completed, 3 in progress, 2 overdue items require attention.",
            WorkflowType.PROJECT_CHATBOT: "Project status: Development is on track, current sprint showing 85% completion rate.",
            WorkflowType.MORNING_BRIEF: "Good morning! Here's your daily brief: Weather is sunny, 7 calendar items, 12 unread messages, market up 2%.",
            WorkflowType.NOTIFICATION_MANAGEMENT: "Notification preferences updated. You'll receive alerts for high-priority items only.",
            WorkflowType.ANALYTICS_LEARNING: "Analytics insights: Your productivity peaks between 9-11 AM, consider scheduling important tasks during this window.",
            # Phase 5 Intelligence Features Mock Responses
            WorkflowType.ROUTINE_COACHING: "Based on your routine performance, I suggest adjusting your morning routine: try 5 more minutes of meditation and schedule exercise earlier for better consistency. Your current streak is 12 days!",
            WorkflowType.PROJECT_INTELLIGENCE: "Project health analysis: Your 'RIX Development' project has an AI health score of 87/100. Strengths: consistent progress, good time tracking. Areas for improvement: increase documentation, schedule regular reviews.",
            WorkflowType.CALENDAR_OPTIMIZATION: "Calendar optimization complete: I've identified 3 scheduling improvements. Move your deep work sessions to 9-11 AM when you're most productive, batch similar tasks together, and add 15-minute buffers between meetings."
        }
        
        response_text = mock_responses.get(
            request.workflow_type,
            f"Mock response from {request.workflow_type.value} workflow"
        )
        
        execution_id = f"mock-exec-{int(time.time())}"
        
        # Store mock execution
        self._mock_executions[execution_id] = N8NExecutionInfo(
            id=execution_id,
            workflow_id=f"workflow-{request.workflow_type.value}",
            workflow_name=request.workflow_type.value.replace("-", " ").title(),
            status=ExecutionStatus.COMPLETED,
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
            duration=0.5,
            success=True,
            input_data=request.input_data,
            output_data={"response": response_text}
        )
        
        return N8NWorkflowResponse(
            conversation_id=request.conversation_id or "",
            user_id=request.user_id,
            response=response_text,
            message_type=MessageType.TEXT,
            workflow_type=request.workflow_type,
            execution_id=execution_id,
            processing_time=0.5,
            metadata={
                "mock": True,
                "confidence": 0.95,
                "sources": ["mock-data"],
                "processing_steps": 3
            }
        )
    
    async def _create_error_response(self, request: N8NWorkflowRequest, error_message: str, processing_time: float) -> N8NWorkflowResponse:
        """Create error response for failed workflow execution"""
        return N8NWorkflowResponse(
            conversation_id=request.conversation_id or "",
            user_id=request.user_id,
            response=f"I apologize, but I encountered an issue processing your request: {error_message}. Please try again.",
            message_type=MessageType.TEXT,
            workflow_type=request.workflow_type,
            execution_id=None,
            processing_time=processing_time,
            metadata={
                "error": True,
                "error_message": error_message
            }
        )
    
    async def get_workflow_status(self) -> N8NStatusResponse:
        """Get N8N service status"""
        logger.info("Checking N8N service status")
        
        start_time = time.time()
        
        try:
            if self._use_mock:
                return await self._get_mock_status()
            
            # Check N8N API availability
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/workflows",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                workflows_data = response.json()
            
            response_time = time.time() - start_time
            
            # Get recent executions
            try:
                exec_response = await client.get(
                    f"{self.base_url}/api/v1/executions?limit=10",
                    headers=self._get_headers()
                )
                exec_response.raise_for_status()
                executions_data = exec_response.json()
                recent_executions = len(executions_data.get("data", []))
            except:
                recent_executions = 0
            
            # Parse workflows
            workflows = []
            active_count = 0
            for wf_data in workflows_data.get("data", []):
                if wf_data.get("active", False):
                    active_count += 1
                
                workflows.append(N8NWorkflowInfo(
                    id=wf_data["id"],
                    name=wf_data["name"],
                    active=wf_data.get("active", False),
                    tags=wf_data.get("tags", []),
                    created_at=datetime.fromisoformat(wf_data["createdAt"].replace("Z", "+00:00")),
                    updated_at=datetime.fromisoformat(wf_data["updatedAt"].replace("Z", "+00:00")),
                    version=wf_data.get("versionId", "1.0.0")
                ))
            
            return N8NStatusResponse(
                available=True,
                response_time=response_time,
                active_workflows=active_count,
                recent_executions=recent_executions,
                workflows=workflows
            )
            
        except Exception as e:
            logger.error("N8N status check failed", error=str(e))
            return N8NStatusResponse(
                available=False,
                response_time=time.time() - start_time,
                active_workflows=0,
                recent_executions=0,
                workflows=[]
            )
    
    async def _get_mock_status(self) -> N8NStatusResponse:
        """Get mock N8N status for development"""
        mock_workflows = [
            N8NWorkflowInfo(
                id=f"workflow-{i}",
                name=workflow_type.value.replace("-", " ").title(),
                active=True,
                tags=["mock", "development"],
                created_at=datetime.utcnow() - timedelta(days=30),
                updated_at=datetime.utcnow() - timedelta(days=1),
                version="1.0.0"
            )
            for i, workflow_type in enumerate(WorkflowType, 1)
        ]
        
        return N8NStatusResponse(
            available=True,
            response_time=0.1,
            active_workflows=len(mock_workflows),
            recent_executions=len(self._mock_executions),
            workflows=mock_workflows
        )
    
    async def get_execution_info(self, execution_id: str) -> Optional[N8NExecutionInfo]:
        """Get execution information"""
        if self._use_mock:
            return self._mock_executions.get(execution_id)
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/executions/{execution_id}",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()
            
            return N8NExecutionInfo(
                id=data["id"],
                workflow_id=data["workflowId"],
                workflow_name=data.get("workflowData", {}).get("name", "Unknown"),
                status=ExecutionStatus(data["status"]),
                started_at=datetime.fromisoformat(data["startedAt"].replace("Z", "+00:00")),
                finished_at=datetime.fromisoformat(data["finishedAt"].replace("Z", "+00:00")) if data.get("finishedAt") else None,
                duration=data.get("duration"),
                success=data.get("success", False),
                error=data.get("error"),
                input_data=data.get("inputData"),
                output_data=data.get("outputData")
            )
            
        except Exception as e:
            logger.error("Failed to get execution info", execution_id=execution_id, error=str(e))
            return None
    
    async def discover_workflows(self) -> List[N8NWorkflowInfo]:
        """Discover and categorize available N8N workflows"""
        logger.info("Discovering N8N workflows")
        
        try:
            if self._use_mock:
                return await self._get_mock_workflows()
            
            # Get workflows from N8N API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/workflows",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                workflows_data = response.json()
            
            workflows = []
            for wf_data in workflows_data.get("data", []):
                workflow_info = N8NWorkflowInfo(
                    id=wf_data["id"],
                    name=wf_data["name"],
                    active=wf_data.get("active", False),
                    tags=wf_data.get("tags", []),
                    created_at=datetime.fromisoformat(wf_data["createdAt"].replace("Z", "+00:00")),
                    updated_at=datetime.fromisoformat(wf_data["updatedAt"].replace("Z", "+00:00")),
                    version=wf_data.get("versionId", "1.0.0")
                )
                workflows.append(workflow_info)
            
            logger.info(f"Discovered {len(workflows)} workflows from N8N")
            return workflows
            
        except Exception as e:
            logger.error("Failed to discover workflows", error=str(e))
            return []
    
    async def _get_mock_workflows(self) -> List[N8NWorkflowInfo]:
        """Get mock workflows for development"""
        mock_workflows = []
        workflow_categories = {
            WorkflowType.MASTER_BRAIN: {"category": "communication", "description": "AI-powered general conversation and assistance"},
            WorkflowType.TASK_MANAGEMENT: {"category": "productivity", "description": "Task creation, tracking, and management"},
            WorkflowType.CALENDAR_INTELLIGENCE: {"category": "productivity", "description": "Smart calendar analysis and scheduling"},
            WorkflowType.NEWS_INTELLIGENCE: {"category": "intelligence", "description": "News analysis and personalized updates"},
            WorkflowType.VOICE_PROCESSING: {"category": "communication", "description": "Voice transcription and processing"},
            WorkflowType.PROJECT_CHATBOT: {"category": "productivity", "description": "Project-specific AI assistant"},
            WorkflowType.MORNING_BRIEF: {"category": "intelligence", "description": "Daily briefing and summary generation"},
            WorkflowType.NOTIFICATION_MANAGEMENT: {"category": "automation", "description": "Smart notification processing"},
            WorkflowType.ANALYTICS_LEARNING: {"category": "intelligence", "description": "Analytics insights and learning"},
            # Phase 5 Intelligence Features
            WorkflowType.ROUTINE_COACHING: {"category": "intelligence", "description": "AI-powered routine optimization and coaching"},
            WorkflowType.PROJECT_INTELLIGENCE: {"category": "intelligence", "description": "Project health analysis and insights"},
            WorkflowType.CALENDAR_OPTIMIZATION: {"category": "productivity", "description": "Calendar optimization and scheduling"},
        }
        
        for i, (workflow_type, meta) in enumerate(workflow_categories.items(), 1):
            workflow_info = N8NWorkflowInfo(
                id=f"workflow-{workflow_type.value}-{i}",
                name=workflow_type.value.replace("-", " ").title(),
                active=True,
                tags=["mock", "development", meta["category"]],
                created_at=datetime.utcnow() - timedelta(days=30),
                updated_at=datetime.utcnow() - timedelta(days=1),
                version="1.0.0"
            )
            mock_workflows.append(workflow_info)
        
        return mock_workflows
    
    async def activate_workflow(self, workflow_id: str, active: bool = True) -> bool:
        """Activate or deactivate N8N workflow"""
        logger.info(f"{'Activating' if active else 'Deactivating'} workflow", workflow_id=workflow_id)
        
        try:
            if self._use_mock:
                # Mock activation always succeeds
                logger.info(f"Mock workflow {workflow_id} {'activated' if active else 'deactivated'}")
                return True
            
            # Update workflow status via N8N API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.patch(
                    f"{self.base_url}/api/v1/workflows/{workflow_id}",
                    json={"active": active},
                    headers=self._get_headers()
                )
                response.raise_for_status()
            
            logger.info(f"Workflow {workflow_id} {'activated' if active else 'deactivated'} successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to {'activate' if active else 'deactivate'} workflow", 
                        workflow_id=workflow_id, error=str(e))
            return False
    
    async def execute_ai_triggered_workflow(self, workflow_type: WorkflowType, context: Dict[str, Any], 
                                          user_id: str, conversation_id: str = None) -> N8NWorkflowResponse:
        """Execute workflow triggered by AI intelligence insights"""
        logger.info(
            "Executing AI-triggered workflow",
            workflow_type=workflow_type.value,
            user_id=user_id,
            context_keys=list(context.keys())
        )
        
        # Prepare AI-triggered request with enhanced context
        ai_context = {
            "ai_triggered": True,
            "trigger_source": "intelligence_engine",
            "intelligence_context": context,
            "auto_execution": True,
            "priority": "high"
        }
        
        # Create workflow request with AI context
        request = N8NWorkflowRequest(
            workflow_type=workflow_type,
            user_id=user_id,
            conversation_id=conversation_id,
            input_data={
                "message": context.get("trigger_message", "AI-triggered workflow execution"),
                "ai_context": ai_context,
                "intelligence_data": context
            },
            metadata={
                "ai_triggered": True,
                "intelligence_insights": context.get("insights", {}),
                "trigger_confidence": context.get("confidence", 0.8),
                "auto_execution": True
            }
        )
        
        # Execute the workflow
        response = await self.execute_workflow(request)
        
        # Track AI-triggered execution if workflow ID is available
        if hasattr(self, '_track_ai_execution'):
            await self._track_ai_execution(workflow_type, response.processing_time, response.execution_id is not None)
        
        logger.info(
            "AI-triggered workflow execution completed",
            workflow_type=workflow_type.value,
            execution_id=response.execution_id,
            processing_time=response.processing_time
        )
        
        return response
    
    async def categorize_workflows(self, workflows: List[N8NWorkflowInfo]) -> Dict[str, List[N8NWorkflowInfo]]:
        """Categorize workflows by type and functionality"""
        categories = {
            "productivity": [],
            "communication": [],
            "intelligence": [],
            "automation": [],
            "analytics": [],
            "general": []
        }
        
        # Workflow categorization mapping
        category_mapping = {
            "task": "productivity",
            "calendar": "productivity",
            "project": "productivity",
            "chat": "communication",
            "voice": "communication",
            "conversation": "communication",
            "news": "intelligence",
            "brief": "intelligence",
            "routine": "intelligence",
            "optimization": "intelligence",
            "notification": "automation",
            "webhook": "automation",
            "trigger": "automation",
            "analytics": "analytics",
            "learning": "analytics",
            "metrics": "analytics"
        }
        
        for workflow in workflows:
            # Determine category based on workflow name and tags
            category = "general"
            workflow_name_lower = workflow.name.lower()
            
            # Check name for category keywords
            for keyword, cat in category_mapping.items():
                if keyword in workflow_name_lower:
                    category = cat
                    break
            
            # Check tags for category hints
            for tag in workflow.tags:
                if tag.lower() in category_mapping:
                    category = category_mapping[tag.lower()]
                    break
                elif tag.lower() in categories:
                    category = tag.lower()
                    break
            
            categories[category].append(workflow)
        
        return categories
    
    async def get_workflow_performance_metrics(self, workflow_id: str) -> Dict[str, Any]:
        """Get workflow performance metrics"""
        try:
            if self._use_mock:
                return {
                    "execution_count": 25,
                    "success_rate": 0.96,
                    "average_execution_time": 2.3,
                    "last_execution": datetime.utcnow() - timedelta(hours=2),
                    "ai_triggered_count": 8,
                    "error_rate": 0.04
                }
            
            # In real implementation, this would query N8N metrics API
            # For now, return basic metrics structure
            return {
                "execution_count": 0,
                "success_rate": 0.0,
                "average_execution_time": 0.0,
                "last_execution": None,
                "ai_triggered_count": 0,
                "error_rate": 0.0
            }
            
        except Exception as e:
            logger.error("Failed to get workflow performance metrics", workflow_id=workflow_id, error=str(e))
            return {}
    
    def _map_workflow_to_intent(self, workflow_type: WorkflowType) -> str:
        """Map workflow type to MCP intent string"""
        intent_mapping = {
            WorkflowType.TASK_MANAGEMENT: "task.create",
            WorkflowType.CALENDAR_INTELLIGENCE: "calendar.schedule", 
            WorkflowType.MORNING_BRIEF: "briefing.daily",
            WorkflowType.NEWS_INTELLIGENCE: "news.analyze",
            WorkflowType.VOICE_PROCESSING: "voice.process",
            WorkflowType.PROJECT_CHATBOT: "project.chat",
            WorkflowType.NOTIFICATION_MANAGEMENT: "notification.send",
            WorkflowType.ANALYTICS_LEARNING: "analytics.learn",
            WorkflowType.MASTER_BRAIN: "general.chat",  # Fallback for general conversation
            # Phase 5 Intelligence Features
            WorkflowType.ROUTINE_COACHING: "routine.optimize",
            WorkflowType.PROJECT_INTELLIGENCE: "project.analyze",
            WorkflowType.CALENDAR_OPTIMIZATION: "calendar.optimize",
        }
        return intent_mapping.get(workflow_type, "general.chat")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for N8N API requests"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "RIX-Main-Agent/1.0.0"
        }
        
        if self.api_key:
            headers["X-N8N-API-Key"] = self.api_key
        
        if self.jwt_token:
            headers["X-N8N-JWT"] = self.jwt_token
        
        return headers


# Global N8N client instance
n8n_client = N8NClient()