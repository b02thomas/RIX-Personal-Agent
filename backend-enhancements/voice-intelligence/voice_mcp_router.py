# /Users/benediktthomas/RIX Personal Agent/backend-enhancements/voice-intelligence/voice_mcp_router.py
# Voice MCP Router for RIX Voice Intelligence Phase 2.0 
# Routes voice intents to N8N MCP endpoints for all 7 Intelligence Hubs with multi-language support
# RELEVANT FILES: multilang_intent_classifier.py, enhanced_voice_processor.py, main-agent/app/services/mcp_router.py, main-agent/app/core/config.py

import asyncio
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import aiohttp
import json

from multilang_intent_classifier import IntentCategory, IntentResult


class MCPEndpoint(Enum):
    """MCP endpoint mappings for RIX Intelligence Hubs"""
    TASK_MANAGEMENT = "/mcp/task-management"
    CALENDAR_INTELLIGENCE = "/mcp/calendar-intelligence" 
    ROUTINE_COACHING = "/mcp/routine-coaching"
    PROJECT_INTELLIGENCE = "/mcp/project-intelligence"
    KNOWLEDGE_QUERY = "/mcp/knowledge-query"
    NEWS_INTELLIGENCE = "/mcp/news-intelligence"
    GENERAL_CONVERSATION = "/mcp/general-conversation"


class ResponseLanguage(Enum):
    """Response language preferences"""
    GERMAN = "de"
    ENGLISH = "en"
    AUTO = "auto"


@dataclass
class MCPRequest:
    """MCP request structure"""
    endpoint: MCPEndpoint
    intent: IntentCategory
    text: str
    entities: Dict[str, Any]
    language: str
    context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None


@dataclass
class MCPResponse:
    """MCP response structure"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    language: Optional[str] = None
    action_taken: Optional[str] = None
    follow_up_suggestions: Optional[List[str]] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None


class VoiceMCPRouter:
    """
    Voice MCP Router for RIX Voice Intelligence
    
    Features:
    - Routes voice intents to appropriate N8N MCP endpoints
    - Supports all 7 Intelligence Hubs with specialized routing
    - Multi-language request and response handling (German/English)
    - Timeout management and error handling
    - Response formatting optimized for voice output
    - N8N workflow integration with AI-triggered execution
    - Performance monitoring and statistics
    """

    def __init__(self, n8n_base_url: str, n8n_api_key: str = None):
        """
        Initialize Voice MCP Router
        
        Args:
            n8n_base_url: Base URL for N8N instance
            n8n_api_key: Optional API key for N8N authentication
        """
        self.logger = logging.getLogger(__name__)
        self.n8n_base_url = n8n_base_url.rstrip('/')
        self.n8n_api_key = n8n_api_key
        
        # Intent to endpoint mapping
        self.intent_routing = self._initialize_intent_routing()
        
        # Response templates for different languages
        self.response_templates = self._initialize_response_templates()
        
        # Request configuration
        self.request_config = {
            "timeout": 10.0,  # 10 seconds timeout per request
            "max_retries": 2,
            "retry_delay": 1.0,
            "headers": {
                "Content-Type": "application/json",
                "User-Agent": "RIX-Voice-Intelligence/2.0"
            }
        }
        
        if self.n8n_api_key:
            self.request_config["headers"]["Authorization"] = f"Bearer {self.n8n_api_key}"
        
        # Performance tracking
        self.routing_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "timeouts": 0,
            "average_response_time": 0.0,
            "requests_by_endpoint": {},
            "requests_by_language": {"de": 0, "en": 0},
            "errors_by_type": {},
        }
        
        self.logger.info(f"Voice MCP Router initialized for N8N at {self.n8n_base_url}")

    def _initialize_intent_routing(self) -> Dict[IntentCategory, MCPEndpoint]:
        """Initialize intent to MCP endpoint routing"""
        return {
            # Calendar Intelligence Hub
            IntentCategory.CALENDAR_CREATE: MCPEndpoint.CALENDAR_INTELLIGENCE,
            IntentCategory.CALENDAR_UPDATE: MCPEndpoint.CALENDAR_INTELLIGENCE,
            IntentCategory.CALENDAR_QUERY: MCPEndpoint.CALENDAR_INTELLIGENCE,
            
            # Task Management Hub
            IntentCategory.TASK_CREATE: MCPEndpoint.TASK_MANAGEMENT,
            IntentCategory.TASK_UPDATE: MCPEndpoint.TASK_MANAGEMENT,
            IntentCategory.TASK_QUERY: MCPEndpoint.TASK_MANAGEMENT,
            
            # Routine Management Hub
            IntentCategory.ROUTINE_UPDATE: MCPEndpoint.ROUTINE_COACHING,
            IntentCategory.ROUTINE_QUERY: MCPEndpoint.ROUTINE_COACHING,
            
            # Goal Management Hub (mapped to Project Intelligence)
            IntentCategory.GOAL_STATUS: MCPEndpoint.PROJECT_INTELLIGENCE,
            IntentCategory.GOAL_UPDATE: MCPEndpoint.PROJECT_INTELLIGENCE,
            
            # Knowledge Management Hub
            IntentCategory.KNOWLEDGE_STORE: MCPEndpoint.KNOWLEDGE_QUERY,
            IntentCategory.KNOWLEDGE_QUERY: MCPEndpoint.KNOWLEDGE_QUERY,
            
            # News Intelligence Hub
            IntentCategory.NEWS_REQUEST: MCPEndpoint.NEWS_INTELLIGENCE,
            
            # General Conversation (Fallback)
            IntentCategory.GENERAL_CONVERSATION: MCPEndpoint.GENERAL_CONVERSATION,
        }

    def _initialize_response_templates(self) -> Dict[str, Dict[str, str]]:
        """Initialize response templates for different languages"""
        return {
            "de": {
                "success_generic": "Verstanden! {action} wurde erfolgreich ausgeführt.",
                "error_generic": "Entschuldigung, es gab ein Problem: {error}",
                "timeout_error": "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.",
                "network_error": "Verbindungsproblem zur KI-Verarbeitung. Bitte prüfen Sie Ihre Verbindung.",
                "processing": "Einen Moment bitte, ich verarbeite Ihre Anfrage...",
                "fallback": "Ich habe Sie nicht ganz verstanden. Können Sie das anders formulieren?",
                
                # Hub-specific templates
                "calendar_created": "Termin wurde erfolgreich erstellt: {details}",
                "calendar_queried": "Hier sind Ihre Termine: {details}",
                "task_created": "Aufgabe wurde hinzugefügt: {details}",
                "task_completed": "Aufgabe als erledigt markiert: {details}",
                "routine_updated": "Routine wurde aktualisiert: {details}",
                "goal_status": "Status Ihrer Ziele: {details}",
                "knowledge_stored": "Information wurde gespeichert: {details}",
                "knowledge_retrieved": "Hier ist was ich gefunden habe: {details}",
                "news_summary": "Aktuelle Nachrichten: {details}",
            },
            
            "en": {
                "success_generic": "Got it! {action} was completed successfully.",
                "error_generic": "Sorry, there was a problem: {error}",
                "timeout_error": "The request took too long. Please try again.",
                "network_error": "Connection issue with AI processing. Please check your connection.",
                "processing": "One moment please, I'm processing your request...", 
                "fallback": "I didn't quite understand that. Could you rephrase it?",
                
                # Hub-specific templates
                "calendar_created": "Appointment created successfully: {details}",
                "calendar_queried": "Here are your appointments: {details}",
                "task_created": "Task added: {details}",
                "task_completed": "Task marked as completed: {details}",
                "routine_updated": "Routine updated: {details}",
                "goal_status": "Status of your goals: {details}",
                "knowledge_stored": "Information stored: {details}",
                "knowledge_retrieved": "Here's what I found: {details}",
                "news_summary": "Current news: {details}",
            }
        }

    async def route_voice_intent(
        self, 
        intent_result: IntentResult,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> MCPResponse:
        """
        Route voice intent to appropriate MCP endpoint
        
        Args:
            intent_result: Classified intent with entities
            user_id: Optional user identifier
            session_id: Optional session identifier
            context: Optional additional context
            
        Returns:
            MCPResponse with processed result
        """
        start_time = time.time()
        
        try:
            self.routing_stats["total_requests"] += 1
            
            # Determine target endpoint
            endpoint = self.intent_routing.get(
                intent_result.intent, 
                MCPEndpoint.GENERAL_CONVERSATION
            )
            
            # Create MCP request
            mcp_request = MCPRequest(
                endpoint=endpoint,
                intent=intent_result.intent,
                text=intent_result.raw_text,
                entities=intent_result.entities,
                language=intent_result.metadata.get("detected_language", "de"),
                context=context,
                user_id=user_id,
                session_id=session_id
            )
            
            self.logger.info(
                f"Routing intent {intent_result.intent.value} to {endpoint.value}",
                extra={
                    "intent": intent_result.intent.value,
                    "endpoint": endpoint.value,
                    "language": mcp_request.language,
                    "confidence": intent_result.confidence,
                    "user_id": user_id
                }
            )
            
            # Route to MCP endpoint
            response = await self._send_mcp_request(mcp_request)
            
            # Format response for voice output
            formatted_response = await self._format_voice_response(response, mcp_request)
            
            processing_time = time.time() - start_time
            formatted_response.processing_time = processing_time
            
            # Update statistics
            await self._update_routing_stats(endpoint, mcp_request.language, processing_time, True)
            
            self.routing_stats["successful_requests"] += 1
            
            self.logger.info(
                f"Voice intent routed successfully in {processing_time:.2f}s",
                extra={
                    "processing_time": processing_time,
                    "endpoint": endpoint.value,
                    "success": formatted_response.success
                }
            )
            
            return formatted_response
            
        except asyncio.TimeoutError:
            processing_time = time.time() - start_time
            self.routing_stats["timeouts"] += 1
            self.routing_stats["failed_requests"] += 1
            
            return MCPResponse(
                success=False,
                error="timeout",
                message=self._get_template_message("timeout_error", intent_result.metadata.get("detected_language", "de")),
                language=intent_result.metadata.get("detected_language", "de"),
                processing_time=processing_time
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            self.routing_stats["failed_requests"] += 1
            
            error_type = type(e).__name__
            if error_type not in self.routing_stats["errors_by_type"]:
                self.routing_stats["errors_by_type"][error_type] = 0
            self.routing_stats["errors_by_type"][error_type] += 1
            
            self.logger.error(f"Voice intent routing failed: {e}")
            
            return MCPResponse(
                success=False,
                error=str(e),
                message=self._get_template_message("error_generic", intent_result.metadata.get("detected_language", "de")).format(error=str(e)),
                language=intent_result.metadata.get("detected_language", "de"),
                processing_time=processing_time
            )

    async def _send_mcp_request(self, request: MCPRequest) -> MCPResponse:
        """
        Send request to N8N MCP endpoint
        
        Args:
            request: MCP request to send
            
        Returns:
            MCPResponse from endpoint
        """
        url = f"{self.n8n_base_url}{request.endpoint.value}"
        
        # Prepare request payload
        payload = {
            "intent": request.intent.value,
            "text": request.text,
            "entities": request.entities,
            "language": request.language,
            "user_id": request.user_id,
            "session_id": request.session_id,
            "context": request.context or {},
            "timestamp": datetime.utcnow().isoformat(),
            "source": "voice_intelligence"
        }
        
        timeout = aiohttp.ClientTimeout(total=self.request_config["timeout"])
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            for attempt in range(self.request_config["max_retries"] + 1):
                try:
                    self.logger.debug(f"Sending MCP request to {url} (attempt {attempt + 1})")
                    
                    async with session.post(
                        url,
                        json=payload,
                        headers=self.request_config["headers"]
                    ) as response:
                        
                        if response.status == 200:
                            response_data = await response.json()
                            
                            return MCPResponse(
                                success=True,
                                data=response_data.get("data"),
                                message=response_data.get("message"),
                                language=response_data.get("language", request.language),
                                action_taken=response_data.get("action_taken"),
                                follow_up_suggestions=response_data.get("follow_up_suggestions", [])
                            )
                        else:
                            error_text = await response.text()
                            if attempt < self.request_config["max_retries"]:
                                self.logger.warning(f"MCP request failed with status {response.status}, retrying...")
                                await asyncio.sleep(self.request_config["retry_delay"])
                                continue
                            else:
                                return MCPResponse(
                                    success=False,
                                    error=f"HTTP {response.status}: {error_text}",
                                    language=request.language
                                )
                                
                except aiohttp.ClientError as e:
                    if attempt < self.request_config["max_retries"]:
                        self.logger.warning(f"MCP request failed with client error: {e}, retrying...")
                        await asyncio.sleep(self.request_config["retry_delay"])
                        continue
                    else:
                        return MCPResponse(
                            success=False,
                            error=f"Network error: {str(e)}",
                            language=request.language
                        )
                        
        # Should not reach here, but safety fallback
        return MCPResponse(
            success=False,
            error="Max retries exceeded",
            language=request.language
        )

    async def _format_voice_response(self, response: MCPResponse, request: MCPRequest) -> MCPResponse:
        """
        Format MCP response for voice output
        
        Args:
            response: Raw MCP response
            request: Original MCP request
            
        Returns:
            Formatted MCPResponse optimized for voice
        """
        if not response.success:
            return response
        
        language = response.language or request.language
        
        # Generate voice-optimized message
        if response.message:
            voice_message = response.message
        else:
            # Generate message based on intent type
            voice_message = await self._generate_intent_message(request, response, language)
        
        # Ensure message is not too long for voice output (limit to ~200 characters)
        if len(voice_message) > 200:
            voice_message = voice_message[:197] + "..."
        
        # Update response with voice-optimized message
        response.message = voice_message
        response.language = language
        
        return response

    async def _generate_intent_message(
        self, 
        request: MCPRequest, 
        response: MCPResponse, 
        language: str
    ) -> str:
        """Generate intent-specific voice message"""
        
        templates = self.response_templates.get(language, self.response_templates["de"])
        
        # Extract key details from response data
        details = ""
        if response.data:
            if "title" in response.data:
                details = response.data["title"]
            elif "summary" in response.data:
                details = response.data["summary"]
            elif "result" in response.data:
                details = str(response.data["result"])
            elif "message" in response.data:
                details = response.data["message"]
        
        # Select appropriate template based on intent
        if request.intent == IntentCategory.CALENDAR_CREATE:
            template = templates.get("calendar_created", templates["success_generic"])
        elif request.intent == IntentCategory.CALENDAR_QUERY:
            template = templates.get("calendar_queried", templates["success_generic"])
        elif request.intent == IntentCategory.TASK_CREATE:
            template = templates.get("task_created", templates["success_generic"])
        elif request.intent in [IntentCategory.TASK_UPDATE]:
            template = templates.get("task_completed", templates["success_generic"])
        elif request.intent in [IntentCategory.ROUTINE_UPDATE, IntentCategory.ROUTINE_QUERY]:
            template = templates.get("routine_updated", templates["success_generic"])
        elif request.intent in [IntentCategory.GOAL_STATUS, IntentCategory.GOAL_UPDATE]:
            template = templates.get("goal_status", templates["success_generic"])
        elif request.intent == IntentCategory.KNOWLEDGE_STORE:
            template = templates.get("knowledge_stored", templates["success_generic"])
        elif request.intent == IntentCategory.KNOWLEDGE_QUERY:
            template = templates.get("knowledge_retrieved", templates["success_generic"])
        elif request.intent == IntentCategory.NEWS_REQUEST:
            template = templates.get("news_summary", templates["success_generic"])
        else:
            template = templates["success_generic"]
        
        # Format template with details
        try:
            if "{details}" in template and details:
                return template.format(details=details)
            elif "{action}" in template:
                action = response.action_taken or request.intent.value.replace("_", " ")
                return template.format(action=action)
            else:
                return template
        except KeyError:
            return templates["success_generic"].format(action=request.intent.value.replace("_", " "))

    def _get_template_message(self, template_key: str, language: str) -> str:
        """Get template message for specified language"""
        templates = self.response_templates.get(language, self.response_templates["de"])
        return templates.get(template_key, templates["error_generic"])

    async def _update_routing_stats(
        self, 
        endpoint: MCPEndpoint, 
        language: str, 
        processing_time: float, 
        success: bool
    ):
        """Update routing statistics"""
        try:
            # Update endpoint statistics
            endpoint_name = endpoint.value
            if endpoint_name not in self.routing_stats["requests_by_endpoint"]:
                self.routing_stats["requests_by_endpoint"][endpoint_name] = 0
            self.routing_stats["requests_by_endpoint"][endpoint_name] += 1
            
            # Update language statistics
            if language in self.routing_stats["requests_by_language"]:
                self.routing_stats["requests_by_language"][language] += 1
            
            # Update average response time
            total_requests = self.routing_stats["total_requests"]
            current_avg = self.routing_stats["average_response_time"]
            self.routing_stats["average_response_time"] = (
                (current_avg * (total_requests - 1) + processing_time) / total_requests
            )
            
        except Exception as e:
            self.logger.warning(f"Failed to update routing stats: {e}")

    async def batch_route_intents(
        self, 
        intent_results: List[IntentResult],
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> List[MCPResponse]:
        """
        Route multiple intents in batch
        
        Args:
            intent_results: List of classified intents
            user_id: Optional user identifier
            session_id: Optional session identifier  
            context: Optional shared context
            
        Returns:
            List of MCPResponse objects
        """
        tasks = []
        for intent_result in intent_results:
            task = self.route_voice_intent(intent_result, user_id, session_id, context)
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions in batch processing
        processed_responses = []
        for i, response in enumerate(responses):
            if isinstance(response, Exception):
                self.logger.error(f"Batch routing failed for intent {i}: {response}")
                processed_responses.append(MCPResponse(
                    success=False,
                    error=str(response),
                    language=intent_results[i].metadata.get("detected_language", "de")
                ))
            else:
                processed_responses.append(response)
        
        return processed_responses

    async def get_routing_stats(self) -> Dict[str, Any]:
        """Get routing performance statistics"""
        total_requests = self.routing_stats["total_requests"]
        
        return {
            "total_requests": total_requests,
            "successful_requests": self.routing_stats["successful_requests"],
            "failed_requests": self.routing_stats["failed_requests"],
            "timeouts": self.routing_stats["timeouts"],
            "success_rate": (
                self.routing_stats["successful_requests"] / total_requests
                if total_requests > 0 else 0.0
            ),
            "average_response_time": self.routing_stats["average_response_time"],
            "performance_target_met": self.routing_stats["average_response_time"] < 3.0,
            "requests_by_endpoint": self.routing_stats["requests_by_endpoint"],
            "requests_by_language": self.routing_stats["requests_by_language"],
            "errors_by_type": self.routing_stats["errors_by_type"],
            "supported_endpoints": [e.value for e in MCPEndpoint],
            "supported_languages": ["de", "en"],
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check of the MCP router"""
        try:
            # Test N8N connectivity
            url = f"{self.n8n_base_url}/health"
            timeout = aiohttp.ClientTimeout(total=5.0)
            
            n8n_healthy = False
            try:
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(url, headers=self.request_config["headers"]) as response:
                        n8n_healthy = response.status == 200
            except:
                n8n_healthy = False
            
            stats = await self.get_routing_stats()
            
            return {
                "status": "healthy" if n8n_healthy else "degraded",
                "n8n_connection": n8n_healthy,
                "n8n_base_url": self.n8n_base_url,
                "supported_endpoints": len(MCPEndpoint),
                "supported_languages": ["de", "en"],
                "routing_stats": stats,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }